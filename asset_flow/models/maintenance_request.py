from odoo import models, fields, api, _


class AssetFlowMaintenanceRequest(models.Model):
    _name = 'assetflow.maintenance.request'
    _description = 'Maintenance Request'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _order = 'create_date desc'

    name = fields.Char(string='Request Reference', readonly=True, copy=False)
    asset_id = fields.Many2one(
        'assetflow.asset', string='Asset', required=True, tracking=True
    )
    employee_id = fields.Many2one(
        'hr.employee', string='Requested By', required=True, tracking=True,
        default=lambda self: self.env.user.employee_id
    )
    department_id = fields.Many2one(
        'assetflow.department', string='Department',
        related='employee_id.department_id', store=True
    )
    issue_description = fields.Text(string='Issue Description', required=True)
    priority = fields.Selection([
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ], string='Priority', default='medium', required=True, tracking=True)
    photo = fields.Binary(string='Photo', attachment=True)
    status = fields.Selection([
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('technician_assigned', 'Technician Assigned'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
    ], string='Status', default='pending', tracking=True, required=True)
    approved_by = fields.Many2one(
        'res.users', string='Approved By', tracking=True
    )
    technician_id = fields.Many2one(
        'hr.employee', string='Assigned Technician', tracking=True
    )
    request_date = fields.Date(
        string='Request Date', default=fields.Date.context_today, readonly=True
    )
    resolution_date = fields.Date(string='Resolution Date', readonly=True)
    resolution_notes = fields.Text(string='Resolution Notes')

    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            if not vals.get('name'):
                vals['name'] = self.env['ir.sequence'].next_by_code(
                    'assetflow.maintenance.request'
                ) or 'MR-0000'
        return super().create(vals_list)

    def action_approve(self):
        for record in self:
            record.write({
                'status': 'approved',
                'approved_by': self.env.user.id,
            })
            record.asset_id.write({'state': 'maintenance'})
            record.message_post(
                body='<b>Approved by</b> %s' % self.env.user.name,
                message_type='notification',
            )

    def action_reject(self):
        self.write({
            'status': 'rejected',
            'approved_by': self.env.user.id,
        })
        self.message_post(
            body='<b>Rejected by</b> %s' % self.env.user.name,
            message_type='notification',
        )

    def action_assign_technician(self):
        self.write({'status': 'technician_assigned'})

    def action_start_work(self):
        self.write({'status': 'in_progress'})

    def action_resolve(self):
        for record in self:
            record.write({
                'status': 'resolved',
                'resolution_date': fields.Date.context_today(self),
            })
            record.asset_id.write({'state': 'available'})
            record.message_post(
                body='<b>Resolved:</b> %s' % (record.resolution_notes or 'No notes provided.'),
                message_type='notification',
            )
