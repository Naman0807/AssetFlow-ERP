export const ASSET_STATUSES = ['Available', 'Allocated', 'Reserved', 'Under Maintenance', 'Lost', 'Retired', 'Disposed'] as const;
export type AssetStatus = typeof ASSET_STATUSES[number];

export const ALLOCATION_STATUSES = ['Active', 'Returned'] as const;
export const BOOKING_STATUSES = ['Upcoming', 'Ongoing', 'Completed', 'Cancelled'] as const;
export const MAINTENANCE_STATUSES = ['Pending', 'Approved', 'Rejected', 'Technician Assigned', 'In Progress', 'Resolved'] as const;
export const TRANSFER_STATUSES = ['Requested', 'Approved', 'Rejected'] as const;
export const AUDIT_STATUSES = ['Verified', 'Missing', 'Damaged'] as const;

export const USER_ROLES = ['Employee', 'Asset Manager', 'Department Head', 'Admin'] as const;
export type UserRole = typeof USER_ROLES[number];

export const STATUS_COLORS: Record<string, string> = {
  Available: 'bg-green-100 text-green-800',
  Allocated: 'bg-blue-100 text-blue-800',
  Reserved: 'bg-yellow-100 text-yellow-800',
  'Under Maintenance': 'bg-orange-100 text-orange-800',
  Lost: 'bg-red-100 text-red-800',
  Retired: 'bg-gray-100 text-gray-800',
  Disposed: 'bg-gray-100 text-gray-500',
  Active: 'bg-blue-100 text-blue-800',
  Returned: 'bg-green-100 text-green-800',
  Upcoming: 'bg-indigo-100 text-indigo-800',
  Ongoing: 'bg-yellow-100 text-yellow-800',
  Completed: 'bg-green-100 text-green-800',
  Cancelled: 'bg-gray-100 text-gray-500',
  Pending: 'bg-yellow-100 text-yellow-800',
  Approved: 'bg-blue-100 text-blue-800',
  Rejected: 'bg-red-100 text-red-800',
  'Technician Assigned': 'bg-purple-100 text-purple-800',
  'In Progress': 'bg-orange-100 text-orange-800',
  Resolved: 'bg-green-100 text-green-800',
  Requested: 'bg-yellow-100 text-yellow-800',
  Verified: 'bg-green-100 text-green-800',
  Missing: 'bg-red-100 text-red-800',
  Damaged: 'bg-orange-100 text-orange-800',
};

export const PRIORITY_COLORS: Record<string, string> = {
  Low: 'bg-gray-100 text-gray-800',
  Medium: 'bg-yellow-100 text-yellow-800',
  High: 'bg-orange-100 text-orange-800',
  Critical: 'bg-red-100 text-red-800',
};

export const ROLE_HIERARCHY: Record<string, number> = {
  Employee: 0,
  'Department Head': 1,
  'Asset Manager': 2,
  Admin: 3,
};

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
