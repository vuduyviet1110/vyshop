export type UserRole = 'ADMIN' | 'admin' | 'ORDER_MANAGER' | 'order_manager' | 'STAFF' | 'staff' | 'EMPLOYEE' | 'employee' | 'USER' | 'user' | 'customer';

export type AppPermission =
    | 'general'
    | 'products'
    | 'orders'
    | 'categories'
    | 'brands'
    | 'address'
    | 'customers'
    | 'users'
    | 'org-chart'
    | 'blogs'
    | 'analytics'
    | 'policy'
    | 'builder'
    | 'coupons'
    | 'merchandising'
    | 'suppliers'
    | 'inventory'
    | 'cashbook'
    | 'pos';

export const ROLE_PERMISSIONS: Record<string, AppPermission[]> = {
    admin: [
        'general', 'products', 'orders', 'categories', 'brands', 'address',
        'customers', 'users', 'org-chart', 'blogs', 'analytics', 'policy',
        'builder', 'coupons', 'merchandising', 'suppliers', 'inventory',
        'cashbook', 'pos'
    ],
    order_manager: [
        'general', 'orders', 'address', 'customers', 'blogs', 'policy',
        'coupons', 'inventory', 'suppliers', 'cashbook', 'pos'
    ],
    staff: ['orders', 'blogs', 'policy', 'pos'],
    employee: ['orders', 'blogs', 'policy'],
    customer: []
};

export function normalizeRole(role?: string): string {
    if (!role) return 'customer';
    const r = role.toLowerCase();
    if (r === 'admin') return 'admin';
    if (r === 'order_manager') return 'order_manager';
    if (r === 'staff') return 'staff';
    if (r === 'employee') return 'employee';
    return 'customer';
}

export function hasPermission(role: string, isAdminUser: boolean, permission: AppPermission): boolean {
    if (isAdminUser || role.toLowerCase() === 'admin') return true;
    const normalized = normalizeRole(role);
    const perms = ROLE_PERMISSIONS[normalized];
    return perms ? perms.includes(permission) : false;
}
