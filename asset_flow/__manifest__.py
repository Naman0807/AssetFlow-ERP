{
    'name': 'AssetFlow',
    'version': '17.0.1.0.0',
    'category': 'Inventory',
    'summary': 'Enterprise Asset & Resource Management System',
    'description': """
        AssetFlow - Enterprise Asset & Resource Management System

        Features:
        - Asset lifecycle tracking with auto-generated asset tags
        - Department and employee directory management
        - Asset allocation with conflict detection
        - Resource booking with overlap validation
        - Maintenance request workflow
        - Audit cycle management
        - Dashboard with KPIs and analytics
    """,
    'author': 'AssetFlow Team',
    'website': 'https://github.com/assetflow',
    'license': 'LGPL-3',
    'depends': ['base', 'mail', 'hr'],
    'data': [
        'security/security_groups.xml',
        'security/ir.model.access.csv',
        'data/sequence_data.xml',
        'views/department_views.xml',
        'views/asset_category_views.xml',
        'views/employee_views.xml',
        'views/allocation_views.xml',
        'views/booking_views.xml',
        'views/maintenance_views.xml',
        'views/asset_views.xml',
        'views/audit_views.xml',
        'views/dashboard_views.xml',
        'views/menu_views.xml',
        'reports/discrepancy_report.xml',
    ],
    'demo': [],
    'installable': True,
    'application': True,
    'auto_install': False,
}
