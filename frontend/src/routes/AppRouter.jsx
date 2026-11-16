/* Declares routes for authentication and the five application areas. */
import { BrowserRouter, Route, Routes } from "react-router-dom";
import ApiTestPage from "../pages/ApiTestPage";
import DashboardLayout from "../layouts/DashboardLayout";
import StorefrontLayout from "../layouts/StorefrontLayout";
import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import SystemSettingsPage from "../pages/admin/SystemSettingsPage";
import UserManagementPage from "../pages/admin/UserManagementPage";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import CartPage from "../pages/customer/CartPage";
import CheckoutPage from "../pages/customer/CheckoutPage";
import OrderHistoryPage from "../pages/customer/OrderHistoryPage";
import RewardWalletPage from "../pages/customer/RewardWalletPage";
import SubscriptionRegisterPage from "../pages/customer/SubscriptionRegisterPage";
import BatchHarvestPage from "../pages/farm/BatchHarvestPage";
import CertificateManagePage from "../pages/farm/CertificateManagePage";
import SeasonManagePage from "../pages/farm/SeasonManagePage";
import CustomerClaimPage from "../pages/sales/CustomerClaimPage";
import FlashSalePage from "../pages/sales/FlashSalePage";
import InventoryFefoPage from "../pages/sales/InventoryFefoPage";
import SalesOrderPage from "../pages/sales/SalesOrderPage";
import BrandStoryPage from "../pages/public/BrandStoryPage";
import HomePage from "../pages/public/HomePage";
import ProductCatalogPage from "../pages/public/ProductCatalogPage";
import ProductDetailPage from "../pages/public/ProductDetailPage";
import QrTraceabilityPage from "../pages/public/QrTraceabilityPage";
import ProtectedRoute from "./ProtectedRoute";
import RoleGuard from "./RoleGuard";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<StorefrontLayout />}>
          <Route index element={<HomePage />} />
          <Route path="products" element={<ProductCatalogPage />} />
          <Route path="products/:productId" element={<ProductDetailPage />} />
          <Route path="brand" element={<BrandStoryPage />} />
          <Route path="trace/:code" element={<QrTraceabilityPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="password-reset/:token" element={<ForgotPasswordPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<RoleGuard roles={["customer"]} />}>
              <Route path="cart" element={<CartPage />} />
              <Route path="checkout" element={<CheckoutPage />} />
              <Route path="subscriptions" element={<SubscriptionRegisterPage />} />
              <Route path="orders" element={<OrderHistoryPage />} />
              <Route path="rewards" element={<RewardWalletPage />} />
            </Route>
          </Route>
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route element={<RoleGuard roles={["farm_staff"]} />}>
              <Route path="farm/seasons" element={<SeasonManagePage />} />
              <Route path="farm/batches" element={<BatchHarvestPage />} />
              <Route path="farm/certificates" element={<CertificateManagePage />} />
            </Route>
            <Route element={<RoleGuard roles={["sales"]} />}>
              <Route path="sales/orders" element={<SalesOrderPage />} />
              <Route path="sales/inventory" element={<InventoryFefoPage />} />
              <Route path="sales/flash-sales" element={<FlashSalePage />} />
              <Route path="sales/claims" element={<CustomerClaimPage />} />
            </Route>
            <Route element={<RoleGuard roles={["admin"]} />}>
              <Route path="admin" element={<AdminDashboardPage />} />
              <Route path="admin/users" element={<UserManagementPage />} />
              <Route path="admin/settings" element={<SystemSettingsPage />} />
            </Route>
          </Route>
        </Route>
        {import.meta.env.DEV && <Route path="test-api" element={<ApiTestPage />} />}
      </Routes>
    </BrowserRouter>
  );
}