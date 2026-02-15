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
import TopicCard from "@/components/topic-card";
import { SubscriptionStatus } from "@/components/subscription/SubscriptionBadge";
import { Button } from "@/components/ui/button";
import { Bell, ChevronLeft, ChevronRight, ChevronDown, Plus, Shield, Lightbulb, Zap, Users, CheckCircle, Settings, Star, Award, Calendar, BookOpen } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "wouter";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { subscription, isFreePlan } = useSubscription();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showOtherTopics, setShowOtherTopics] = useState(false);
  const [guidesSlide, setGuidesSlide] = useState(0);
  const [workshopsSlide, setWorkshopsSlide] = useState(0);
  const [coursesSlide, setCoursesSlide] = useState(0);

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
      <div className="min-h-screen flex" style={{ backgroundColor: '#0f0f1a' }}>
        <div className="w-64 bg-card border-r border-border"></div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  // Use different data sources based on authentication
  const continueCourses: any[] = isAuthenticated ? ((dashboardData as any)?.continueCourses || []) : [];
  
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
    <div className="min-h-screen text-foreground" style={{ backgroundColor: '#0f0f1a' }}>
      {/* Mobile Header */}
      <MobileHeader />
      <div className="flex">
        {/* Sidebar - Hidden on mobile */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        
        {/* Main Content */}
        <main className="flex-1 overflow-auto pb-20 lg:pb-0 lg:ml-[250px]">
        <div className="w-full min-w-0 px-8 lg:px-16 xl:px-24 py-6 lg:py-8 space-y-6 lg:space-y-8" key="main-content">
          {/* Continue Learning Section OR Premium Features Section */}
          <section>
            {isAuthenticated ? (
              <>
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
                <div className="overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0 lg:overflow-hidden scrollbar-hide">
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
              </>
            ) : (
              <>
                {/* Hero Banner Section - card gris oscura centrada con márgenes (estilo imagen 2) */}
                <div className="max-w-6xl mx-auto mb-8">
                  <div className="rounded-xl p-6 lg:p-12 bg-gray-900/90 border border-gray-800/50 shadow-xl">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
                      {/* Columna izquierda: título, descripción, botones (define altura de la fila) */}
                      <div className="lg:col-span-7 text-left">
                        <p className="text-sm text-gray-400 uppercase tracking-wide mb-4">QUEREMOS SER LA PLATAFORMA DE EDUCACIÓN EN NOCODE IA N.º 1</p>
                        <h1 className="text-4xl lg:text-6xl font-bold text-white mb-4">
                          Domina la IA en <span className="text-purple-500">30 días</span>
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
                        <div className="bg-gray-800/40 rounded-xl px-5 py-4 border border-gray-700/50 text-left w-full min-h-[5.5rem] flex flex-col justify-center shrink-0">
                          <p className="text-xs text-gray-400 uppercase tracking-wide">MIEMBROS ACTUALES</p>
                          <p className="text-sm font-medium text-purple-400">Subiendo hasta llegar a los primeros 1000</p>
                        </div>
                        {/* Testimonios - poco espacio interno para que la línea inferior coincida con los botones */}
                        <div className="bg-gray-800/40 rounded-xl px-3 py-2 border border-gray-700/50 text-left flex-1 min-h-0 flex flex-col overflow-hidden">
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
                      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 text-left min-w-0">
                        <Star className="h-5 w-5 text-yellow-400 mb-2" />
                        <p className="text-sm text-gray-300">Más de 300 casos de uso de IA</p>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 text-left min-w-0">
                        <Zap className="h-5 w-5 text-blue-400 mb-2" />
                        <p className="text-sm text-gray-300">Actualizaciones diarias</p>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 text-left min-w-0">
                        <Users className="h-5 w-5 text-green-400 mb-2" />
                        <p className="text-sm text-gray-300">Comunidad de expertos</p>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 text-left min-w-0">
                        <Award className="h-5 w-5 text-purple-400 mb-2" />
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
            <section className="mb-12">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-semibold text-foreground text-2xl lg:text-3xl mb-2">Guías diarias</h2>
                  <p className="text-muted-foreground text-sm">Disponible con nuestra prueba gratuita</p>
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
                        const guides = publicGuides;
                        const maxSlide = Math.max(0, guides.length - 3);
                        setGuidesSlide(Math.min(maxSlide, guidesSlide + 1));
                      }}
                      disabled={guidesSlide >= Math.max(0, publicGuides.length - 3)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0 scrollbar-hide">
                <div className="flex gap-4" style={{ transform: `translateX(-${guidesSlide * (100/3)}%)` }}>
                  {publicGuides && publicGuides.length > 0 ? (
                    <>
                      {publicGuides.slice(0, 6).map((item: any) => (
                        <div key={item.course?.id} className="flex-shrink-0 w-[calc(85vw-1rem)] lg:w-[calc(33.333%-1rem)]">
                          <CourseCard
                            course={item.course}
                            category={item.category}
                            progress={item.progress}
                            isAuthenticated={isAuthenticated}
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
            </section>
          )}

          {/* Guide Recommendations - Only for authenticated */}
          {isAuthenticated && (
            <section aria-label="Guide Recommendations">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-foreground text-lg lg:text-[24px]">Recomendaciones de la guía</h2>
                <div className="hidden md:flex space-x-2">
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
              <p className="text-muted-foreground mb-4 lg:mb-6 text-sm lg:text-[16px]">Basándonos en tus respuestas a la encuesta y tu historial en la plataforma, hemos seleccionado las mejores guías de IA para consultores . Siempre puedes cambiar tu enfoque en tu perfil.</p>

              {(() => {
                const guideItems = recommendedCourses.filter((item: any) => item.course?.type === 'guide').slice(0, 1);
                return guideItems.map((item: any) => (
                  <div key={item.course?.id} className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-shadow cursor-pointer mb-6">
                    <div className="p-6">
                      <div className="flex items-start space-x-4">
                        <CourseCard
                          course={item.course}
                          category={item.category}
                          progress={item.progress}
                          variant="horizontal"
                          isAuthenticated={isAuthenticated}
                        />
                      </div>
                    </div>
                  </div>
                ));
              })()}
              {recommendedCourses.filter((item: any) => item.course?.type === 'guide').length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No hay guías recomendadas disponibles en este momento.</p>
                </div>
              )}
            </section>
          )}

          {/* Programs Section (Rooms) */}
          {roomsData && (roomsData as any).length > 0 && (
            <section className="mb-12">
              <div className="flex items-center justify-between mb-4 lg:mb-6">
                <div>
                  <h2 className="font-semibold text-foreground text-2xl lg:text-3xl mb-2">Programas</h2>
                  <p className="text-muted-foreground text-sm lg:text-[16px] mt-1">Rutas de aprendizaje completas con contenido que se desbloquea semanalmente</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-8">
                {(roomsData as any).map((room: any) => (
                  <Link key={room.id} href={`/sala/${room.slug}`}>
                    <div className="group relative bg-card rounded-xl border border-border overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer h-full min-h-[280px] lg:min-h-[320px]">
                      {/* Background Image/Gradient */}
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-background opacity-50 group-hover:opacity-70 transition-opacity" />
                      
                      {room.coverImageUrl && (
                        <div 
                          className="absolute inset-0 bg-cover bg-center opacity-30 lg:opacity-20 group-hover:opacity-40 lg:group-hover:opacity-30 transition-opacity"
                          style={{ backgroundImage: `url(${room.coverImageUrl})` }}
                        />
                      )}
                      
                      {/* Content */}
                      <div className="relative p-4 lg:p-6 h-full flex flex-col">
                        <div className="flex-1">
                          <h3 className="text-lg lg:text-xl font-bold mb-2 lg:mb-3 group-hover:text-primary transition-colors">
                            {room.title}
                          </h3>
                          
                          <p className="text-muted-foreground text-xs lg:text-sm mb-3 lg:mb-4 line-clamp-2">
                            {room.shortDescription || room.description}
                          </p>
                          
                          {room.metadata?.features && room.metadata.features.length > 0 && (
                            <div className="space-y-1.5 lg:space-y-2 mb-3 lg:mb-4">
                              {room.metadata.features.slice(0, 2).map((feature: string, idx: number) => (
                                <div key={idx} className="flex items-center gap-2 text-xs lg:text-sm text-muted-foreground">
                                  <CheckCircle className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-primary flex-shrink-0" />
                                  <span className="line-clamp-1">{feature}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between pt-3 lg:pt-4 border-t border-border/50">
                          <div className="text-xs lg:text-sm font-medium">
                            {room.price ? (
                              <span className="text-primary">
                                ${(room.price / 100).toFixed(0)} USD
                              </span>
                            ) : (
                              <span className="text-muted-foreground">Gratis</span>
                            )}
                          </div>
                          <Button variant="ghost" size="sm" className="text-xs lg:text-sm h-8 lg:h-9 px-3 lg:px-4 group-hover:bg-primary group-hover:text-primary-foreground">
                            Ver sala →
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Weekly Workshops Section - Only for non-authenticated */}
          {!isAuthenticated && (
            <section className="mb-12">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-semibold text-foreground text-2xl lg:text-3xl mb-2">Talleres semanales</h2>
                  <p className="text-muted-foreground text-sm">Disponible con cualquier cuenta gratuita</p>
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
              <div className="overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0 scrollbar-hide">
                <div className="flex gap-4" style={{ transform: `translateX(-${workshopsSlide * (100/3)}%)` }}>
                  {publicWorkshops.slice(0, 6).map((item: any) => (
                    <div key={item.course?.id} className="flex-shrink-0 w-[calc(85vw-1rem)] lg:w-[calc(33.333%-1rem)]">
                      <CourseCard
                        course={item.course}
                        category={item.category}
                        progress={item.progress}
                        isAuthenticated={isAuthenticated}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Quarterly Courses Section - Only for non-authenticated */}
          {!isAuthenticated && (
            <section className="mb-12">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-semibold text-foreground text-2xl lg:text-3xl mb-2">Cursos trimestrales</h2>
                  <p className="text-muted-foreground text-sm">Disponible con una suscripción pro</p>
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
              <div className="overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0 scrollbar-hide">
                <div className="flex gap-4" style={{ transform: `translateX(-${coursesSlide * (100/3)}%)` }}>
                  {publicCourses.slice(0, 6).map((item: any) => (
                    <div key={item.course?.id} className="flex-shrink-0 w-[calc(85vw-1rem)] lg:w-[calc(33.333%-1rem)]">
                      <CourseCard
                        course={item.course}
                        category={item.category}
                        progress={item.progress}
                        isAuthenticated={isAuthenticated}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Course Recommendations - Only for authenticated */}
          {isAuthenticated && (
            <section>
              <div className="flex items-center justify-between mb-4 lg:mb-6">
                <h2 className="font-semibold text-foreground text-lg lg:text-[24px]">Recomendaciones de Cursos</h2>
                <div className="hidden md:flex space-x-2">
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
                    isAuthenticated={isAuthenticated}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Workshop Recommendations - Only for authenticated */}
          {isAuthenticated && (
            <section>
              <div className="flex items-center justify-between mb-4 lg:mb-6">
                <h2 className="font-semibold text-foreground text-lg lg:text-[24px]">Recomendaciones del Talleres</h2>
                <div className="hidden md:flex space-x-2">
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
                {recommendedCourses.filter((item: any) => item.course?.type === 'workshop').slice(0, 4).map((item: any) => (
                  <CourseCard
                    key={item.course.id}
                    course={item.course}
                    category={item.category}
                    progress={item.progress}
                    isAuthenticated={isAuthenticated}
                  />
                ))}
              </div>
            </section>
          )}

          {/* All Topics */}
          <section>
            <h2 className="font-semibold mb-4 lg:mb-6 text-foreground text-lg lg:text-[24px]">Todos los temas</h2>
            
            {/* Main Topics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Show first 11 categories */}
              {categories.slice(0, 11).map((category: any) => (
                <TopicCard key={category.id} category={category} />
              ))}
              
              {/* Others dropdown button */}
              {categories.length > 11 && (
                <button 
                  type="button"
                  className="bg-card rounded-lg border border-border p-4 cursor-pointer hover:bg-muted transition-colors focus:ring-2 focus:ring-primary focus:outline-none"
                  onClick={() => setShowOtherTopics(!showOtherTopics)}
                  aria-expanded={showOtherTopics}
                  aria-controls="other-topics-grid"
                  data-testid="button-others-toggle"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Settings className="h-5 w-5 text-gray-400" />
                      <span className="font-medium text-foreground">Otros</span>
                    </div>
                    <ChevronDown 
                      className={`h-4 w-4 text-muted-foreground transition-transform ${showOtherTopics ? 'rotate-180' : ''}`} 
                    />
                  </div>
                </button>
              )}
            </div>

            {/* Expanded Other Topics */}
            {showOtherTopics && categories.length > 11 && (
              <div id="other-topics-grid" className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {categories.slice(11).map((category: any) => (
                  <TopicCard key={category.id} category={category} />
                ))}
              </div>
            )}
          </section>
        </div>
        </main>
      </div>
      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
}
