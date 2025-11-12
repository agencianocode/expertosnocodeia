import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useSimpleAuth } from "@/hooks/use-simple-auth";
import { SimpleAuthProvider } from "@/hooks/use-simple-auth";
import NotFound from "@/pages/not-found";
import PublicLanding from "@/pages/public-landing";
import UniversidadNoCodeIA from "@/pages/universidad-nocode-ia";
import Onboarding from "@/pages/onboarding";
import Dashboard from "@/pages/dashboard";
import Courses from "@/pages/courses";
import Guides from "@/pages/guides";
import Workshops from "@/pages/workshops";
import Workshop from "@/pages/workshop";
import Course from "@/pages/course";
import Guide from "@/pages/guide";
import Room from "@/pages/room";
import CategoryPage from "@/pages/category";
import AdminDashboard from "@/pages/admin/dashboard";
import ContentManagement from "@/pages/admin/content";
import CourseForm from "@/pages/admin/course-form";
import CourseLessons from "@/pages/admin/course-lessons";
import LessonForm from "@/pages/admin/lesson-form";
import CategoryForm from "@/pages/admin/category-form";
import AdminMedia from "@/pages/admin/media";
import MediaUpload from "@/pages/admin/media-upload";
import WorkshopEditor from "@/pages/admin/workshop-editor";
import OnboardingAnalytics from "@/pages/admin/onboarding-analytics";
import Setup from "@/pages/setup";
import Lesson from "@/pages/lesson";
import Events from "@/pages/events";
import Community from "@/pages/community";
import Perks from "@/pages/perks";
import Profile from "@/pages/profile";
import MyProgress from "@/pages/my-progress";
import Saved from "@/pages/saved";
import Planes from "@/pages/planes";
import Support from "@/pages/support";
import Login from "@/pages/login";
import DebugPage from "@/pages/debug";
import SimpleDashboard from "@/pages/simple-dashboard";
import SimpleLogin from "@/pages/simple-login";
import RealDashboard from "@/pages/real-dashboard";

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
    return hostname.startsWith('app.');
  };

  // Si estamos en el dominio principal, mostrar páginas públicas
  if (!isAppDomain()) {
    return (
      <Switch>
        <Route path="/" component={PublicLanding} />
        <Route path="/universidad-nocode-ia" component={UniversidadNoCodeIA} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  // Si estamos en app.dominio.com, mostrar la aplicación LMS
  return (
    <Switch>
      {/* Rutas de preview disponibles sin autenticación */}
      <Route path="/preview-landing" component={PublicLanding} />
      <Route path="/preview-universidad" component={UniversidadNoCodeIA} />
      <Route path="/preview-admin" component={Setup} />
      
      {isLoading ? (
        <Route path="/" component={() => <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-foreground">Cargando...</div>
        </div>} />
      ) : !isAuthenticated ? (
        <>
          {/* Public access to main content pages with locked content */}
          <Route path="/" component={Dashboard} />
          <Route path="/courses" component={Courses} />
          <Route path="/guides" component={Guides} />
          <Route path="/talleres" component={Workshops} />
          <Route path="/categoria/:categorySlug" component={CategoryPage} />
          
          {/* Course pages - show real content but locked for non-authenticated users */}
          <Route path="/course/:id" component={Course} />
          <Route path="/curso/:id" component={Course} />
          <Route path="/rooms/:roomSlug/curso/:id" component={Course} />
          <Route path="/guia/:id" component={Guide} />
          <Route path="/taller/:id" component={Workshop} />
          <Route path="/sala/:slug" component={Room} />
          
          {/* Admin redirect - redirect to login if not authenticated */}
          <Route path="/admin">
            {() => <Redirect to="/login" />}
          </Route>
          
          {/* Authentication and support pages */}
          <Route path="/login" component={SimpleLogin} />
          <Route path="/planes" component={Planes} />
          <Route path="/apoyo" component={Support} />
          <Route path="/support" component={Support} />
          <Route component={NotFound} />
        </>
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/onboarding" component={Onboarding} />
          <Route path="/courses" component={Courses} />
          <Route path="/guides" component={Guides} />
          <Route path="/talleres" component={Workshops} />
          <Route path="/taller/:id" component={Workshop} />
          <Route path="/events" component={Events} />
          <Route path="/community" component={Community} />
          <Route path="/perks" component={Perks} />
          <Route path="/profile" component={Profile} />
          <Route path="/progreso" component={MyProgress} />
          <Route path="/progress" component={MyProgress} />
          <Route path="/mi-progreso" component={MyProgress} />
          <Route path="/saved" component={Saved} />
          <Route path="/guardado" component={Saved} />
          <Route path="/planes" component={Planes} />
          <Route path="/support" component={Support} />
          <Route path="/apoyo" component={Support} />
          <Route path="/categoria/:categorySlug" component={CategoryPage} />
          <Route path="/course/:courseId/lesson/:lessonId" component={Lesson} />
          <Route path="/course/:id" component={Course} />
          <Route path="/curso/:id" component={Course} />
          <Route path="/rooms/:roomSlug/curso/:id" component={Course} />
          <Route path="/guia/:id" component={Guide} />
          <Route path="/sala/:slug" component={Room} />
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/admin/dashboard" component={AdminDashboard} />
          <Route path="/admin/onboarding" component={OnboardingAnalytics} />
          <Route path="/admin/content" component={ContentManagement} />
          <Route path="/admin/content/course/new" component={CourseForm} />
          <Route path="/admin/content/course/:id/lessons" component={CourseLessons} />
          <Route path="/admin/content/course/:id/edit" component={CourseForm} />
          <Route path="/admin/content/lesson/new/:courseId" component={LessonForm} />
          <Route path="/admin/content/lesson/:id/edit" component={LessonForm} />
          <Route path="/admin/content/category/new" component={CategoryForm} />
          <Route path="/admin/workshops/:action/:id?" component={WorkshopEditor} />
          <Route path="/admin/media" component={AdminMedia} />
          <Route path="/admin/media/upload" component={MediaUpload} />
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
