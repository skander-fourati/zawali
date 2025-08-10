import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import TransactionsPage from "./pages/TransactionsPage";
import ManageDataPage from "./pages/ManageDataPage";
import InsightsPage from "./pages/InsightsPage";

const queryClient = new QueryClient();

// Component to handle initial routing logic
const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Auth page doesn't need sidebar */}
      <Route path="/auth" element={<Auth />} />
      
      {/* Redirect root to appropriate page based on auth status */}
      <Route path="/" element={
        user ? (
          <AppLayout>
            <Index />
          </AppLayout>
        ) : (
          <Navigate to="/auth" replace />
        )
      } />
      
      {/* All other protected routes use the app layout with sidebar */}
      <Route path="/transactions" element={
        <AppLayout>
          <TransactionsPage />
        </AppLayout>
      } />
      <Route path="/insights" element={
        <AppLayout>
          <InsightsPage />
        </AppLayout>
      } />
      <Route path="/manage-data" element={
        <AppLayout>
          <ManageDataPage />
        </AppLayout>
      } />
      
      {/* Catch-all route */}
      <Route path="*" element={
        <AppLayout>
          <NotFound />
        </AppLayout>
      } />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <HashRouter>
          <AppRoutes />
        </HashRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;