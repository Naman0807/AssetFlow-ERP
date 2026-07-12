from odoo import models, fields, _, api


class AssetFlowAssetCategory(models.Model):
    _name = 'assetflow.asset.category'
    _description = 'Asset Category'
    _inherit = ['mail.thread']
    _order = 'name'

    name = fields.Char(string='Category Name', required=True, tracking=True)
    code = fields.Char(string='Category Code', tracking=True)
    description = fields.Text(string='Description')
    warranty_period = fields.Integer(
        string='Default Warranty Period (months)',
        help='Default warranty period in months for assets in this category'
    )
    asset_ids = fields.One2many(
        'assetflow.asset', 'category_id', string='Assets'
    )
    asset_count = fields.Integer(
        string='Asset Count', compute='_compute_asset_count'
    )
    active = fields.Boolean(string='Active', default=True)

    @api.depends('asset_ids')
    def _compute_asset_count(self):
        for record in self:
            record.asset_count = len(record.asset_ids)
