import { useLayoutEffect, useEffect, useRef } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ClerkProvider, SignIn, SignUp, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import VenueDetail from "@/pages/venue";
import Speakeasies from "@/pages/speakeasies";
import VenueTypes from "@/pages/venue-types";
import VenueTypeDetail from "@/pages/venue-type-detail";
import Services from "@/pages/services";
import ServiceDetail from "@/pages/service-detail";
import Markets from "@/pages/markets";
import MarketDetail from "@/pages/market-detail";
import Operators from "@/pages/operators";
import OperatorDetail from "@/pages/operator-detail";
import OperatorDashboard from "@/pages/operator-dashboard";
import Profile from "@/pages/profile";
import About from "@/pages/about";
import Careers from "@/pages/careers";
import Contact from "@/pages/contact";
import Rewards from "@/pages/rewards";
import Layout from "@/components/layout";
import { SpeakeasyProvider } from "@/components/speakeasy-context";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true, // We want fresh data for live conditions
      staleTime: 1000 * 60, // 1 minute
    },
  },
});

// REQUIRED — copy verbatim. Resolves the key from window.location.hostname so the
// same build serves multiple Clerk custom domains.
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

// REQUIRED — empty in dev (intentional), auto-set in prod. Do not gate on env.
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

// Clerk passes full paths to routerPush/routerReplace, but wouter's
// setLocation prepends the base — strip it to avoid doubling.
function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in .env file");
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(190 100% 50%)",
    colorForeground: "hsl(0 0% 98%)",
    colorMutedForeground: "hsl(240 5% 65%)",
    colorDanger: "hsl(0 84% 60%)",
    colorBackground: "hsl(240 10% 6%)",
    colorInput: "hsl(240 6% 15%)",
    colorInputForeground: "hsl(0 0% 98%)",
    colorNeutral: "hsl(0 0% 98%)",
    fontFamily: "'Inter', sans-serif",
    borderRadius: "0.85rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-[hsl(240_10%_6%)] border border-[hsl(240_6%_15%)] rounded-2xl w-[440px] max-w-full overflow-hidden",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-[hsl(0_0%_98%)] font-black uppercase tracking-tight",
    headerSubtitle: "text-[hsl(240_5%_65%)]",
    socialButtonsBlockButtonText: "text-[hsl(0_0%_98%)]",
    formFieldLabel: "text-[hsl(0_0%_98%)]",
    footerActionLink: "text-[hsl(190_100%_50%)] hover:text-[hsl(190_100%_65%)]",
    footerActionText: "text-[hsl(240_5%_65%)]",
    dividerText: "text-[hsl(240_5%_65%)]",
    identityPreviewEditButton: "text-[hsl(190_100%_50%)]",
    formFieldSuccessText: "text-[hsl(140_100%_55%)]",
    alertText: "text-[hsl(0_0%_98%)]",
    logoBox: "justify-center",
    logoImage: "h-8",
    socialButtonsBlockButton: "bg-[hsl(240_6%_15%)] border border-[hsl(240_6%_20%)] hover:bg-[hsl(240_6%_20%)]",
    formButtonPrimary: "bg-[hsl(190_100%_50%)] text-[hsl(240_10%_4%)] font-bold uppercase tracking-wider hover:bg-[hsl(190_100%_60%)]",
    formFieldInput: "bg-[hsl(240_6%_15%)] border-[hsl(240_6%_20%)] text-[hsl(0_0%_98%)]",
    footerAction: "justify-center",
    dividerLine: "bg-[hsl(240_6%_15%)]",
    alert: "bg-[hsl(240_6%_15%)]",
    otpCodeFieldInput: "bg-[hsl(240_6%_15%)] text-[hsl(0_0%_98%)] border-[hsl(240_6%_20%)]",
    formFieldRow: "",
    main: "",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[70dvh] items-center justify-center bg-background px-4 py-12">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[70dvh] items-center justify-center bg-background px-4 py-12">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

// Helps webview stay up-to-date when the signed-in user changes.
function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

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
      <Route path="/types" component={VenueTypes} />
      <Route path="/types/:slug" component={VenueTypeDetail} />
      <Route path="/services" component={Services} />
      <Route path="/services/:slug" component={ServiceDetail} />
      <Route path="/markets" component={Markets} />
      <Route path="/markets/:market" component={MarketDetail} />
      <Route path="/operators" component={Operators} />
      <Route path="/operator-dashboard" component={OperatorDashboard} />
      <Route path="/operators/:slug" component={OperatorDetail} />
      <Route path="/profile" component={Profile} />
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      <Route path="/about" component={About} />
      <Route path="/careers" component={Careers} />
      <Route path="/contact" component={Contact} />
      <Route path="/rewards" component={Rewards} />
      <Route component={NotFound} />
    </Switch>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Welcome back",
            subtitle: "Sign in to your saved spots and night-out history",
          },
        },
        signUp: {
          start: {
            title: "Create your account",
            subtitle: "Save favorite spots and track your nights out",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <SpeakeasyProvider>
            <ScrollToTop />
            <Layout>
              <Router />
            </Layout>
          </SpeakeasyProvider>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <WouterRouter base={basePath}>
        <ClerkProviderWithRoutes />
      </WouterRouter>
    </ThemeProvider>
  );
}

export default App;
