import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { RoleRedirect } from '@/components/layout/RoleRedirect'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { SellerLayout } from '@/components/layout/SellerLayout'
import { CustomerLayout } from '@/components/layout/CustomerLayout'

// Public pages
import { Login } from '@/pages/Login'
import { Register } from '@/pages/Register'
import { FacebookReturnPage } from '@/pages/auth/FacebookReturnPage'
import { NotFound } from '@/pages/NotFound'

// Admin pages
import { AdminDashboard } from '@/pages/admin/AdminDashboard'
import { AdminMerchants } from '@/pages/admin/AdminMerchants'
import { AdminMerchantDetail } from '@/pages/admin/AdminMerchantDetail'
import { AdminProducts } from '@/pages/admin/AdminProducts'
import { AdminApprovals } from '@/pages/admin/AdminApprovals'
import { AdminOrders } from '@/pages/admin/AdminOrders'
import { AdminReports } from '@/pages/admin/AdminReports'
import { AdminIntegrations } from '@/pages/admin/AdminIntegrations'
import { AdminSettings } from '@/pages/admin/AdminSettings'
import { AdminWithdrawals } from '@/pages/admin/AdminWithdrawals'
import AdminCRM from '@/pages/admin/AdminCRM'
import { AdminCustomers } from '@/pages/admin/AdminCustomers'
import { AdminReturns } from '@/pages/admin/AdminReturns'
import { AdminCategories } from '@/pages/admin/AdminCategories'

// Seller pages
import { SellerSetup } from '@/pages/seller/SellerSetup'
import { SellerDashboard } from '@/pages/seller/SellerDashboard'
import { SellerProducts } from '@/pages/seller/SellerProducts'
import { SellerProductEdit } from '@/pages/seller/SellerProductEdit'
import { SellerOrders } from '@/pages/seller/SellerOrders'
import { SellerOrderDetail } from '@/pages/seller/SellerOrderDetail'
import { SellerPromotions } from '@/pages/seller/SellerPromotions'
import { SellerShipping } from '@/pages/seller/SellerShipping'
import { SellerWallet } from '@/pages/seller/SellerWallet'
import { SellerProfile } from '@/pages/seller/SellerProfile'
import { SellerReturns } from '@/pages/seller/SellerReturns'

// Customer pages
import { Shop } from '@/pages/customer/Shop'
import { ProductDetail } from '@/pages/customer/ProductDetail'
import { MerchantPage } from '@/pages/customer/MerchantPage'
import { Cart } from '@/pages/customer/Cart'
import { Checkout } from '@/pages/customer/Checkout'
import { Tracking } from '@/pages/customer/Tracking'
import { Account } from '@/pages/customer/Account'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth/fb-return" element={<FacebookReturnPage />} />

        {/* Root redirect — authenticated users go to their role home */}
        <Route path="/" element={<RoleRedirect />} />

        {/* Admin portal */}
        <Route element={<ProtectedRoute requiredRole="admin" />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/merchants" element={<AdminMerchants />} />
            <Route path="/admin/merchants/:id" element={<AdminMerchantDetail />} />
            <Route path="/admin/products" element={<AdminProducts />} />
            <Route path="/admin/approvals" element={<AdminApprovals />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
            <Route path="/admin/reports" element={<AdminReports />} />
            <Route path="/admin/integrations" element={<AdminIntegrations />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/admin/withdrawals" element={<AdminWithdrawals />} />
            <Route path="/admin/customers" element={<AdminCustomers />} />
            <Route path="/admin/returns" element={<AdminReturns />} />
            <Route path="/admin/categories" element={<AdminCategories />} />
            <Route path="/admin/crm" element={<AdminCRM />} />
          </Route>
        </Route>

        {/* Seller portal */}
        <Route element={<ProtectedRoute requiredRole="seller" />}>
          {/* Setup is outside the layout — full page standalone */}
          <Route path="/seller/setup" element={<SellerSetup />} />
          <Route element={<SellerLayout />}>
            <Route path="/seller" element={<Navigate to="/seller/dashboard" replace />} />
            <Route path="/seller/dashboard" element={<SellerDashboard />} />
            <Route path="/seller/products" element={<SellerProducts />} />
            <Route path="/seller/products/new" element={<SellerProductEdit />} />
            <Route path="/seller/products/:id/edit" element={<SellerProductEdit />} />
            <Route path="/seller/orders" element={<SellerOrders />} />
            <Route path="/seller/orders/:id" element={<SellerOrderDetail />} />
            <Route path="/seller/promotions" element={<SellerPromotions />} />
            <Route path="/seller/shipping" element={<SellerShipping />} />
            <Route path="/seller/wallet" element={<SellerWallet />} />
            <Route path="/seller/profile" element={<SellerProfile />} />
            <Route path="/seller/returns" element={<SellerReturns />} />
          </Route>
        </Route>

        {/* Customer / shop portal — accessible without login (public browse) */}
        <Route element={<CustomerLayout />}>
          <Route path="/shop" element={<Shop />} />
          <Route path="/shop/products/:id" element={<ProductDetail />} />
          <Route path="/shop/merchants/:id" element={<MerchantPage />} />
          <Route path="/shop/tracking" element={<Tracking />} />
          {/* Cart, checkout, account require auth */}
          <Route element={<ProtectedRoute requiredRole="customer" />}>
            <Route path="/shop/cart" element={<Cart />} />
            <Route path="/shop/checkout" element={<Checkout />} />
            <Route path="/shop/account" element={<Account />} />
          </Route>
        </Route>

        {/* Legacy /cart shorthand */}
        <Route path="/cart" element={<Navigate to="/shop/cart" replace />} />
        <Route path="/account" element={<Navigate to="/shop/account" replace />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
