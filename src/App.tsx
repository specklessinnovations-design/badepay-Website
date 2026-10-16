import React, { Suspense, lazy } from "react";
import { ADMIN_BASE } from "@/lib/adminPaths";
import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SplashScreen } from "@/components/ui/splash-screen";
import { CookieConsentBanner } from "@/components/ui/cookie-consent-banner";
import AuthBootstrap from "@/components/auth/AuthBootstrap";
import { SeoManager } from "@/components/seo/SeoManager";

const AdminApp = lazy(() => import("@/app/admin/AdminApp"));
const AdminPortal = () => (
  <Suspense fallback={<div className="admin-shell h-dvh" />}>
    <AdminApp />
  </Suspense>
);

// Pages
import LandingPage from "@/app/page";
import LoginPage from "@/app/(auth)/login/page";
import RegisterPage from "@/app/(auth)/register/page";
import ForgotPasswordPage from "@/app/(auth)/forgot-password/page";
import ResetPasswordPage from "@/app/(auth)/reset-password/page";
import VerifyOtpPage from "@/app/(auth)/verify-otp/page";
import SetPinPage from "@/app/(auth)/set-pin/page";
import AuthLayout from "@/app/(auth)/layout";
import VerifyBvnPage from "@/app/(auth)/verify-bvn/page";
import AccountReadyPage from "@/app/(auth)/account-ready/page";

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
import ProfileNotificationsPage from "@/app/(dashboard)/profile/notifications/page";
import ProfileSupportPage from "@/app/(dashboard)/profile/support/page";
import DisputesPage from "@/app/(dashboard)/profile/disputes/page";
import OrdersPage from "@/app/(dashboard)/orders/page";
import FundingCallbackPage from "@/app/(dashboard)/wallet/callback-page";
import OrderDetailPage from "@/app/(dashboard)/orders/detail-page";
import NewDisputePage from "@/app/(dashboard)/profile/disputes/new-page";
import DisputeDetailPage from "@/app/(dashboard)/profile/disputes/detail-page";
import ProfileStatementsPage from "@/app/(dashboard)/profile/statements/page";
import ChangePinPage from "@/app/(dashboard)/profile/change-pin/page";
import ChangePasswordPage from "@/app/(dashboard)/profile/change-password/page";
import ProfileMyQrPage from "@/app/(dashboard)/profile/my-qr/page";
import AIAssistantPage from "@/app/(dashboard)/ai/page";
import VideoPage from "@/app/(dashboard)/video/page";
import InsightsPage from "@/app/(dashboard)/insights/page";
import MarketplacePage from "@/app/(dashboard)/marketplace/page";
import SavingsPage from "@/app/(dashboard)/savings/page";
import NewsPage from "@/app/(dashboard)/news/page";
import NewsArticlePage from "@/app/(dashboard)/news/article-page";
import DashboardLayout from "@/app/(dashboard)/layout";


import MerchantPage from "@/app/merchant/page";
import MerchantOnboardingPage from "@/app/merchant/onboarding/page";
import MerchantPaymentsPage from "@/app/merchant/payments/page";
import MerchantQrPage from "@/app/merchant/qr/page";
import MerchantPayoutsPage from "@/app/merchant/payouts/page";
import MerchantCustomersPage from "@/app/merchant/customers/page";
import MerchantAnalyticsPage from "@/app/merchant/analytics/page";
import MerchantStorePage from "@/app/merchant/store/page";
import MerchantOrdersPage from "@/app/merchant/orders/page";
import MerchantLayout from "@/app/merchant/layout";
import CustomerStore from "@/app/store/page";

import LegalPage from "@/app/legal/page";
import PrivacyPolicyPage from "@/app/privacy/page";
import TermsPage from "@/app/terms/page";
import CookiePolicyPage from "@/app/cookies/page";
import AmlKycPolicyPage from "@/app/aml-kyc/page";
import RefundPolicyPage from "@/app/refunds/page";
import ContactPage from "@/app/contact/page";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />

      {/* Public legal & contact pages */}
      <Route path="/legal" component={LegalPage} />
      <Route path="/privacy" component={PrivacyPolicyPage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/cookies" component={CookiePolicyPage} />
      <Route path="/aml-kyc" component={AmlKycPolicyPage} />
      <Route path="/refunds" component={RefundPolicyPage} />
      <Route path="/contact" component={ContactPage} />

      {/* Auth routes */}
      <Route path="/login">
        <AuthLayout><LoginPage /></AuthLayout>
      </Route>
      <Route path="/verify-bvn"><VerifyBvnPage /></Route>
      <Route path="/account-ready"><AccountReadyPage /></Route>
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
      <Route path="/profile/devices"><Redirect to="/profile/security" /></Route>
      <Route path="/profile/notifications">
        <DashboardLayout><ProfileNotificationsPage /></DashboardLayout>
      </Route>
      <Route path="/wallet/callback">
        <DashboardLayout><FundingCallbackPage /></DashboardLayout>
      </Route>
      <Route path="/orders/callback">
        <Redirect to="/orders" replace />
      </Route>
      <Route path="/orders/:id">
        <DashboardLayout><OrderDetailPage /></DashboardLayout>
      </Route>
      <Route path="/orders">
        <DashboardLayout><OrdersPage /></DashboardLayout>
      </Route>
      <Route path="/profile/disputes/new">
        <DashboardLayout><NewDisputePage /></DashboardLayout>
      </Route>
      <Route path="/profile/disputes/:id">
        <DashboardLayout><DisputeDetailPage /></DashboardLayout>
      </Route>
      <Route path="/profile/disputes">
        <DashboardLayout><DisputesPage /></DashboardLayout>
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
      <Route path="/profile/my-qr">
        <DashboardLayout><ProfileMyQrPage /></DashboardLayout>
      </Route>
      <Route path="/ai">
        <DashboardLayout><AIAssistantPage /></DashboardLayout>
      </Route>
      <Route path="/explore-nigeria"><Redirect to="/news" /></Route>
      <Route path="/video">
        <DashboardLayout><VideoPage /></DashboardLayout>
      </Route>
      <Route path="/insights">
        <DashboardLayout><InsightsPage /></DashboardLayout>
      </Route>
      <Route path="/marketplace">
        <DashboardLayout><MarketplacePage /></DashboardLayout>
      </Route>
      <Route path="/savings">
        <DashboardLayout><SavingsPage /></DashboardLayout>
      </Route>
      <Route path="/news/:slug">
        {(params: any) => <DashboardLayout><NewsArticlePage slug={params?.slug} /></DashboardLayout>}
      </Route>
      <Route path="/news">
        <DashboardLayout><NewsPage /></DashboardLayout>
      </Route>
      <Route path="/profile">
        <DashboardLayout><ProfilePage /></DashboardLayout>
      </Route>

      {/* Admin portal: its own lazily loaded chunk under ADMIN_BASE (lib/adminPaths.ts). /admin is not served. */}
      <Route path={ADMIN_BASE}>
        <AdminPortal />
      </Route>
      <Route path={`${ADMIN_BASE}/*`}>
        <AdminPortal />
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
      <Route path="/merchant/analytics">
        <MerchantLayout><MerchantAnalyticsPage /></MerchantLayout>
      </Route>
      <Route path="/merchant/customers">
        <MerchantLayout><MerchantCustomersPage /></MerchantLayout>
      </Route>
      <Route path="/merchant/payouts">
        <MerchantLayout><MerchantPayoutsPage /></MerchantLayout>
      </Route>
      <Route path="/merchant/settlements">
        <Redirect to="/merchant/payouts" replace />
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
          <SeoManager />
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
