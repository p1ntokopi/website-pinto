import {
  Armchair,
  Coffee,
  CookingPot,
  Crown,
  FileText,
  History,
  LayoutDashboard,
  MessageSquareQuote,
  QrCode,
  Receipt,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Tags,
  TrendingUp,
  Undo2,
  Users,
  Wallet,
} from 'lucide-react'
import type { UserRole } from '@/lib/auth/roles'

/**
 * One source of truth for the admin navigation.
 *
 * Previously the sidebar, the mobile bottom bar, and the header title map each
 * carried their own copy of this data, which is how "Display Dapur" ended up
 * advertised to owner and staff while /admin/kitchen rejected both, and why
 * /admin/menu/products/new showed the "Detail Produk" heading.
 */

export type NavItem = {
  title: string
  href: string
  icon: typeof LayoutDashboard
  roles: readonly UserRole[]
}

export const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: 'Operasional',
    items: [
      { title: 'Ringkasan', href: '/admin', icon: LayoutDashboard, roles: ['admin', 'staff'] },
      { title: 'Ringkasan Owner', href: '/admin/owner', icon: Crown, roles: ['owner'] },
      { title: 'Pesanan', href: '/admin/orders', icon: ShoppingBag, roles: ['admin', 'staff', 'owner'] },
      { title: 'Pesanan Baru', href: '/admin/orders/new', icon: ShoppingCart, roles: ['admin', 'owner'] },
      { title: 'Meja Langsung', href: '/admin/tables/live', icon: Armchair, roles: ['admin', 'staff', 'owner'] },
      { title: 'Meja & QR', href: '/admin/tables', icon: QrCode, roles: ['admin', 'owner'] },
      // Mirrors KITCHEN_ROLES: staff has no kitchen access, so it is not offered.
      { title: 'Display Dapur', href: '/admin/kitchen', icon: CookingPot, roles: ['admin', 'kitchen', 'owner'] },
    ],
  },
  {
    title: 'Menu',
    items: [
      { title: 'Produk', href: '/admin/menu/products', icon: Coffee, roles: ['admin', 'staff', 'owner'] },
      { title: 'Kategori', href: '/admin/menu/categories', icon: Tags, roles: ['admin', 'owner'] },
    ],
  },
  {
    title: 'Keuangan & Laporan',
    items: [
      { title: 'Ikhtisar Keuangan', href: '/admin/owner/finance', icon: Wallet, roles: ['owner'] },
      { title: 'Analitik Penjualan', href: '/admin/owner/sales', icon: TrendingUp, roles: ['owner'] },
      { title: 'Pengeluaran', href: '/admin/owner/expenses', icon: Receipt, roles: ['owner'] },
      { title: 'Refund & Koreksi', href: '/admin/owner/adjustments', icon: Undo2, roles: ['owner'] },
      { title: 'Laporan Keuangan', href: '/admin/owner/reports', icon: FileText, roles: ['owner'] },
    ],
  },
  {
    title: 'Manajemen',
    items: [
      { title: 'Kelola Admin', href: '/admin/owner/accounts', icon: Users, roles: ['owner'] },
      { title: 'Testimoni', href: '/admin/owner/testimonials', icon: MessageSquareQuote, roles: ['owner'] },
      { title: 'Audit Log', href: '/admin/owner/audit', icon: History, roles: ['owner'] },
      { title: 'Pengaturan', href: '/admin/settings', icon: Settings, roles: ['admin', 'staff', 'owner'] },
    ],
  },
]

/** Drops groups and items the current role may not see. */
export function visibleNavGroups(role: string) {
  return NAV_GROUPS.map((group) => ({
    title: group.title,
    items: group.items.filter((item) => (item.roles as readonly string[]).includes(role)),
  })).filter((group) => group.items.length > 0)
}

/**
 * Mobile bottom bar. Four destinations plus "Lainnya"; the primary cashier
 * action stays reachable in one tap.
 */
export const BOTTOM_NAV: NavItem[] = [
  { title: 'Ringkasan', href: '/admin', icon: LayoutDashboard, roles: ['admin', 'staff'] },
  { title: 'Ringkasan Owner', href: '/admin/owner', icon: Crown, roles: ['owner'] },
  { title: 'Pesanan', href: '/admin/orders', icon: ShoppingBag, roles: ['admin', 'staff', 'owner'] },
  { title: 'Pesanan Baru', href: '/admin/orders/new', icon: ShoppingCart, roles: ['admin', 'owner'] },
  { title: 'Meja', href: '/admin/tables/live', icon: Armchair, roles: ['admin', 'staff', 'owner'] },
]

export function visibleBottomNav(role: string): NavItem[] {
  return BOTTOM_NAV.filter((item) => (item.roles as readonly string[]).includes(role))
}

/**
 * Active-item test. A raw startsWith made /admin/orders light up while the
 * cashier was actually on /admin/orders/new; matching on segment boundaries
 * keeps the highlight on the page you are really looking at.
 */
export function isNavItemActive(pathname: string, href: string): boolean {
  if (pathname === href) return true
  // Exact-only entries that would otherwise swallow their children.
  if (href === '/admin' || href === '/admin/owner') return false
  return pathname.startsWith(`${href}/`)
}

type TitleEntry = { path: string; title: string; match: 'exact' | 'prefix' }

const TITLE_ENTRIES: TitleEntry[] = [
  { path: '/admin', title: 'Ringkasan', match: 'exact' },
  { path: '/admin/owner', title: 'Ringkasan Owner', match: 'exact' },
  { path: '/admin/orders', title: 'Pesanan', match: 'exact' },
  { path: '/admin/orders/new', title: 'Pesanan Baru', match: 'exact' },
  { path: '/admin/orders', title: 'Detail Pesanan', match: 'prefix' },
  { path: '/admin/menu/products', title: 'Produk', match: 'exact' },
  { path: '/admin/menu/products/new', title: 'Tambah Produk', match: 'exact' },
  { path: '/admin/menu/products', title: 'Detail Produk', match: 'prefix' },
  { path: '/admin/menu/categories', title: 'Kategori', match: 'exact' },
  { path: '/admin/tables', title: 'Meja & QR', match: 'exact' },
  { path: '/admin/tables/live', title: 'Meja Langsung', match: 'exact' },
  { path: '/admin/tables', title: 'Meja & QR', match: 'prefix' },
  { path: '/admin/kitchen', title: 'Display Dapur', match: 'exact' },
  { path: '/admin/settings', title: 'Pengaturan', match: 'exact' },
  { path: '/admin/sessions', title: 'Sesi Meja', match: 'prefix' },
  { path: '/admin/receipts', title: 'Struk', match: 'prefix' },
  { path: '/admin/owner/finance', title: 'Ikhtisar Keuangan', match: 'prefix' },
  { path: '/admin/owner/sales', title: 'Analitik Penjualan', match: 'prefix' },
  { path: '/admin/owner/expenses', title: 'Pengeluaran', match: 'prefix' },
  { path: '/admin/owner/adjustments', title: 'Refund & Koreksi', match: 'prefix' },
  { path: '/admin/owner/reports', title: 'Laporan Keuangan', match: 'prefix' },
  { path: '/admin/owner/audit', title: 'Audit Log', match: 'prefix' },
  { path: '/admin/owner/testimonials', title: 'Testimoni Pelanggan', match: 'prefix' },
  { path: '/admin/owner/accounts', title: 'Kelola Admin', match: 'prefix' },
]

export function getPageTitle(pathname: string): string {
  // Exact entries win outright: /admin/menu/products/new must beat the
  // /admin/menu/products prefix that would otherwise claim it.
  const exact = TITLE_ENTRIES.find((e) => e.match === 'exact' && e.path === pathname)
  if (exact) return exact.title

  // Then the most specific prefix, so /admin/tables/live beats /admin/tables.
  const candidates = TITLE_ENTRIES.filter(
    (e) =>
      e.match === 'prefix' &&
      (pathname === e.path || pathname.startsWith(`${e.path}/`))
  ).sort((a, b) => b.path.length - a.path.length)

  return candidates[0]?.title ?? 'Admin'
}