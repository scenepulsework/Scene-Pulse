import { useLayoutEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import VenueDetail from "@/pages/venue";
import Speakeasies from "@/pages/speakeasies";
import Services from "@/pages/services";
import Markets from "@/pages/markets";
import Operators from "@/pages/operators";
import About from "@/pages/about";
import Careers from "@/pages/careers";
import Contact from "@/pages/contact";
import Layout from "@/components/layout";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true, // We want fresh data for live conditions
      staleTime: 1000 * 60, // 1 minute
    },
  },
});

function ScrollToTop() {
  const [location] = useLocation();
  useLayoutEffect(() => {
    // html has smooth-scroll CSS; force an instant jump on route change.
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location]);
  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/venue/:id" component={VenueDetail} />
      <Route path="/speakeasies" component={Speakeasies} />
      <Route path="/services" component={Services} />
      <Route path="/markets" component={Markets} />
      <Route path="/operators" component={Operators} />
      <Route path="/about" component={About} />
      <Route path="/careers" component={Careers} />
      <Route path="/contact" component={Contact} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <ScrollToTop />
            <Layout>
              <Router />
            </Layout>
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
