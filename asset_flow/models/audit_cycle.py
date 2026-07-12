from odoo import models, fields, api, _
from odoo.exceptions import ValidationError


class AssetFlowAuditCycle(models.Model):
    _name = 'assetflow.audit.cycle'
    _description = 'Audit Cycle'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _order = 'create_date desc'

    name = fields.Char(string='Audit Cycle Name', required=True, tracking=True)
    scope_department_id = fields.Many2one(
        'assetflow.department', string='Scope Department', tracking=True,
        help='If set, only assets in this department are included'
    )
    location = fields.Char(string='Location', tracking=True)
    date_from = fields.Date(string='Start Date', required=True, tracking=True)
    date_to = fields.Date(string='End Date', required=True, tracking=True)
    auditor_ids = fields.Many2many(
        'hr.employee', 'audit_cycle_auditor_rel',
        string='Auditors', tracking=True
    )
    status = fields.Selection([
        ('open', 'Open'),
        ('closed', 'Closed'),
    ], string='Status', default='open', tracking=True, required=True)
    audit_item_ids = fields.One2many(
        'assetflow.audit.item', 'cycle_id', string='Audit Items'
    )
    item_count = fields.Integer(
        string='Items', compute='_compute_item_count'
    )
    verified_count = fields.Integer(
        string='Verified', compute='_compute_verification_stats'
    )
    missing_count = fields.Integer(
        string='Missing', compute='_compute_verification_stats'
    )
    damaged_count = fields.Integer(
        string='Damaged', compute='_compute_verification_stats'
    )

    @api.depends('audit_item_ids')
    def _compute_item_count(self):
        for record in self:
            record.item_count = len(record.audit_item_ids)

    @api.depends('audit_item_ids.verification_status')
    def _compute_verification_stats(self):
        for record in self:
            items = record.audit_item_ids
            record.verified_count = len(items.filtered(
                lambda i: i.verification_status == 'verified'
            ))
            record.missing_count = len(items.filtered(
                lambda i: i.verification_status == 'missing'
            ))
            record.damaged_count = len(items.filtered(
                lambda i: i.verification_status == 'damaged'
            ))

    @api.constrains('date_from', 'date_to')
    def _check_dates(self):
        for record in self:
            if record.date_to < record.date_from:
                raise ValidationError(_('End date must be after start date!'))

    def action_close_cycle(self):
        for record in self:
            if record.status == 'closed':
                raise ValidationError(_('This audit cycle is already closed!'))
            missing_items = record.audit_item_ids.filtered(
                lambda i: i.verification_status == 'missing'
            )
            for item in missing_items:
                item.asset_id.write({'state': 'lost'})
            record.write({'status': 'closed'})

    def action_generate_items(self):
        self.ensure_one()
        domain = [('state', '!=', 'disposed')]
        if self.scope_department_id:
            domain.append(
                ('location', '=', self.scope_department_id.name)
            )
        assets = self.env['assetflow.asset'].search(domain)
        existing_asset_ids = self.audit_item_ids.mapped('asset_id').ids
        new_assets = assets.filtered(lambda a: a.id not in existing_asset_ids)

        vals_list = []
        for asset in new_assets:
            vals_list.append({
                'cycle_id': self.id,
                'asset_id': asset.id,
            })
        if vals_list:
            self.env['assetflow.audit.item'].create(vals_list)
