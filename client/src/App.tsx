import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import ContentGenerator from "./pages/ContentGenerator";
import Connections from "./pages/Connections";
import Queue from "./pages/Queue";
import Billing from "./pages/Billing";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import OAuthCallback from "./pages/OAuthCallback";
import AppLayout from "./components/AppLayout";

function Router() {
  return (
    <Switch>
      {/* Public landing page */}
      <Route path="/" component={Home} />

      {/* OAuth callback handler */}
      <Route path="/oauth/callback" component={OAuthCallback} />

      {/* App pages — wrapped in AppLayout (sidebar) */}
      <Route path="/dashboard">
        <AppLayout><Dashboard /></AppLayout>
      </Route>
      <Route path="/generate">
        <AppLayout><ContentGenerator /></AppLayout>
      </Route>
      <Route path="/connections">
        <AppLayout><Connections /></AppLayout>
      </Route>
      <Route path="/queue">
        <AppLayout><Queue /></AppLayout>
      </Route>
      <Route path="/billing">
        <AppLayout><Billing /></AppLayout>
      </Route>
      <Route path="/analytics">
        <AppLayout><Analytics /></AppLayout>
      </Route>
      <Route path="/settings">
        <AppLayout><Settings /></AppLayout>
      </Route>

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster theme="dark" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
