from odoo import models, fields, api


class AssetFlowDashboard(models.TransientModel):
    _name = 'assetflow.dashboard'
    _description = 'AssetFlow Dashboard'

    total_assets = fields.Integer(string='Total Assets', compute='_compute_stats')
    available_assets = fields.Integer(string='Available', compute='_compute_stats')
    allocated_assets = fields.Integer(string='Allocated', compute='_compute_stats')
    maintenance_assets = fields.Integer(string='Under Maintenance', compute='_compute_stats')
    lost_assets = fields.Integer(string='Lost', compute='_compute_stats')
    active_bookings = fields.Integer(string='Active Bookings', compute='_compute_stats')
    pending_maintenance = fields.Integer(string='Pending Maintenance', compute='_compute_stats')
    overdue_allocations = fields.Integer(string='Overdue Allocations', compute='_compute_stats')
    open_audit_cycles = fields.Integer(string='Open Audits', compute='_compute_stats')

    @api.depends()
    def _compute_stats(self):
        Asset = self.env['assetflow.asset']
        for record in self:
            record.total_assets = Asset.search_count([])
            record.available_assets = Asset.search_count([('state', '=', 'available')])
            record.allocated_assets = Asset.search_count([('state', '=', 'allocated')])
            record.maintenance_assets = Asset.search_count([('state', '=', 'maintenance')])
            record.lost_assets = Asset.search_count([('state', '=', 'lost')])
            record.active_bookings = self.env['assetflow.booking'].search_count([
                ('status', 'in', ['upcoming', 'ongoing'])
            ])
            record.pending_maintenance = self.env['assetflow.maintenance.request'].search_count([
                ('status', '=', 'pending')
            ])
            record.overdue_allocations = self.env['assetflow.allocation'].search_count([
                ('status', '=', 'active'),
                ('is_overdue', '=', True),
            ])
            record.open_audit_cycles = self.env['assetflow.audit.cycle'].search_count([
                ('status', '=', 'open')
            ])

    def action_view_assets(self):
        return self.env['ir.actions.act_window']._for_xml_id('asset_flow.action_assetflow_asset')

    def action_view_overdue(self):
        return {
            'type': 'ir.actions.act_window',
            'name': 'Overdue Allocations',
            'res_model': 'assetflow.allocation',
            'view_mode': 'tree,form',
            'domain': [('is_overdue', '=', True), ('status', '=', 'active')],
        }

    def action_view_pending_maintenance(self):
        return {
            'type': 'ir.actions.act_window',
            'name': 'Pending Maintenance',
            'res_model': 'assetflow.maintenance.request',
            'view_mode': 'tree,form',
            'domain': [('status', '=', 'pending')],
        }

    def action_view_active_bookings(self):
        return {
            'type': 'ir.actions.act_window',
            'name': 'Active Bookings',
            'res_model': 'assetflow.booking',
            'view_mode': 'tree,form,calendar',
            'domain': [('status', 'in', ['upcoming', 'ongoing'])],
        }

    def action_view_open_audits(self):
        return {
            'type': 'ir.actions.act_window',
            'name': 'Open Audit Cycles',
            'res_model': 'assetflow.audit.cycle',
            'view_mode': 'tree,form',
            'domain': [('status', '=', 'open')],
        }

    def action_view_maintenance_analytics(self):
        return self.env['ir.actions.act_window']._for_xml_id('asset_flow.action_assetflow_maintenance_analytics')

    def action_view_allocation_analytics(self):
        return self.env['ir.actions.act_window']._for_xml_id('asset_flow.action_assetflow_allocation_analytics')
