import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import MobileHeader from "@/components/layout/mobile-header";
import CourseCard from "@/components/course-card";
import TopicCard from "@/components/topic-card";
import { SubscriptionStatus } from "@/components/subscription/SubscriptionBadge";
import { Button } from "@/components/ui/button";
import { Bell, ChevronLeft, ChevronRight, Plus, Shield } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { subscription, isFreePlan } = useSubscription();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ["/api/dashboard"],
    enabled: isAuthenticated,
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });

  if (isLoading || dashboardLoading) {
    return (
      <div className="min-h-screen bg-background flex">
        <div className="w-64 bg-card border-r border-border"></div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  const continueCourses = (dashboardData as any)?.continueCourses || [];
  const recommendedCourses = (dashboardData as any)?.recommendedCourses || [];
  const categories = (dashboardData as any)?.categories || [];

  const cardsPerView = 4;
  const maxCourses = Math.min(continueCourses.length, 8);
  const maxSlidePosition = Math.max(0, maxCourses - cardsPerView);
  
  const nextSlide = () => {
    setCurrentSlide((prev) => Math.min(prev + 1, maxSlidePosition));
  };
  
  const prevSlide = () => {
    setCurrentSlide((prev) => Math.max(prev - 1, 0));
  };
  
  // No longer needed since we're using CSS transforms
  // const getCurrentCards = () => {
  //   const startIndex = currentSlide;
  //   return continueCourses.slice(startIndex, startIndex + cardsPerView);
  // };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Mobile Header */}
      <MobileHeader />
      <div className="flex">
        {/* Sidebar - Hidden on mobile */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        
        {/* Main Content */}
        <main className="flex-1 overflow-auto pb-20 lg:pb-0 lg:ml-[250px]">
        <div className="p-6 space-y-8">
          {/* Continue Learning Section */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold text-foreground text-[24px]">Continúa donde lo dejaste</h2>
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 rounded-full bg-card border border-border hover:bg-muted disabled:opacity-50"
                  onClick={prevSlide}
                  disabled={currentSlide <= 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 rounded-full bg-card border border-border hover:bg-muted disabled:opacity-50"
                  onClick={nextSlide}
                  disabled={currentSlide >= maxSlidePosition}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="overflow-hidden">
              <div 
                className="flex transition-transform duration-500 ease-in-out"
                style={{ 
                  transform: `translateX(-${currentSlide * (100/4)}%)`,
                  gap: '1.5rem'
                }}
              >
                {continueCourses.slice(0, 8).map((item: any, index: number) => (
                  <div 
                    key={item.course?.id} 
                    className="flex-shrink-0"
                    style={{ width: 'calc(25% - 1.125rem)' }}
                  >
                    <CourseCard
                      course={item.course}
                      category={item.category}
                      progress={item.progress}
                    />
                  </div>
                ))}
              </div>
            </div>
            {continueCourses.length === 0 && (
              <div className="w-full text-center py-12 text-muted-foreground">
                <p>No has visitado ningún curso aún. ¡Explora y comienza a aprender algo nuevo!</p>
              </div>
            )}
          </section>

          {/* Guide Recommendations */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground text-[24px]">Recomendaciones de la guía</h2>
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 rounded-full bg-card border border-border hover:bg-muted"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 rounded-full bg-card border border-border hover:bg-muted"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="text-muted-foreground mb-6 text-[12px]">Basándonos en tus respuestas a la encuesta y tu historial en la plataforma, hemos seleccionado las mejores guías de IA para consultores . Siempre puedes cambiar tu enfoque en tu perfil.</p>

            {recommendedCourses.filter((item: any) => item.course?.type === 'guide').slice(0, 1).map((item: any) => (
              <div key={item.course.id} className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-shadow cursor-pointer mb-6">
                <div className="p-6">
                  <div className="flex items-start space-x-4">
                    <CourseCard
                      course={item.course}
                      category={item.category}
                      progress={item.progress}
                      variant="horizontal"
                    />
                  </div>
                </div>
              </div>
            ))}
          </section>

          {/* Course Recommendations */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold text-foreground text-[24px]">Recomendaciones de cursos</h2>
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 rounded-full bg-card border border-border hover:bg-muted"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 rounded-full bg-card border border-border hover:bg-muted"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {recommendedCourses.filter((item: any) => item.course?.type === 'course').slice(0, 4).map((item: any) => (
                <CourseCard
                  key={item.course.id}
                  course={item.course}
                  category={item.category}
                  progress={item.progress}
                />
              ))}
            </div>
          </section>

          {/* All Topics */}
          <section>
            <h2 className="font-semibold mb-6 text-foreground text-[24px]">Todos los temas</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {categories.map((category: any) => (
                <TopicCard key={category.id} category={category} />
              ))}
            </div>
          </section>
        </div>
        </main>
      </div>
      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
}
