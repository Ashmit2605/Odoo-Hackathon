export const ROLE_HOME = {
  ADMIN:    '/admin/dashboard',
  STAFF:    '/staff/dashboard',
  CUSTOMER: '/customer/dashboard',
};

export function homeForRole(role) {
  return ROLE_HOME[role] ?? '/';
}