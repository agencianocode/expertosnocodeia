import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useSimpleAuth } from "@/hooks/use-simple-auth";
import { SimpleAuthProvider } from "@/hooks/use-simple-auth";
import NotFound from "@/pages/not-found";
import PublicLanding from "@/pages/public-landing";
import MarketingLanding from "@/pages/marketing-landing";
import UniversidadNoCodeIA from "@/pages/universidad-nocode-ia";
import LandingMarketing from "@/pages/landing-marketing";
import LandingPricing from "@/pages/landing-pricing";
import Onboarding from "@/pages/onboarding";
import PersonalizedRecommendations from "@/pages/personalized-recommendations";
import Dashboard from "@/pages/dashboard";
import Courses from "@/pages/courses";
import Guides from "@/pages/guides";
import Programas from "@/pages/programas";
import Workshops from "@/pages/workshops";
import Workshop from "@/pages/workshop";
import Course from "@/pages/course";
import Guide from "@/pages/guide";
import Room from "@/pages/room";
import CategoryPage from "@/pages/category";
import AdminDashboard from "@/pages/admin/dashboard";
import ContentManagement from "@/pages/admin/content";
import AdminUsers from "@/pages/admin/users";
import AdminEmails from "@/pages/admin/emails";
import AdminBeehiiv from "@/pages/admin/beehiiv";
import AdminAutomations from "@/pages/admin/automations";
import AdminSegments from "@/pages/admin/segments";
import CourseForm from "@/pages/admin/course-form";
import CourseLessons from "@/pages/admin/course-lessons";
import LessonForm from "@/pages/admin/lesson-form";
import CategoryForm from "@/pages/admin/category-form";
import AdminMedia from "@/pages/admin/media";
import MediaUpload from "@/pages/admin/media-upload";
import WorkshopEditor from "@/pages/admin/workshop-editor";
import OnboardingAnalytics from "@/pages/admin/onboarding-analytics";
import AdminComments from "@/pages/admin/comments";
import AdminCommunity from "@/pages/admin/community";
import AdminLiveEvents from "@/pages/admin/live-events";
import RoomsManagement from "@/pages/admin/rooms";
import RoomForm from "@/pages/admin/room-form";
import PromoBannersManagement from "@/pages/admin/promo-banners";
import PromoBannerForm from "@/pages/admin/promo-banner-form";
import Setup from "@/pages/setup";
import Lesson from "@/pages/lesson";
import Events from "@/pages/events";
import EventDetails from "@/pages/event-details";
import WorkshopsEvents from "@/pages/workshops-events";
import Community from "@/pages/community";
import LiveRoom from "@/pages/live-room";
import Perks from "@/pages/perks";
import Profile from "@/pages/profile";
import Leaderboard from "@/pages/leaderboard";
import MyProgress from "@/pages/my-progress";
import Saved from "@/pages/saved";
import NotificationsPage from "@/pages/notifications";
import Planes from "@/pages/planes";
import Support from "@/pages/support";
import Login from "@/pages/login";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import VerifyEmail from "@/pages/verify-email";
import DebugPage from "@/pages/debug";
import SimpleDashboard from "@/pages/simple-dashboard";
import SimpleLogin from "@/pages/simple-login";
import RealDashboard from "@/pages/real-dashboard";
import ClearCache from "@/pages/clear-cache";
import Checkout from "@/pages/checkout";
import CheckoutReturn from "@/pages/checkout-return";
import CalendarEventDetails from "@/pages/calendar-event-details";
import PrivacyPolicy from "@/pages/privacy-policy";
import TermsOfService from "@/pages/terms-of-service";

function Router() {
  const { isAuthenticated, isLoading, user } = useSimpleAuth();
  
  // Check if user is admin - we'll add this check later
  const isAdminUser = user?.id === 'b380d310-84b4-4c25-9a52-4f5af4a3e79e'; // Your admin ID
  const isAdminView = isAdminUser; // Show admin dashboard if user is admin

  // Detectar si estamos en el dominio principal o en el subdominio de la app
  const isAppDomain = () => {
    if (typeof window === 'undefined') return true; // Default to app domain for SSR
    const hostname = window.location.hostname;
    const pathname = window.location.pathname;
    
    // En desarrollo local, detectar rutas de preview
    if (hostname.includes('localhost') && pathname.startsWith('/preview-')) {
      return false; // Usar rutas públicas para preview
    }
    
    // En desarrollo local, usar aplicación LMS siempre
    if (hostname.includes('localhost') || hostname.includes('127.0.0.1') || hostname.includes('replit.dev')) {
      return true; // Usar rutas de LMS por defecto
    }
    
    // En producción, detectar app.expertosnocodeia.com vs expertosnocodeia.com
    // Si es app.expertosnocodeia.com → mostrar app
    if (hostname === 'app.expertosnocodeia.com' || hostname.startsWith('app.')) {
      return true; // App domain
    }
    
    // Si es el dominio principal (expertosnocodeia.com) → landing
    if (hostname === 'expertosnocodeia.com' || hostname === 'www.expertosnocodeia.com') {
      return false; // Landing domain
    }
    
    // Para Railway temporal domains, usar landing por defecto
    if (hostname.includes('railway.app')) {
      return false; // Landing por defecto en Railway temporal
    }
    
    // Default: asumir app domain
    return true;
  };

  // Preview routes and public landing pages - ALWAYS available regardless of domain
  return (
    <Switch>
      {/* Preview routes - always available (no auth required) */}
      <Route path="/preview-landing" component={PublicLanding} />
      <Route path="/preview-marketing" component={MarketingLanding} />
      <Route path="/preview-universidad" component={UniversidadNoCodeIA} />
      <Route path="/preview-admin" component={Setup} />
      
      {/* Clear cache route - always available */}
      <Route path="/clear-cache" component={ClearCache} />
      
      {/* Public landing pages - always available */}
      <Route path="/universidad-nocode-ia" component={UniversidadNoCodeIA} />
      
      {/* Domain-based routing */}
      {!isAppDomain() ? (
        <>
          <Route path="/politica-privacidad" component={PrivacyPolicy} />
          <Route path="/condiciones-servicio" component={TermsOfService} />
          <Route path="/" component={MarketingLanding} />
          <Route component={NotFound} />
        </>
      ) : isLoading ? (
        <Route path="/" component={() => <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-foreground">Cargando...</div>
        </div>} />
      ) : !isAuthenticated ? (
        <>
          {/* Public Landing Pages - Specific routes first */}
          <Route path="/pricing" component={LandingPricing} />
          <Route path="/planes" component={LandingPricing} />
          <Route path="/landing" component={PublicLanding} />
          
          {/* Public access to main content pages with locked content */}
          <Route path="/" component={Dashboard} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/courses" component={Courses} />
          <Route path="/programas" component={Programas} />
          <Route path="/guides" component={Guides} />
          <Route path="/talleres" component={Workshops} />
          <Route path="/categoria/:categorySlug" component={CategoryPage} />
          
          {/* Course pages - show real content but locked for non-authenticated users */}
          <Route path="/course/:id" component={Course} />
          <Route path="/curso/:id" component={Course} />
          <Route path="/sala/:roomSlug/curso/:id" component={Course} />
          <Route path="/guia/:id" component={Guide} />
          <Route path="/taller/:id" component={Workshop} />
          <Route path="/sala/:slug" component={Room} />
          
          {/* Admin redirect - redirect to login if not authenticated */}
          <Route path="/admin">
            {() => <Redirect to="/login" />}
          </Route>
          
          {/* Authentication and support pages */}
          <Route path="/login" component={Login} />
          <Route path="/register" component={Login} />
          <Route path="/inscribirse" component={Login} />
          <Route path="/forgot-password" component={ForgotPassword} />
          <Route path="/reset-password" component={ResetPassword} />
          <Route path="/verify-email" component={VerifyEmail} />
          <Route path="/apoyo" component={Support} />
          <Route path="/support" component={Support} />
          <Route path="/politica-privacidad" component={PrivacyPolicy} />
          <Route path="/condiciones-servicio" component={TermsOfService} />
          <Route path="/community" component={Community} />
          <Route component={NotFound} />
        </>
      ) : (
        <>
          {/* Public landing pages - available for authenticated users too */}
          <Route path="/pricing" component={LandingPricing} />
          <Route path="/planes" component={LandingPricing} />
          
          {/* Authenticated routes */}
          <Route path="/" component={Dashboard} />
          <Route path="/login" component={Login} />
          <Route path="/forgot-password" component={ForgotPassword} />
          <Route path="/reset-password" component={ResetPassword} />
          <Route path="/verify-email" component={VerifyEmail} />
          <Route path="/checkout/:planId" component={Checkout} />
          <Route path="/checkout-return" component={CheckoutReturn} />
          <Route path="/onboarding" component={Onboarding} />
          <Route path="/recommendations" component={PersonalizedRecommendations} />
          <Route path="/courses" component={Courses} />
          <Route path="/programas" component={Programas} />
          <Route path="/guides" component={Guides} />
          <Route path="/talleres" component={Workshops} />
          <Route path="/taller/:id" component={Workshop} />
          <Route path="/events" component={Events} />
          <Route path="/events/:eventId" component={EventDetails} />
          <Route path="/calendar-events/:eventId" component={CalendarEventDetails} />
          <Route path="/workshops" component={WorkshopsEvents} />
          <Route path="/community" component={Community} />
          <Route path="/live/:eventId" component={LiveRoom} />
          <Route path="/perks" component={Perks} />
          <Route path="/profile" component={Profile} />
          <Route path="/leaderboard" component={Leaderboard} />
          <Route path="/clasificacion" component={Leaderboard} />
          <Route path="/progreso" component={MyProgress} />
          <Route path="/progress" component={MyProgress} />
          <Route path="/mi-progreso" component={MyProgress} />
          <Route path="/saved" component={Saved} />
          <Route path="/guardado" component={Saved} />
          <Route path="/notifications" component={NotificationsPage} />
          <Route path="/support" component={Support} />
          <Route path="/apoyo" component={Support} />
          <Route path="/politica-privacidad" component={PrivacyPolicy} />
          <Route path="/condiciones-servicio" component={TermsOfService} />
          <Route path="/categoria/:categorySlug" component={CategoryPage} />
          <Route path="/course/:courseId/lesson/:lessonId" component={Lesson} />
          <Route path="/course/:id" component={Course} />
          <Route path="/curso/:id" component={Course} />
          <Route path="/sala/:roomSlug/curso/:id" component={Course} />
          <Route path="/guia/:id" component={Guide} />
          <Route path="/sala/:slug" component={Room} />
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/admin/dashboard" component={AdminDashboard} />
          <Route path="/admin/onboarding" component={OnboardingAnalytics} />
          <Route path="/admin/content" component={ContentManagement} />
          <Route path="/admin/users" component={AdminUsers} />
          <Route path="/admin/emails" component={AdminEmails} />
          <Route path="/admin/beehiiv" component={AdminBeehiiv} />
          <Route path="/admin/automations" component={AdminAutomations} />
          <Route path="/admin/segments" component={AdminSegments} />
          <Route path="/admin/content/course/new" component={CourseForm} />
          <Route path="/admin/content/course/:id/lessons" component={CourseLessons} />
          <Route path="/admin/content/course/:id/edit" component={CourseForm} />
          <Route path="/admin/content/lesson/new/:courseId" component={LessonForm} />
          <Route path="/admin/content/lesson/:id/edit" component={LessonForm} />
          <Route path="/admin/content/category/new" component={CategoryForm} />
          <Route path="/admin/workshops/:action/:id?" component={WorkshopEditor} />
          <Route path="/admin/media" component={AdminMedia} />
          <Route path="/admin/media/upload" component={MediaUpload} />
          <Route path="/admin/comentarios" component={AdminComments} />
          <Route path="/admin/community" component={AdminCommunity} />
          <Route path="/admin/live-events" component={AdminLiveEvents} />
          <Route path="/admin/rooms" component={RoomsManagement} />
          <Route path="/admin/rooms/:id/edit" component={RoomForm} />
          <Route path="/admin/promo-banners" component={PromoBannersManagement} />
          <Route path="/admin/promo-banners/new" component={PromoBannerForm} />
          <Route path="/admin/promo-banners/:id/edit" component={PromoBannerForm} />
          <Route path="/setup" component={Setup} />
          <Route path="/debug" component={DebugPage} />
          <Route component={NotFound} />
        </>
      )}
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SimpleAuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </SimpleAuthProvider>
    </QueryClientProvider>
  );
}

export default App;
