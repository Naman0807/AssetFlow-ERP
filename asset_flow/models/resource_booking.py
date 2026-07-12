from odoo import models, fields, api, _
from odoo.exceptions import ValidationError
from datetime import datetime


class AssetFlowBooking(models.Model):
    _name = 'assetflow.booking'
    _description = 'Resource Booking'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _order = 'start_datetime desc'

    resource_id = fields.Many2one(
        'assetflow.asset', string='Resource', required=True, tracking=True,
        domain="[('is_bookable', '=', True), ('state', 'in', ['available', 'reserved'])]"
    )
    employee_id = fields.Many2one(
        'hr.employee', string='Booked By', required=True, tracking=True,
        default=lambda self: self.env.user.employee_id
    )
    start_datetime = fields.Datetime(
        string='Start Date & Time', required=True, tracking=True
    )
    end_datetime = fields.Datetime(
        string='End Date & Time', required=True, tracking=True
    )
    status = fields.Selection([
        ('upcoming', 'Upcoming'),
        ('ongoing', 'Ongoing'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ], string='Status', default='upcoming', tracking=True, required=True)
    purpose = fields.Text(string='Purpose')
    department_id = fields.Many2one(
        'assetflow.department', string='Department',
        related='employee_id.department_id', store=True
    )

    @api.constrains('resource_id', 'start_datetime', 'end_datetime')
    def _check_booking_overlap(self):
        for record in self:
            if not record.start_datetime or not record.end_datetime:
                continue
            if record.end_datetime <= record.start_datetime:
                raise ValidationError(
                    _('End date/time must be after start date/time!')
                )
            overlapping = self.search([
                ('resource_id', '=', record.resource_id.id),
                ('id', '!=', record.id),
                ('status', 'not in', ['cancelled']),
                ('start_datetime', '<', record.end_datetime),
                ('end_datetime', '>', record.start_datetime),
            ])
            if overlapping:
                raise ValidationError(
                    _('This resource is already booked from %s to %s. '
                      'Please choose a different time slot.') % (
                        overlapping[0].start_datetime.strftime('%Y-%m-%d %H:%M'),
                        overlapping[0].end_datetime.strftime('%Y-%m-%d %H:%M'),
                    )
                )

    @api.onchange('start_datetime')
    def _onchange_start_datetime(self):
        if self.start_datetime and not self.end_datetime:
            self.end_datetime = self.start_datetime.replace(
                hour=17, minute=0, second=0
            )

    def action_confirm_booking(self):
        self.write({'status': 'ongoing'})
        self.resource_id.write({'state': 'reserved'})
        self.message_post(
            body='<b>Booking Started:</b> %s booked by %s' % (
                self.resource_id.name, self.employee_id.name),
            message_type='notification',
        )

    def action_complete_booking(self):
        self.write({'status': 'completed'})
        self.resource_id.write({'state': 'available'})
        self.message_post(
            body='<b>Booking Completed:</b> %s returned by %s' % (
                self.resource_id.name, self.employee_id.name),
            message_type='notification',
        )

    def action_cancel_booking(self):
        self.write({'status': 'cancelled'})
        if self.resource_id.state == 'reserved':
            self.resource_id.write({'state': 'available'})
        self.message_post(
            body='<b>Booking Cancelled:</b> %s was cancelled by %s' % (
                self.resource_id.name, self.employee_id.name),
            message_type='notification',
        )
