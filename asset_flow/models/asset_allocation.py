from odoo import models, fields, api, _
from odoo.exceptions import ValidationError
from datetime import date


class AssetFlowAllocation(models.Model):
    _name = 'assetflow.allocation'
    _description = 'Asset Allocation'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _order = 'allocation_date desc'

    asset_id = fields.Many2one(
        'assetflow.asset', string='Asset', required=True, tracking=True,
        domain="[('state', 'in', ['available', 'allocated'])]"
    )
    employee_id = fields.Many2one(
        'hr.employee', string='Assigned To', required=True, tracking=True
    )
    department_id = fields.Many2one(
        'assetflow.department', string='Department', tracking=True,
        related='employee_id.department_id', store=True
    )
    allocation_date = fields.Date(
        string='Allocation Date', default=fields.Date.context_today,
        required=True, tracking=True
    )
    expected_return_date = fields.Date(
        string='Expected Return Date', required=True, tracking=True
    )
    actual_return_date = fields.Date(
        string='Actual Return Date', tracking=True
    )
    status = fields.Selection([
        ('active', 'Active'),
        ('returned', 'Returned'),
        ('transfer_requested', 'Transfer Requested'),
    ], string='Status', default='active', tracking=True, required=True)
    condition_notes = fields.Text(string='Condition Notes')
    is_overdue = fields.Boolean(
        string='Overdue', compute='_compute_is_overdue', store=True
    )

    @api.depends('expected_return_date', 'status', 'actual_return_date')
    def _compute_is_overdue(self):
        today = date.today()
        for record in self:
            record.is_overdue = (
                record.status == 'active' and
                record.expected_return_date and
                record.expected_return_date < today
            )

    @api.constrains('asset_id', 'status')
    def _check_allocation_conflict(self):
        for record in self:
            if record.status == 'active':
                existing = self.search([
                    ('asset_id', '=', record.asset_id.id),
                    ('status', '=', 'active'),
                    ('id', '!=', record.id),
                ])
                if existing:
                    employee_name = existing.employee_id.name or 'another employee'
                    raise ValidationError(
                        _('This asset is currently held by %s. '
                          'Please raise a Transfer Request instead.') % employee_name
                    )

    @api.constrains('expected_return_date', 'allocation_date')
    def _check_return_date(self):
        for record in self:
            if record.expected_return_date and record.allocation_date:
                if record.expected_return_date < record.allocation_date:
                    raise ValidationError(
                        _('Expected return date cannot be before allocation date!')
                    )

    def action_return_asset(self):
        self.write({
            'status': 'returned',
            'actual_return_date': fields.Date.context_today(self),
        })
        self.mapped('asset_id').write({'state': 'available'})

    def action_request_transfer(self):
        self.write({'status': 'transfer_requested'})

    def _cron_check_overdue(self):
        """Called daily by ir.cron. Creates activities for overdue allocations."""
        today = date.today()
        overdue = self.search([
            ('status', '=', 'active'),
            ('expected_return_date', '<', today),
            ('expected_return_date', '!=', False),
        ])
        for allocation in overdue:
            allocation.activity_schedule(
                'mail.mail_activity_data_todo',
                user_id=allocation.employee_id.user_id.id,
                summary='Overdue Asset Return: %s' % allocation.asset_id.name,
                note='Asset %s was due on %s. Please return it immediately.' % (
                    allocation.asset_id.asset_tag,
                    allocation.expected_return_date.strftime('%Y-%m-%d'),
                ),
            )
            allocation.message_post(
                body='<b>Overdue:</b> Asset <b>%s</b> was due on %s and has not been returned.' % (
                    allocation.asset_id.asset_tag,
                    allocation.expected_return_date.strftime('%Y-%m-%d'),
                ),
                message_type='notification',
            )
