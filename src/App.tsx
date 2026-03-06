import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { LanguageProvider } from "@/i18n/LanguageContext";
import SubscriptionGuard from "@/components/SubscriptionGuard";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import RecipesPage from "./pages/RecipesPage";
import ProfilePage from "./pages/ProfilePage";
import MetabolicPage from "./pages/MetabolicPage";
import MealScannerPage from "./pages/MealScannerPage";
import SubscriptionRequired from "./pages/SubscriptionRequired";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/subscription-required" element={<SubscriptionRequired />} />
              <Route path="/" element={<SubscriptionGuard><Index /></SubscriptionGuard>} />
              <Route path="/recipes" element={<SubscriptionGuard><RecipesPage /></SubscriptionGuard>} />
              <Route path="/metabolic" element={<SubscriptionGuard><MetabolicPage /></SubscriptionGuard>} />
              <Route path="/meal-scanner" element={<SubscriptionGuard><MealScannerPage /></SubscriptionGuard>} />
              <Route path="/profile" element={<SubscriptionGuard><ProfilePage /></SubscriptionGuard>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
