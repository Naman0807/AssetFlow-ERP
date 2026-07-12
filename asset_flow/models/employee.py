from odoo import models, fields


class HrEmployee(models.Model):
    _inherit = 'hr.employee'

    assetflow_role = fields.Selection([
        ('employee', 'Employee'),
        ('dept_head', 'Department Head'),
        ('asset_manager', 'Asset Manager'),
        ('admin', 'Admin'),
    ], string='AssetFlow Role', default='employee', tracking=True)

    allocated_asset_ids = fields.One2many(
        'assetflow.allocation', 'employee_id', string='Allocated Assets'
    )
    booking_ids = fields.One2many(
        'assetflow.booking', 'employee_id', string='Bookings'
    )
    maintenance_request_ids = fields.One2many(
        'assetflow.maintenance.request', 'employee_id', string='Maintenance Requests'
    )

    def action_promote_to_manager(self):
        self.write({'assetflow_role': 'asset_manager'})

    def action_promote_to_dept_head(self):
        self.write({'assetflow_role': 'dept_head'})

    def action_promote_to_admin(self):
        self.write({'assetflow_role': 'admin'})
