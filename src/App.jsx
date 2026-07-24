import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import AppLayout from '@/components/layout/AppLayout';
import Dashboard from '@/pages/Dashboard';
import Tickets from '@/pages/Tickets';
import NewTicket from '@/pages/NewTicket';
import TicketDetail from '@/pages/TicketDetail';
import SLAReport from '@/pages/SLAReport';
import SLASettings from '@/pages/SLASettings';
import NotificationSettings from '@/pages/NotificationSettings';
import ServiceMapPage from '@/pages/ServiceMapPage';
import FeedbackSurvey from '@/pages/FeedbackSurvey';
import SurveyResponses from '@/pages/SurveyResponses';
import ResetTestData from '@/pages/ResetTestData';
import CleaningReport from '@/pages/CleaningReport';
import UsersManagement from '@/pages/UsersManagement';
import PermissionsManagement from '@/pages/PermissionsManagement';
import EventsManagement from '@/pages/EventsManagement';
import EventRegistration from '@/pages/EventRegistration';
import OnboardingManagement from '@/pages/OnboardingManagement';
import OnboardingDetail from '@/pages/OnboardingDetail';
import MyOnboarding from '@/pages/MyOnboarding';
import OnboardingAccessPage from '@/pages/OnboardingAccessPage';

const PUBLIC_ROUTES = ['/event-registration', '/feedback', '/onboarding/access'];

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const location = useLocation();
  const isPublicRoute = PUBLIC_ROUTES.some(p => location.pathname.startsWith(p));

  if (isLoadingPublicSettings || (isLoadingAuth && !isPublicRoute)) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError && !isPublicRoute) {
    if (authError.type === 'user_not_registered') return <UserNotRegisteredError />;
    if (authError.type === 'auth_required') { navigateToLogin(); return null; }
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
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
        </Route>
      </Route>
      <Route path="/onboarding/access/:token" element={<OnboardingAccessPage />} />
      <Route path="/feedback/:token" element={<FeedbackSurvey />} />
      <Route path="/event-registration" element={<EventRegistration />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
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