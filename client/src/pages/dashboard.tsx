import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import MobileHeader from "@/components/layout/mobile-header";
import CourseCard from "@/components/course-card";
import { SubscriptionStatus } from "@/components/subscription/SubscriptionBadge";
import { Button } from "@/components/ui/button";
import { Bell, ChevronLeft, ChevronRight, Plus, Shield, Lightbulb, Zap, Users, CheckCircle, Star, Award, Calendar, BookOpen } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "wouter";

const HERO_PHRASES = ["30 días", "su flujo de trabajo", "el mundo real"];

export default function Dashboard() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { subscription, isFreePlan } = useSubscription();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [guidesSlide, setGuidesSlide] = useState(0);
  const [workshopsSlide, setWorkshopsSlide] = useState(0);
  const [coursesSlide, setCoursesSlide] = useState(0);
  const [heroPhraseIndex, setHeroPhraseIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setHeroPhraseIndex((i) => (i + 1) % HERO_PHRASES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // No authentication redirect - allow public access with locked content

  // Fetch different data based on authentication status
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ["/api/dashboard"],
    enabled: isAuthenticated,
    refetchOnWindowFocus: false,
  });

  // For non-authenticated users, fetch public data
  const { data: coursesData, isLoading: coursesLoading } = useQuery({
    queryKey: ["/api/courses"],
    enabled: !isAuthenticated,
  });

  const { data: guidesData, isLoading: guidesLoading } = useQuery({
    queryKey: ["/api/guides"],
    enabled: !isAuthenticated,
  });

  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ["/api/categories"],
    enabled: !isAuthenticated,
  });

  const { data: workshopsData, isLoading: workshopsLoading } = useQuery({
    queryKey: ["/api/workshops"],
    enabled: !isAuthenticated,
  });

  const { data: roomsData } = useQuery({
    queryKey: ["/api/rooms"],
  });

  if (isLoading || dashboardLoading || (!isAuthenticated && (coursesLoading || guidesLoading || categoriesLoading || workshopsLoading))) {
    return (
      <div className="min-h-screen flex" style={{ backgroundColor: '#0f0f19' }}>
        <div className="w-64 bg-card border-r border-border"></div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  // Use different data sources based on authentication
  const continueCourses: any[] = isAuthenticated ? ((dashboardData as any)?.continueCourses || []) : [];
  const last30Days: { date: string; active: boolean }[] = isAuthenticated ? ((dashboardData as any)?.last30Days ?? []) : [];
  // Racha = días activos consecutivos desde el día más reciente (igual que los cuadros azules del grid)
  const streakDays: number = isAuthenticated
    ? (() => {
        let s = 0;
        for (let i = last30Days.length - 1; i >= 0; i--) {
          if (last30Days[i]?.active) s++;
          else break;
        }
        return s;
      })()
    : 0;
  const recentGuides: any[] = isAuthenticated ? ((dashboardData as any)?.recentGuides ?? []) : [];
  
  // For non-authenticated users, combine courses, guides and workshops for recommendations
  const publicCourses: Array<{ course: any; category: null; progress: null }> = !isAuthenticated ? ((coursesData as any) || []).map((course: any) => ({ course, category: null, progress: null })) : [];
  const publicGuides: Array<{ course: any; category: null; progress: null }> = !isAuthenticated ? ((guidesData as any) || []).map((guide: any) => ({ course: guide, category: null, progress: null })) : [];
  const publicWorkshops: Array<{ course: any; category: null; progress: null }> = !isAuthenticated ? ((workshopsData as any) || []).map((workshop: any) => ({ course: workshop, category: null, progress: null })) : [];
  
  const recommendedCourses: any[] = isAuthenticated 
    ? ((dashboardData as any)?.recommendedCourses || []) 
    : [...publicCourses, ...publicGuides, ...publicWorkshops];
    
  // Filter out the "Otros" category (cat-12) from the list as it's used only as an expand button
  const categories = (isAuthenticated 
    ? ((dashboardData as any)?.categories || []) 
    : (categoriesData as any) || [])
    .filter((cat: any) => cat.id !== 'cat-12');

  const cardsPerView = 4;
  // Use the correct data source for carousel navigation
  const currentCourseList = isAuthenticated && continueCourses.length > 0 
    ? continueCourses 
    : recommendedCourses.filter((item: any) => item.course?.type === 'course');
  const maxCourses = Math.min(currentCourseList.length, 8);
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
    <div className="min-h-screen text-foreground" style={{ backgroundColor: '#0f0f19' }}>
      {/* Mobile Header */}
      <MobileHeader />
      <div className="flex">
        {/* Sidebar - Hidden on mobile */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        
        {/* Main Content */}
        <main className="flex-1 overflow-auto pb-20 lg:pb-0 lg:ml-[250px]" style={{ backgroundColor: '#0f0f19' }}>
        <div className="w-full min-w-0 px-8 lg:px-16 xl:px-24 py-6 lg:py-8 space-y-6 lg:space-y-8" key="main-content">
          {/* Authenticated: Hero with greeting + 30-day activity (same card design as home) */}
          {isAuthenticated && (
            <div className="max-w-6xl mx-auto mb-8">
              <div className="rounded-xl p-6 lg:p-12 border border-gray-800/50 shadow-xl" style={{ backgroundColor: '#0f0f19' }}>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
                  <div className="lg:col-span-7 text-left">
                    <p className="text-sm text-gray-400 uppercase tracking-wide mb-4">TU ENFOQUE DIARIO</p>
                    <h1 className="font-bold text-white mb-4 tracking-tighter leading-[1.05]" style={{ fontSize: '40px', fontFamily: "'Sora', sans-serif", letterSpacing: '-0.03em' }}>
                      Bienvenido de nuevo, {user?.firstName || 'Usuario'}
                    </h1>
                    <p className="text-lg text-gray-400 max-w-xl mb-8">
                      Tu próxima victoria con IA ya está lista. Mantén el impulso y aprovecha al máximo el día de hoy.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Link href="/guides">
                        <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white text-base px-8 py-3 rounded-lg font-medium">
                          Explorar guías
                        </Button>
                      </Link>
                      <Link href="/courses">
                        <Button size="lg" variant="outline" className="bg-transparent border-gray-600 text-white hover:bg-gray-800 text-base px-8 py-3 rounded-lg font-medium">
                          Empezar de nuevo
                        </Button>
                      </Link>
                    </div>
                  </div>
                  <div className="lg:col-span-5 flex flex-col gap-3">
                    {/* Badge de racha: fuera de card, alineado a la derecha */}
                    <div className="flex justify-end shrink-0">
                      <div
                        className="inline-flex items-center gap-2 rounded-lg px-4 py-2"
                        style={{ backgroundColor: '#291b1a', border: '1px solid rgba(237, 155, 17, 0.4)' }}
                      >
                        <Star className="h-5 w-5 flex-shrink-0" style={{ color: '#ed9b11', fill: '#ed9b11' }} />
                        <span className="text-sm font-medium" style={{ color: '#ed9b11' }}>
                          racha de {streakDays} {streakDays === 1 ? 'día' : 'días'}
                        </span>
                      </div>
                    </div>
                    {/* Card ÚLTIMOS 30 DÍAS: título + leyenda (Menos + círculos + Más) + grid 3×10 */}
                    <div className="rounded-xl p-4 border border-gray-700/50 flex-1 min-h-0" style={{ backgroundColor: '#1f1e23' }}>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">ÚLTIMOS 30 DÍAS</p>
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="text-[10px] text-gray-500">Menos</span>
                        {[
                          'rgba(255,255,255,0.08)',
                          'rgba(59, 130, 246, 0.35)',
                          'rgba(59, 130, 246, 0.65)',
                          'rgb(59, 130, 246)',
                        ].map((bg, i) => (
                          <div key={i} className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: bg }} />
                        ))}
                        <span className="text-[10px] text-gray-500">Más</span>
                      </div>
                      <div className="grid grid-cols-10 gap-0.5 auto-rows-fr" style={{ aspectRatio: '10/3' }}>
                        {last30Days.map((day) => (
                          <div
                            key={day.date}
                            className="rounded-[2px] min-w-0 min-h-0 w-full"
                            style={{ backgroundColor: day.active ? 'rgb(59, 130, 246)' : 'rgba(255,255,255,0.06)' }}
                            title={day.date}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Continue Learning Section OR Premium Features Section */}
          <section>
            {isAuthenticated ? (
              <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-4 lg:mb-6">
                  <h2 className="font-semibold text-foreground text-lg lg:text-[24px]">Continúa donde lo dejaste</h2>
                  <div className="hidden md:flex space-x-2">
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
                <div className="overflow-hidden -mx-4 px-4 lg:mx-0 lg:px-0 max-w-full lg:pr-1">
                  <div 
                    className="flex transition-transform duration-500 ease-in-out gap-4 lg:gap-6"
                    style={{ 
                      transform: `translateX(-${currentSlide * (100/4)}%)`
                    }}
                  >
                    {continueCourses.slice(0, 8).map((item: any, index: number) => (
                      <div 
                        key={item.course?.id} 
                        className="flex-shrink-0 w-[calc(85vw-1rem)] lg:w-[calc(25%-1.5rem)]"
                      >
                        <CourseCard
                          course={item.course}
                          category={item.category}
                          progress={item.progress}
                          lastLessonId={item.lastLessonId}
                          showContinueText={true}
                          isAuthenticated={isAuthenticated}
                          roomSlug={item.roomSlug}
                          variant="guideGrid"
                          showBrandLogo
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
              </div>
            ) : (
              <>
                {/* Hero Banner Section - card gris oscura centrada con márgenes (estilo imagen 2) */}
                <div className="max-w-6xl mx-auto mb-8">
                  <div className="rounded-xl p-6 lg:p-12 border border-gray-800/50 shadow-xl" style={{ backgroundColor: '#0f0f19' }}>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
                      {/* Columna izquierda: título, descripción, botones (define altura de la fila) */}
                      <div className="lg:col-span-7 text-left">
                        <p className="text-sm text-gray-400 uppercase tracking-wide mb-4">QUEREMOS SER LA PLATAFORMA DE EDUCACIÓN EN NOCODE IA N.º 1</p>
                        <h1
                          className="font-bold text-white mb-4 tracking-tighter leading-[1.05]"
                          style={{ fontSize: '64px', fontFamily: "'Sora', sans-serif", letterSpacing: '-0.03em' }}
                        >
                          <span className="block">Domina la IA en</span>
                          <span className="block text-purple-500">{HERO_PHRASES[heroPhraseIndex]}</span>
                        </h1>
                      <p className="text-lg text-gray-400 max-w-xl mb-8">
                        Únase a nuevos profesionales que están transformando sus carreras con tutoriales prácticos de NoCode e IA actualizados diariamente.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <Button 
                          size="lg" 
                          className="bg-blue-600 hover:bg-blue-700 text-white text-base px-8 py-3 rounded-lg font-medium"
                          onClick={() => window.location.href = '/register'}
                        >
                          Comience una prueba gratuita
                        </Button>
                        <Button 
                          size="lg" 
                          variant="outline"
                          className="bg-transparent border-gray-600 text-white hover:bg-gray-800 text-base px-8 py-3 rounded-lg font-medium"
                          onClick={() => window.location.href = '/api/login'}
                        >
                          Iniciar sesión
                        </Button>
                      </div>
                    </div>
                      {/* Columna derecha: misma altura que la columna izquierda (hasta los botones); testimonio con rostros */}
                      <div className="lg:col-span-5 flex flex-col gap-2 min-h-0 self-stretch">
                        <div className="rounded-xl px-5 py-4 border border-gray-700/50 text-left w-full min-h-[5.5rem] flex flex-col justify-center shrink-0" style={{ backgroundColor: '#1f1e23' }}>
                          <p className="text-xs text-gray-400 uppercase tracking-wide">MIEMBROS ACTUALES</p>
                          <p className="text-sm font-medium text-purple-400">Subiendo hasta llegar a los primeros 1000</p>
                        </div>
                        {/* Testimonios - poco espacio interno para que la línea inferior coincida con los botones */}
                        <div className="rounded-xl px-3 py-2 border border-gray-700/50 text-left flex-1 min-h-0 flex flex-col overflow-hidden" style={{ backgroundColor: '#1f1e23' }}>
                          <div className="flex -space-x-2 mb-1 shrink-0">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                              <Avatar key={i} className="h-8 w-8 border-2 border-gray-800">
                                <AvatarImage src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="" />
                                <AvatarFallback className="bg-gray-600 text-gray-300 text-xs">{["LC", "A", "B", "C", "D", "E", "F", "G"][i - 1]}</AvatarFallback>
                              </Avatar>
                            ))}
                          </div>
                          {/* Testimonio 1 - Mateo S. */}
                          <p className="text-xs text-gray-300 mb-0 leading-snug">
                            Muy relevante y fácil de seguir. Valoro la claridad de los marcos y enfoques para utilizar la IA.
                          </p>
                          <p className="text-xs text-gray-500 mb-0.5">— Mateo S. Miembro de Universidad Expertos NoCode UA</p>
                          <div className="flex gap-0.5 mb-2">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                            ))}
                          </div>
                          {/* Testimonio 2 - Carmen M. */}
                          <p className="text-xs text-gray-300 mb-0 leading-snug">
                            Excelente contenido, muy práctico para aplicar en mi día a día. Lo recomiendo totalmente.
                          </p>
                          <p className="text-xs text-gray-500 mb-0.5">— Carmen M. Miembro de Universidad Expertos NoCode UA</p>
                          <div className="flex gap-0.5 mt-auto">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <Star key={`2-${i}`} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Feature Highlights - fila ancho completo, distribuidas hasta el borde */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full mt-8">
                      <div className="rounded-lg p-4 border border-gray-700 text-left min-w-0 flex items-center gap-3" style={{ backgroundColor: '#1f1e23' }}>
                        <div className="rounded-full flex-shrink-0 flex items-center justify-center w-11 h-11" style={{ backgroundColor: '#1d2d35' }}>
                          <Star className="h-6 w-6" style={{ color: '#2548b6' }} />
                        </div>
                        <p className="text-sm text-gray-300">Más de 300 casos de uso de IA</p>
                      </div>
                      <div className="rounded-lg p-4 border border-gray-700 text-left min-w-0 flex items-center gap-3" style={{ backgroundColor: '#1f1e23' }}>
                        <div className="rounded-full flex-shrink-0 flex items-center justify-center w-11 h-11" style={{ backgroundColor: '#1d2d35' }}>
                          <Zap className="h-6 w-6" style={{ color: '#2548b6' }} />
                        </div>
                        <p className="text-sm text-gray-300">Actualizaciones diarias</p>
                      </div>
                      <div className="rounded-lg p-4 border border-gray-700 text-left min-w-0 flex items-center gap-3" style={{ backgroundColor: '#1f1e23' }}>
                        <div className="rounded-full flex-shrink-0 flex items-center justify-center w-11 h-11" style={{ backgroundColor: '#1d2d35' }}>
                          <Users className="h-6 w-6" style={{ color: '#2548b6' }} />
                        </div>
                        <p className="text-sm text-gray-300">Comunidad de expertos</p>
                      </div>
                      <div className="rounded-lg p-4 border border-gray-700 text-left min-w-0 flex items-center gap-3" style={{ backgroundColor: '#1f1e23' }}>
                        <div className="rounded-full flex-shrink-0 flex items-center justify-center w-11 h-11" style={{ backgroundColor: '#1d2d35' }}>
                          <Award className="h-6 w-6" style={{ color: '#2548b6' }} />
                        </div>
                        <p className="text-sm text-gray-300">Certificaciones de IA</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </section>
          
          {/* Daily Guides Section - Only for non-authenticated */}
          {!isAuthenticated && (
            <section className="mb-8">
              <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-semibold text-foreground mb-2" style={{ fontFamily: "'Sora', sans-serif", fontSize: '36px', letterSpacing: '-0.03em' }}>Guías diarias</h2>
                    <span className="inline-block px-4 py-2 rounded-full text-white" style={{ backgroundColor: '#22211f', fontFamily: "'Sora', sans-serif", fontSize: '14px', letterSpacing: '-0.02em' }}>Disponible con nuestra prueba gratuita</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => window.location.href = '/register'}
                    >
                      Comience una prueba gratuita
                    </Button>
                    <div className="hidden md:flex space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 rounded-full bg-card border border-border hover:bg-muted"
                        onClick={() => setGuidesSlide(Math.max(0, guidesSlide - 1))}
                        disabled={guidesSlide === 0}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 rounded-full bg-card border border-border hover:bg-muted"
                        onClick={() => {
                          const guides = publicGuides || [];
                          const maxSlide = Math.max(0, guides.length - 3);
                          setGuidesSlide(Math.min(maxSlide, guidesSlide + 1));
                        }}
                        disabled={guidesSlide >= Math.max(0, (publicGuides?.length || 0) - 3)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="overflow-hidden -mx-4 px-4 lg:mx-0 lg:px-0 max-w-full lg:pr-1">
                <div className="flex gap-4 transition-transform duration-300 ease-out" style={{ transform: `translateX(-${guidesSlide * (100/3)}%)` }}>
                  {publicGuides && publicGuides.length > 0 ? (
                    <>
                      {publicGuides.slice(0, 6).map((item: any) => (
                        <div key={item.course?.id} className="flex-shrink-0 w-[calc(85vw-1rem)] lg:w-[calc((100%-2rem)/3)]">
                          <CourseCard
                            course={item.course}
                            category={item.category}
                            progress={item.progress}
                            isAuthenticated={isAuthenticated}
                            variant="guideGrid"
                          />
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground w-full">
                      <p>No hay guías disponibles en este momento.</p>
                    </div>
                  )}
                </div>
              </div>
              </div>
            </section>
          )}

          {/* Últimos boletines - Only for authenticated (placeholder) */}
          {isAuthenticated && (
            <section className="mb-8">
              <div className="max-w-6xl mx-auto">
                <h2 className="font-semibold text-foreground mb-4" style={{ fontFamily: "'Sora', sans-serif", fontSize: '36px', letterSpacing: '-0.03em' }}>Últimos boletines</h2>
                <div className="rounded-xl border border-border p-8 text-center" style={{ backgroundColor: '#1f1e23' }}>
                  <p className="text-muted-foreground text-sm">No hay boletines disponibles aún.</p>
                </div>
              </div>
            </section>
          )}

          {/* Guías más recientes - Only for authenticated: 3 últimas por fecha de publicación */}
          {isAuthenticated && (
            <section className="mb-8">
              <div className="max-w-6xl mx-auto">
                <div className="mb-4">
                  <h2 className="font-semibold text-foreground mb-4" style={{ fontFamily: "'Sora', sans-serif", fontSize: '36px', letterSpacing: '-0.03em' }}>Guías más recientes</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentGuides.length > 0 ? (
                    recentGuides.map((item: any) => (
                      <div key={item.course?.id} className="w-full">
                        <CourseCard
                          course={item.course}
                          category={item.category}
                          progress={item.progress}
                          isAuthenticated={isAuthenticated}
                          variant="guideGrid"
                        />
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-8 text-muted-foreground">
                      <p>No hay guías disponibles en este momento.</p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Programs Section (Rooms) - solo cuando no está logueado */}
          {!isAuthenticated && roomsData && (roomsData as any).length > 0 && (
            <section className="mb-8">
              <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-4 lg:mb-6">
                  <div>
                    <h2 className="font-semibold text-foreground mb-2" style={{ fontFamily: "'Sora', sans-serif", fontSize: '36px', letterSpacing: '-0.03em' }}>Programas</h2>
                    <span className="inline-block px-4 py-2 rounded-full text-white mt-1" style={{ backgroundColor: '#22211f', fontFamily: "'Sora', sans-serif", fontSize: '14px', letterSpacing: '-0.02em' }}>Disponibles con una suscripción</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                  {(roomsData as any).map((room: any) => {
                    const bannerImage = room.heroImageUrl || room.coverImageUrl;
                    const meta = room.metadata || {};
                    const instructor = meta.instructor || meta.Instructor || {};
                    const instructorName = instructor?.name ?? instructor?.nombre ?? "Equipo Expertos NoCode IA";
                    return (
                      <Link key={room.id} href={`/sala/${room.slug}`}>
                        <div className="group bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 cursor-pointer h-full flex flex-col">
                          {/* Imagen con padding y bordes como la card */}
                          <div className="pt-3 px-3 lg:pt-4 lg:px-4">
                            <div className="relative aspect-[3/2] bg-muted/40 rounded-xl border border-border overflow-hidden">
                              {bannerImage ? (
                                <img
                                  src={bannerImage}
                                  alt={room.title}
                                  className="w-full h-full object-cover object-center brightness-90 group-hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-background" />
                              )}
                              <div className="absolute inset-0 bg-black/15 pointer-events-none" aria-hidden />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                          {/* Content - sin lista de features, texto más arriba */}
                          <div className="pt-3 px-4 pb-4 lg:pt-3 lg:px-5 lg:pb-5 flex flex-col flex-1">
                            <h3 className="text-lg lg:text-xl font-bold mb-1.5 group-hover:text-primary transition-colors">
                              {room.title}
                            </h3>
                            <p className="text-muted-foreground text-xs lg:text-sm line-clamp-2 flex-1">
                              {room.shortDescription || room.description}
                            </p>
                            {/* Impartido por */}
                            <div className="pt-3 border-t border-border/50 mt-auto">
                              <span className="text-xs text-muted-foreground">
                                Impartido por {instructorName}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* Weekly Workshops Section - Only for non-authenticated */}
          {!isAuthenticated && (
            <section className="mb-8">
              <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-semibold text-foreground mb-2" style={{ fontFamily: "'Sora', sans-serif", fontSize: '36px', letterSpacing: '-0.03em' }}>Talleres semanales</h2>
                    <span className="inline-block px-4 py-2 rounded-full text-white" style={{ backgroundColor: '#22211f', fontFamily: "'Sora', sans-serif", fontSize: '14px', letterSpacing: '-0.02em' }}>Disponibles con una cuenta gratuita</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => window.location.href = '/register'}
                    >
                      Crear cuenta gratuita
                    </Button>
                    <div className="hidden md:flex space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 rounded-full bg-card border border-border hover:bg-muted"
                        onClick={() => setWorkshopsSlide(Math.max(0, workshopsSlide - 1))}
                        disabled={workshopsSlide === 0}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 rounded-full bg-card border border-border hover:bg-muted"
                        onClick={() => {
                          const maxSlide = Math.max(0, publicWorkshops.length - 3);
                          setWorkshopsSlide(Math.min(maxSlide, workshopsSlide + 1));
                        }}
                        disabled={workshopsSlide >= Math.max(0, publicWorkshops.length - 3)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="overflow-hidden -mx-4 px-4 lg:mx-0 lg:px-0 max-w-full lg:pr-1">
                  <div className="flex gap-4 transition-transform duration-300 ease-out" style={{ transform: `translateX(-${workshopsSlide * (100/3)}%)` }}>
                    {publicWorkshops.slice(0, 6).map((item: any) => (
                      <div key={item.course?.id} className="flex-shrink-0 w-[calc(85vw-1rem)] lg:w-[calc((100%-2rem)/3)]">
                        <CourseCard
                          course={item.course}
                          category={item.category}
                          progress={item.progress}
                          isAuthenticated={isAuthenticated}
                          variant="guideGrid"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Quarterly Courses Section - Only for non-authenticated */}
          {!isAuthenticated && (
            <section className="mb-8">
              <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-semibold text-foreground mb-2" style={{ fontFamily: "'Sora', sans-serif", fontSize: '36px', letterSpacing: '-0.03em' }}>Cursos</h2>
                    <span className="inline-block px-4 py-2 rounded-full text-white" style={{ backgroundColor: '#22211f', fontFamily: "'Sora', sans-serif", fontSize: '14px', letterSpacing: '-0.02em' }}>Disponibles con una suscripción</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => window.location.href = '/register'}
                    >
                      Regístrate para ser profesional
                    </Button>
                    <div className="hidden md:flex space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 rounded-full bg-card border border-border hover:bg-muted"
                        onClick={() => setCoursesSlide(Math.max(0, coursesSlide - 1))}
                        disabled={coursesSlide === 0}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 rounded-full bg-card border border-border hover:bg-muted"
                        onClick={() => {
                          const maxSlide = Math.max(0, publicCourses.length - 3);
                          setCoursesSlide(Math.min(maxSlide, coursesSlide + 1));
                        }}
                        disabled={coursesSlide >= Math.max(0, publicCourses.length - 3)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="overflow-hidden -mx-4 px-4 lg:mx-0 lg:px-0 max-w-full lg:pr-1">
                  <div className="flex gap-4 transition-transform duration-300 ease-out" style={{ transform: `translateX(-${coursesSlide * (100/3)}%)` }}>
                    {publicCourses.slice(0, 6).map((item: any) => (
                      <div key={item.course?.id} className="flex-shrink-0 w-[calc(85vw-1rem)] lg:w-[calc((100%-2rem)/3)]">
                        <CourseCard
                          course={item.course}
                          category={item.category}
                          progress={item.progress}
                          isAuthenticated={isAuthenticated}
                          variant="guideGrid"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Próximos talleres - Only for authenticated (same layout as home) */}
          {isAuthenticated && (
            <section className="mb-8">
              <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-semibold text-foreground mb-4" style={{ fontFamily: "'Sora', sans-serif", fontSize: '36px', letterSpacing: '-0.03em' }}>Próximos talleres</h2>
                  </div>
                  <div className="hidden md:flex space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 rounded-full bg-card border border-border hover:bg-muted"
                      onClick={() => setWorkshopsSlide(Math.max(0, workshopsSlide - 1))}
                      disabled={workshopsSlide === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 rounded-full bg-card border border-border hover:bg-muted"
                      onClick={() => {
                        const workshops = recommendedCourses.filter((i: any) => i.course?.type === 'workshop');
                        setWorkshopsSlide(Math.min(Math.max(0, workshops.length - 3), workshopsSlide + 1));
                      }}
                      disabled={workshopsSlide >= Math.max(0, recommendedCourses.filter((i: any) => i.course?.type === 'workshop').length - 3)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="overflow-hidden -mx-4 px-4 lg:mx-0 lg:px-0 max-w-full lg:pr-1">
                  <div className="flex gap-4 transition-transform duration-300 ease-out" style={{ transform: `translateX(-${workshopsSlide * (100/3)}%)` }}>
                    {recommendedCourses.filter((item: any) => item.course?.type === 'workshop').length > 0 ? (
                      recommendedCourses.filter((item: any) => item.course?.type === 'workshop').slice(0, 6).map((item: any) => (
                        <div key={item.course?.id} className="flex-shrink-0 w-[calc(85vw-1rem)] lg:w-[calc((100%-2rem)/3)]">
                          <CourseCard
                            course={item.course}
                            category={item.category}
                            progress={item.progress}
                            isAuthenticated={isAuthenticated}
                            variant="guideGrid"
                          />
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground w-full">
                        <p>No hay talleres disponibles en este momento.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}

        </div>
        </main>
      </div>
      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
}
