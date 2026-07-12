from odoo import models, fields, api, _
from odoo.exceptions import ValidationError


class AssetFlowAsset(models.Model):
    _name = 'assetflow.asset'
    _description = 'Asset'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _order = 'create_date desc'

    name = fields.Char(string='Asset Name', required=True, tracking=True)
    category_id = fields.Many2one(
        'assetflow.asset.category', string='Category',
        required=True, tracking=True
    )
    asset_tag = fields.Char(
        string='Asset Tag', readonly=True, copy=False,
        required=True, tracking=True
    )
    serial_number = fields.Char(string='Serial Number', tracking=True)
    acquisition_date = fields.Date(string='Acquisition Date', tracking=True)
    acquisition_cost = fields.Float(string='Acquisition Cost', tracking=True)
    condition = fields.Selection([
        ('good', 'Good'),
        ('fair', 'Fair'),
        ('poor', 'Poor'),
    ], string='Condition', default='good', tracking=True)
    location = fields.Char(string='Location', tracking=True)
    photo = fields.Binary(string='Photo', attachment=True)
    is_bookable = fields.Boolean(string='Is Bookable', default=False, tracking=True)
    state = fields.Selection([
        ('available', 'Available'),
        ('allocated', 'Allocated'),
        ('reserved', 'Reserved'),
        ('maintenance', 'Under Maintenance'),
        ('lost', 'Lost'),
        ('retired', 'Retired'),
        ('disposed', 'Disposed'),
    ], string='Status', default='available', tracking=True, required=True)

    allocation_ids = fields.One2many(
        'assetflow.allocation', 'asset_id', string='Allocations'
    )
    active_allocation_id = fields.Many2one(
        'assetflow.allocation', string='Active Allocation',
        compute='_compute_active_allocation', store=True
    )
    booking_ids = fields.One2many(
        'assetflow.booking', 'resource_id', string='Bookings'
    )
    maintenance_ids = fields.One2many(
        'assetflow.maintenance.request', 'asset_id', string='Maintenance Requests'
    )

    @api.depends('allocation_ids', 'allocation_ids.status')
    def _compute_active_allocation(self):
        for record in self:
            active = record.allocation_ids.filtered(
                lambda a: a.status == 'active'
            )
            record.active_allocation_id = active[:1] if active else False

    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            if not vals.get('asset_tag'):
                vals['asset_tag'] = self.env['ir.sequence'].next_by_code(
                    'assetflow.asset'
                ) or 'AF-0000'
        return super().create(vals_list)

    def name_get(self):
        result = []
        for record in self:
            name = record.name
            if record.asset_tag:
                name = f'[{record.asset_tag}] {name}'
            result.append((record.id, name))
        return result

    def action_set_available(self):
        self.write({'state': 'available'})

    def action_allocate(self):
        """Open allocation wizard for this asset"""
        self.ensure_one()
        return {
            'type': 'ir.actions.act_window',
            'name': 'Allocate Asset',
            'res_model': 'assetflow.allocation',
            'view_mode': 'form',
            'target': 'new',
            'context': {
                'default_asset_id': self.id,
            },
        }

    def action_set_lost(self):
        self.write({'state': 'lost'})

    def action_set_retired(self):
        self.write({'state': 'retired'})

    def action_set_disposed(self):
        self.write({'state': 'disposed'})
