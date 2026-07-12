from odoo import models, fields


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
