import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import TransactionsPage from "./pages/TransactionsPage";
import ManageDataPage from "./pages/ManageDataPage";
import InsightsPage from "./pages/InsightsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Auth page doesn't need sidebar */}
            <Route path="/auth" element={<Auth />} />
            
            {/* All other routes use the app layout with sidebar */}
            <Route path="/" element={
              <AppLayout>
                <Index />
              </AppLayout>
            } />
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
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;