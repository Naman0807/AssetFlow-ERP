from odoo import models, fields, api
from odoo.exceptions import ValidationError
from datetime import date


class AssetFlowAuditItem(models.Model):
    _name = 'assetflow.audit.item'
    _description = 'Audit Item'
    _order = 'create_date'

    cycle_id = fields.Many2one(
        'assetflow.audit.cycle', string='Audit Cycle',
        required=True, ondelete='cascade'
    )
    asset_id = fields.Many2one(
        'assetflow.asset', string='Asset', required=True
    )
    verification_status = fields.Selection([
        ('verified', 'Verified'),
        ('missing', 'Missing'),
        ('damaged', 'Damaged'),
    ], string='Verification Status')
    notes = fields.Text(string='Notes')
    verified_by = fields.Many2one(
        'hr.employee', string='Verified By'
    )
    verification_date = fields.Date(string='Verification Date')

    def action_verify(self):
        for record in self:
            record.write({
                'verification_status': 'verified',
                'verified_by': self.env.user.employee_id.id,
                'verification_date': date.today(),
            })

    def action_flag_missing(self):
        for record in self:
            record.write({
                'verification_status': 'missing',
                'verified_by': self.env.user.employee_id.id,
                'verification_date': date.today(),
            })

    def action_flag_damaged(self):
        for record in self:
            record.write({
                'verification_status': 'damaged',
                'verified_by': self.env.user.employee_id.id,
                'verification_date': date.today(),
            })
