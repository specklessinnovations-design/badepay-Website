import React from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SplashScreen } from "@/components/ui/splash-screen";
import { CookieConsentBanner } from "@/components/ui/cookie-consent-banner";
import AuthBootstrap from "@/components/auth/AuthBootstrap";

// Pages
import LandingPage from "@/app/page";
import LoginPage from "@/app/(auth)/login/page";
import RegisterPage from "@/app/(auth)/register/page";
import ForgotPasswordPage from "@/app/(auth)/forgot-password/page";
import ResetPasswordPage from "@/app/(auth)/reset-password/page";
import VerifyOtpPage from "@/app/(auth)/verify-otp/page";
import SetPinPage from "@/app/(auth)/set-pin/page";
import AuthLayout from "@/app/(auth)/layout";

import DashboardPage from "@/app/(dashboard)/dashboard/page";
import ActivityPage from "@/app/(dashboard)/activity/page";
import AddMoneyPage from "@/app/(dashboard)/add-money/page";
import BillsPage from "@/app/(dashboard)/bills/page";
import CardsPage from "@/app/(dashboard)/cards/page";
import HistoryPage from "@/app/(dashboard)/history/page";
import ScanPage from "@/app/(dashboard)/scan/page";
import StoresPage from "@/app/(dashboard)/stores/page";
import TransferPage from "@/app/(dashboard)/transfer/page";
import TransactionSuccessPage from "@/app/(dashboard)/transaction/success/page";
import TransactionFailedPage from "@/app/(dashboard)/transaction/failed/page";
import TransactionDetailPage from "@/app/(dashboard)/transaction/detail/page";
import ProfilePage from "@/app/(dashboard)/profile/page";
import ProfileEditPage from "@/app/(dashboard)/profile/edit/page";
import ProfileSecurityPage from "@/app/(dashboard)/profile/security/page";
import ProfileKycPage from "@/app/(dashboard)/profile/kyc/page";
import ProfileDevicesPage from "@/app/(dashboard)/profile/devices/page";
import ProfileNotificationsPage from "@/app/(dashboard)/profile/notifications/page";
import ProfileSupportPage from "@/app/(dashboard)/profile/support/page";
import ProfileStatementsPage from "@/app/(dashboard)/profile/statements/page";
import ChangePinPage from "@/app/(dashboard)/profile/change-pin/page";
import ChangePasswordPage from "@/app/(dashboard)/profile/change-password/page";
import AIAssistantPage from "@/app/(dashboard)/ai/page";
import ExploreNigeriaPage from "@/app/(dashboard)/explore-nigeria/page";
import DashboardLayout from "@/app/(dashboard)/layout";

import AdminLoginPage from "@/app/admin/login/page";
import AdminDashboardPage from "@/app/admin/dashboard/page";
import AdminUsersPage from "@/app/admin/users/page";
import AdminUserDetailPage from "@/app/admin/users/[id]/page";
import AdminMerchantsPage from "@/app/admin/merchants/page";
import AdminMerchantDetailPage from "@/app/admin/merchants/[id]/page";
import AdminTransactionsPage from "@/app/admin/transactions/page";
import AdminKycPage from "@/app/admin/kyc/page";
import AdminDisputesPage from "@/app/admin/disputes/page";
import AdminAnalyticsPage from "@/app/admin/analytics/page";
import AdminSettingsPage from "@/app/admin/settings/page";
import AdminBillsPage from "@/app/admin/bills/page";
import AdminExploreNigeriaPage from "@/app/admin/explore-nigeria/page";
import AdminLayout from "@/app/admin/layout";

import MerchantPage from "@/app/merchant/page";
import MerchantOnboardingPage from "@/app/merchant/onboarding/page";
import MerchantPaymentsPage from "@/app/merchant/payments/page";
import MerchantQrPage from "@/app/merchant/qr/page";
import MerchantSettlementsPage from "@/app/merchant/settlements/page";
import MerchantStorePage from "@/app/merchant/store/page";
import MerchantOrdersPage from "@/app/merchant/orders/page";
import MerchantLayout from "@/app/merchant/layout";
import CustomerStore from "@/app/store/page";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />

      {/* Auth routes */}
      <Route path="/login">
        <AuthLayout><LoginPage /></AuthLayout>
      </Route>
      <Route path="/register">
        <AuthLayout><RegisterPage /></AuthLayout>
      </Route>
      <Route path="/forgot-password">
        <AuthLayout><ForgotPasswordPage /></AuthLayout>
      </Route>
      <Route path="/reset-password">
        <AuthLayout><ResetPasswordPage /></AuthLayout>
      </Route>
      <Route path="/verify-otp">
        <AuthLayout><VerifyOtpPage /></AuthLayout>
      </Route>
      <Route path="/set-pin">
        <AuthLayout><SetPinPage /></AuthLayout>
      </Route>

      {/* Dashboard routes */}
      <Route path="/dashboard">
        <DashboardLayout><DashboardPage /></DashboardLayout>
      </Route>
      <Route path="/activity">
        <DashboardLayout><ActivityPage /></DashboardLayout>
      </Route>
      <Route path="/add-money">
        <DashboardLayout><AddMoneyPage /></DashboardLayout>
      </Route>
      <Route path="/bills">
        <DashboardLayout><BillsPage /></DashboardLayout>
      </Route>
      <Route path="/cards">
        <DashboardLayout><CardsPage /></DashboardLayout>
      </Route>
      <Route path="/history">
        <DashboardLayout><HistoryPage /></DashboardLayout>
      </Route>
      <Route path="/scan">
        <DashboardLayout><ScanPage /></DashboardLayout>
      </Route>
      <Route path="/stores">
        <DashboardLayout><StoresPage /></DashboardLayout>
      </Route>
      <Route path="/transfer">
        <DashboardLayout><TransferPage /></DashboardLayout>
      </Route>
      <Route path="/transaction/success">
        <DashboardLayout><TransactionSuccessPage /></DashboardLayout>
      </Route>
      <Route path="/transaction/failed">
        <DashboardLayout><TransactionFailedPage /></DashboardLayout>
      </Route>
      <Route path="/transaction/detail">
        <DashboardLayout><TransactionDetailPage /></DashboardLayout>
      </Route>
      <Route path="/profile/edit">
        <DashboardLayout><ProfileEditPage /></DashboardLayout>
      </Route>
      <Route path="/profile/security">
        <DashboardLayout><ProfileSecurityPage /></DashboardLayout>
      </Route>
      <Route path="/profile/kyc">
        <DashboardLayout><ProfileKycPage /></DashboardLayout>
      </Route>
      <Route path="/profile/devices">
        <DashboardLayout><ProfileDevicesPage /></DashboardLayout>
      </Route>
      <Route path="/profile/notifications">
        <DashboardLayout><ProfileNotificationsPage /></DashboardLayout>
      </Route>
      <Route path="/profile/support">
        <DashboardLayout><ProfileSupportPage /></DashboardLayout>
      </Route>
      <Route path="/profile/statements">
        <DashboardLayout><ProfileStatementsPage /></DashboardLayout>
      </Route>
      <Route path="/profile/change-pin">
        <DashboardLayout><ChangePinPage /></DashboardLayout>
      </Route>
      <Route path="/profile/change-password">
        <DashboardLayout><ChangePasswordPage /></DashboardLayout>
      </Route>
      <Route path="/ai">
        <DashboardLayout><AIAssistantPage /></DashboardLayout>
      </Route>
      <Route path="/explore-nigeria">
        <DashboardLayout><ExploreNigeriaPage /></DashboardLayout>
      </Route>
      <Route path="/profile">
        <DashboardLayout><ProfilePage /></DashboardLayout>
      </Route>

      {/* Admin routes */}
      <Route path="/admin/login">
        <AdminLoginPage />
      </Route>
      <Route path="/admin/dashboard">
        <AdminLayout><AdminDashboardPage /></AdminLayout>
      </Route>
      <Route path="/admin/users">
        <AdminLayout><AdminUsersPage /></AdminLayout>
      </Route>
      <Route path="/admin/users/:id">
        {(params: any) => (
          <AdminLayout><AdminUserDetailPage /></AdminLayout>
        )}
      </Route>
      <Route path="/admin/merchants">
        <AdminLayout><AdminMerchantsPage /></AdminLayout>
      </Route>
      <Route path="/admin/merchants/:id">
        {(params: any) => (
          <AdminLayout><AdminMerchantDetailPage /></AdminLayout>
        )}
      </Route>
      <Route path="/admin/transactions">
        <AdminLayout><AdminTransactionsPage /></AdminLayout>
      </Route>
      <Route path="/admin/bills">
        <AdminLayout><AdminBillsPage /></AdminLayout>
      </Route>
      <Route path="/admin/kyc">
        <AdminLayout><AdminKycPage /></AdminLayout>
      </Route>
      <Route path="/admin/disputes">
        <AdminLayout><AdminDisputesPage /></AdminLayout>
      </Route>
      <Route path="/admin/analytics">
        <AdminLayout><AdminAnalyticsPage /></AdminLayout>
      </Route>
      <Route path="/admin/settings">
        <AdminLayout><AdminSettingsPage /></AdminLayout>
      </Route>
      <Route path="/admin/explore-nigeria">
        <AdminLayout><AdminExploreNigeriaPage /></AdminLayout>
      </Route>
      <Route path="/admin">
        <AdminLayout><AdminDashboardPage /></AdminLayout>
      </Route>

      {/* Merchant routes */}
      <Route path="/merchant/onboarding">
        <MerchantLayout><MerchantOnboardingPage /></MerchantLayout>
      </Route>
      <Route path="/merchant/payments">
        <MerchantLayout><MerchantPaymentsPage /></MerchantLayout>
      </Route>
      <Route path="/merchant/qr">
        <MerchantLayout><MerchantQrPage /></MerchantLayout>
      </Route>
      <Route path="/merchant/settlements">
        <MerchantLayout><MerchantSettlementsPage /></MerchantLayout>
      </Route>
      <Route path="/merchant/store">
        <MerchantLayout><MerchantStorePage /></MerchantLayout>
      </Route>
      <Route path="/merchant/orders">
        <MerchantLayout><MerchantOrdersPage /></MerchantLayout>
      </Route>
      <Route path="/merchant">
        <MerchantLayout><MerchantPage /></MerchantLayout>
      </Route>

      {/* Customer-facing store */}
      <Route path="/store/:slug">
        {(params: any) => <CustomerStore slug={params?.slug} />}
      </Route>

      {/* Fallback */}
      <Route>
        <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">404</h1>
            <p className="text-[var(--text-secondary)] mt-2">Page not found</p>
            <a href="/" className="mt-4 inline-block hover:underline" style={{ color: 'var(--accent-text)' }}>Go home</a>
          </div>
        </div>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, "") || ""}>
          <AuthBootstrap />
          <SplashScreen />
          <Router />
          <CookieConsentBanner />
        </WouterRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: 'transparent', boxShadow: 'none', padding: 0 },
          }}
          containerStyle={{ top: 20, right: 20 }}
        />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
