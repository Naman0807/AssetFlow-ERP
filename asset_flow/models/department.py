from odoo import models, fields, api, _
from odoo.exceptions import ValidationError


class AssetFlowDepartment(models.Model):
    _name = 'assetflow.department'
    _description = 'Department'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _order = 'name'

    name = fields.Char(string='Department Name', required=True, tracking=True)
    code = fields.Char(string='Department Code', required=True, tracking=True)
    department_head_id = fields.Many2one(
        'hr.employee', string='Department Head', tracking=True,
        help='The employee who heads this department'
    )
    parent_id = fields.Many2one(
        'assetflow.department', string='Parent Department',
        domain="[('id', '!=', id)]", tracking=True
    )
    child_ids = fields.One2many(
        'assetflow.department', 'parent_id', string='Sub Departments'
    )
    employee_ids = fields.One2many(
        'hr.employee', 'department_id', string='Employees'
    )
    employee_count = fields.Integer(
        string='Employee Count', compute='_compute_employee_count'
    )
    active = fields.Boolean(string='Active', default=True, tracking=True)
    note = fields.Text(string='Notes')

    @api.depends('employee_ids')
    def _compute_employee_count(self):
        for record in self:
            record.employee_count = len(record.employee_ids)

    @api.constrains('parent_id')
    def _check_parent_recursion(self):
        if not self._check_recursion():
            raise ValidationError(_('You cannot create a recursive department hierarchy!'))

    def name_get(self):
        result = []
        for record in self:
            name = record.name
            if record.code:
                name = f'[{record.code}] {name}'
            result.append((record.id, name))
        return result
