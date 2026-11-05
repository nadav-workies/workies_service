import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ProtectedRoute from '@/components/ProtectedRoute';
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
import AppLayout from '@/components/layout/AppLayout';
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Home = lazy(() => import('@/pages/Home'));
const Tickets = lazy(() => import('@/pages/Tickets'));
const NewTicket = lazy(() => import('@/pages/NewTicket'));
const TicketDetail = lazy(() => import('@/pages/TicketDetail'));
const SLAReport = lazy(() => import('@/pages/SLAReport'));
const SLASettings = lazy(() => import('@/pages/SLASettings'));
const NotificationSettings = lazy(() => import('@/pages/NotificationSettings'));
const ServiceMapPage = lazy(() => import('@/pages/ServiceMapPage'));
const FeedbackSurvey = lazy(() => import('@/pages/FeedbackSurvey'));
const SurveyResponses = lazy(() => import('@/pages/SurveyResponses'));
const ResetTestData = lazy(() => import('@/pages/ResetTestData'));
const CleaningReport = lazy(() => import('@/pages/CleaningReport'));
const UsersManagement = lazy(() => import('@/pages/UsersManagement'));
const PermissionsManagement = lazy(() => import('@/pages/PermissionsManagement'));
const EventsManagement = lazy(() => import('@/pages/EventsManagement'));
const EventRegistration = lazy(() => import('@/pages/EventRegistration'));
const OnboardingManagement = lazy(() => import('@/pages/OnboardingManagement'));
const OnboardingDetail = lazy(() => import('@/pages/OnboardingDetail'));
const MyOnboarding = lazy(() => import('@/pages/MyOnboarding'));
const OnboardingAccessPage = lazy(() => import('@/pages/OnboardingAccessPage'));
const CommunityContent = lazy(() => import('@/pages/CommunityContent'));
const MaintenancePlan = lazy(() => import('@/pages/MaintenancePlan'));
const ReferralPage = lazy(() => import('@/pages/ReferralPage'));
const Podcast = lazy(() => import('@/pages/Podcast'));
const PublicReferralPage = lazy(() => import('@/pages/PublicReferralPage'));
const DailyOffice = lazy(() => import('@/pages/DailyOffice'));
const LandingPages = lazy(() => import('@/pages/LandingPages'));
const LandingPageManage = lazy(() => import('@/pages/LandingPageManage'));
import WorkiesAI from '@/pages/WorkiesAI';


const PUBLIC_ROUTES = ['/event-registration', '/feedback', '/onboarding/access', '/referral-share', '/daily-office', '/podcast', '/workies-ai'];

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const location = useLocation();
  const isPublicRoute = PUBLIC_ROUTES.some(p => location.pathname.startsWith(p));

  const isStaticLanding = location.pathname.startsWith('/workies-ai');
  if (!isStaticLanding && (isLoadingPublicSettings || (isLoadingAuth && !isPublicRoute))) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isStaticLanding) return <WorkiesAI />;

  if (authError && !isPublicRoute) {
    if (authError.type === 'user_not_registered') return <UserNotRegisteredError />;
    if (authError.type === 'auth_required') { navigateToLogin(); return null; }
  }

  return (
    <Suspense fallback={<div className="fixed inset-0 flex items-center justify-center bg-background">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        </div>}>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tickets" element={<Tickets />} />
          <Route path="/tickets/new" element={<NewTicket />} />
          <Route path="/tickets/:id" element={<TicketDetail />} />
          <Route path="/sla-report" element={<SLAReport />} />
          <Route path="/sla-settings" element={<SLASettings />} />
          <Route path="/notification-settings" element={<NotificationSettings />} />
          <Route path="/service-map" element={<ServiceMapPage />} />
          <Route path="/survey-responses" element={<SurveyResponses />} />
          <Route path="/reset-test-data" element={<ResetTestData />} />
          <Route path="/cleaning-report" element={<CleaningReport />} />
          <Route path="/users" element={<UsersManagement />} />
          <Route path="/permissions" element={<PermissionsManagement />} />
          <Route path="/events" element={<EventsManagement />} />
          <Route path="/onboarding" element={<OnboardingManagement />} />
          <Route path="/onboarding/:id" element={<OnboardingDetail />} />
          <Route path="/my-onboarding" element={<MyOnboarding />} />
          <Route path="/community-content" element={<CommunityContent />} />
          <Route path="/maintenance-plan" element={<MaintenancePlan />} />
          <Route path="/friend-referral" element={<ReferralPage />} />
          <Route path="/referrals-report" element={<Navigate to="/landing-pages/referral" replace />} />
          <Route path="/landing-pages" element={<LandingPages />} />
          <Route path="/landing-pages/:campaign" element={<LandingPageManage />} />
          <Route path="/leads" element={<Navigate to="/landing-pages/office" replace />} />
        </Route>
      </Route>
      <Route path="/onboarding/access/:token" element={<OnboardingAccessPage />} />
      <Route path="/feedback/:token" element={<FeedbackSurvey />} />
      <Route path="/event-registration" element={<EventRegistration />} />
      <Route path="/referral-share" element={<PublicReferralPage />} />
      <Route path="/daily-office" element={<DailyOffice />} />
      <Route path="/podcast" element={<Podcast />} />
      <Route path="/workies-ai" element={<WorkiesAI />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
    </Suspense>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;