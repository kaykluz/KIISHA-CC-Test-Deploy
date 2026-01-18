import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Documents from "./pages/Documents";
import Workspace from "./pages/Workspace";
import AssetDetails from "./pages/AssetDetails";
import Schedule from "./pages/Schedule";
import Schedules from "./pages/Schedules";
import DocumentCategorization from "./pages/DocumentCategorization";
import DocumentExtraction from "./pages/DocumentExtraction";
import ClosingChecklist from "./pages/ClosingChecklist";
import Login from "./pages/Login";
import Operations from "./pages/Operations";
import OmPortal from "./pages/OmPortal";
import ArtifactHub from "./pages/ArtifactHub";
import Profile from "./pages/Profile";
import AdminIngest from "./pages/AdminIngest";
import SettingsIntegrations from "./pages/SettingsIntegrations";
import AdminIdentity from "./pages/AdminIdentity";
import ConversationHistory from "./pages/ConversationHistory";
import WhatsAppTemplates from "./pages/WhatsAppTemplates";
import Settings from "./pages/Settings";
import JobDashboard from "./pages/JobDashboard";
import ViewManagement from "./pages/admin/ViewManagement";
import RolloutManagement from "./pages/admin/RolloutManagement";
import OrgSetup from "./pages/admin/OrgSetup";
import ObligationSettings from "./pages/admin/ObligationSettings";
import RequestAnalytics from "./pages/admin/RequestAnalytics";
import EvidenceReview from "./pages/admin/EvidenceReview";
import MfaSetup from "./pages/settings/MfaSetup";
import SessionManagement from "./pages/settings/SessionManagement";
import EmailTemplates from "./pages/settings/EmailTemplates";
import RequestReminders from "./pages/settings/RequestReminders";
import AssetImport from "./pages/admin/AssetImport";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import RequestsDashboard from "./pages/RequestsDashboard";
import RequestDetail from "./pages/RequestDetail";
import ResponseWorkspace from "./pages/ResponseWorkspace";
import { WebSocketProvider } from "./contexts/WebSocketContext";
import { JobNotifications } from "./components/JobNotifications";
import { AdminGuard } from "./components/AdminGuard";

// Wrapper component for admin-only routes
function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <AdminGuard>
      <Component />
    </AdminGuard>
  );
}

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Dashboard} />
      <Route path="/login" component={Login} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/dashboard" component={Dashboard} />
      
      {/* User routes (authenticated) */}
      <Route path="/documents" component={Documents} />
      <Route path="/workspace" component={Workspace} />
      <Route path="/details" component={AssetDetails} />
      <Route path="/schedule" component={Schedule} />
      <Route path="/schedules" component={Schedules} />
      <Route path="/categorize" component={DocumentCategorization} />
      <Route path="/checklist" component={ClosingChecklist} />
      <Route path="/extraction/:id" component={DocumentExtraction} />
      <Route path="/operations" component={Operations} />
      <Route path="/om-portal" component={OmPortal} />
      <Route path="/artifacts" component={ArtifactHub} />
      <Route path="/profile" component={Profile} />
      <Route path="/requests" component={RequestsDashboard} />
      <Route path="/requests/:id" component={RequestDetail} />
      <Route path="/requests/:id/respond" component={ResponseWorkspace} />
      
      {/* Admin-only routes - protected by AdminGuard */}
      <Route path="/admin/ingest">
        {() => <AdminRoute component={AdminIngest} />}
      </Route>
      <Route path="/admin/identity">
        {() => <AdminRoute component={AdminIdentity} />}
      </Route>
      <Route path="/admin/conversations">
        {() => <AdminRoute component={ConversationHistory} />}
      </Route>
      <Route path="/admin/whatsapp-templates">
        {() => <AdminRoute component={WhatsAppTemplates} />}
      </Route>
      <Route path="/admin/jobs">
        {() => <AdminRoute component={JobDashboard} />}
      </Route>
      <Route path="/admin/views">
        {() => <AdminRoute component={ViewManagement} />}
      </Route>
      <Route path="/admin/rollouts">
        {() => <AdminRoute component={RolloutManagement} />}
      </Route>
      <Route path="/admin/org-setup">
        {() => <AdminRoute component={OrgSetup} />}
      </Route>
          <Route path="/admin/obligations">
        {() => <AdminRoute component={ObligationSettings} />}
      </Route>
      <Route path="/admin/request-analytics">
        {() => <AdminRoute component={RequestAnalytics} />}
      </Route>
      <Route path="/admin/evidence-review">
        {() => <AdminRoute component={EvidenceReview} />}
      </Route>
      <Route path="/admin/asset-import">
        {() => <AdminRoute component={AssetImport} />}
      </Route>
      <Route path="/settings">
        {() => <AdminRoute component={Settings} />}
      </Route>
      <Route path="/settings/integrations">
        {() => <AdminRoute component={SettingsIntegrations} />}
      </Route>
      <Route path="/settings/security/mfa" component={MfaSetup} />
      <Route path="/settings/security/sessions" component={SessionManagement} />
      <Route path="/settings/email-templates">
        {() => <AdminRoute component={EmailTemplates} />}
      </Route>
      <Route path="/settings/request-reminders">
        {() => <AdminRoute component={RequestReminders} />}
      </Route>
      
      {/* 404 fallback */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable>
        <WebSocketProvider>
          <TooltipProvider>
            <Toaster />
            <JobNotifications />
            <Router />
          </TooltipProvider>
        </WebSocketProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
