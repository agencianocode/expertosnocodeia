import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Lock, Play, BookOpen, Video, Calendar, Clock, Menu, ChevronLeft, ChevronRight, Info, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import CourseCard from "@/components/course-card";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import MobileHeader from "@/components/layout/mobile-header";
import { PromoBanner } from "@/components/PromoBanner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useState, useEffect } from "react";
import { useRef } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';

interface Phase {
  id: string;
  title: string;
  description: string | null;
  order: number;
  releaseDate: string;
  isLocked: boolean;
  content: PhaseContent[];
}

interface PhaseContent {
  id: string;
  contentType: string;
  contentId: string;
  order: number;
  courseData?: any;
}

interface Room {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  coverImageUrl: string | null;
  heroImageUrl: string | null;
  order: number;
  isPublished: boolean;
  price: number | null;
  currency: string;
  metadata: any;
}

interface PromoBannerData {
  id: string;
  roomId: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  backgroundImageUrl: string | null;
  backgroundColor: string;
  ctaText: string | null;
  ctaLink: string | null;
  displayAfterPhaseOrder: number;
  order: number;
  isActive: boolean;
}

interface RoomDetailResponse {
  room: Room;
  phases: Phase[];
  promoBanners: PromoBannerData[];
  userHasAccess: boolean;
}

export default function Room() {
  const { slug } = useParams();
  const { user, isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [openPopovers, setOpenPopovers] = useState<Record<string, boolean>>({});

  const { data: roomDetail, isLoading, error } = useQuery<RoomDetailResponse>({
    queryKey: [`/api/rooms/${slug}`],
    retry: 1,
    retryDelay: 1000,
  });

  // Get user progress for all courses in this room
  const { data: userProgress } = useQuery<Record<string, any>>({
    queryKey: [`/api/rooms/${slug}/user-progress`],
    enabled: isAuthenticated && !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Cargando sala...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Error al cargar la sala</h1>
          <p className="text-muted-foreground mb-4">
            {error instanceof Error ? error.message : 'Ocurrió un error inesperado'}
          </p>
          <Link href="/">
            <Button>Volver al inicio</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!roomDetail) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Sala no encontrada</h1>
          <p className="text-muted-foreground mb-4">
            La sala "{slug}" no existe o no está disponible.
          </p>
          <Link href="/">
            <Button>Volver al inicio</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { room, phases, promoBanners, userHasAccess } = roomDetail;
  const hasAccess = userHasAccess;
  const isAgentesIARoom = slug === 'agentes-ia';
  const isVibeCodingRoom = slug === 'vibe-coding';
  const shouldEnhanceGlow = slug === 'vibe-coding' || slug === 'nocode-saas-ia';

  return (
    <div className={cn(
      "min-h-screen text-foreground",
      isAgentesIARoom ? "bg-[#171717]" : isVibeCodingRoom ? "bg-[#151515]" : "bg-background"
    )}>
      {/* Mobile Header */}
      <MobileHeader />
      
      <div className="flex relative">
        {/* Sidebar with toggle functionality */}
        {sidebarOpen && (
          <Sidebar onToggle={() => setSidebarOpen(false)} />
        )}
        
        {/* Reopen Button - Only visible when sidebar is closed */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="hidden lg:flex fixed top-4 left-4 z-50 items-center justify-center w-10 h-10 bg-card hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg shadow-lg transition-all"
            title="Mostrar sidebar"
            data-testid="sidebar-reopen-button"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        
        {/* Main Content */}
        <main className={cn(
          "flex-1 overflow-auto pb-20 lg:pb-0 transition-all duration-300",
          "md:ml-16",
          sidebarOpen ? "lg:ml-[250px]" : "lg:ml-0"
        )}>
          {/* Hero Banner - Full width image only */}
          {room.heroImageUrl && (
            <div className="relative w-full h-[280px] sm:h-[320px] md:h-[400px] lg:h-[500px] xl:h-[600px] overflow-hidden">
              <img 
                src={room.heroImageUrl}
                alt={room.title}
                className="w-full h-full object-cover object-right sm:object-center"
              />
              {/* Overlay oscuro en móvil para ocultar texto de la imagen */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent sm:from-black/50 sm:via-transparent sm:to-transparent" />
              {/* Bottom fade to blend with content */}
              <div className="absolute bottom-0 left-0 right-0 h-24 sm:h-32 bg-gradient-to-t from-background to-transparent" />
            </div>
          )}

          {/* Phases Section */}
          <div className="container mx-auto px-4 pb-16 -mt-32 relative z-10">
            <div className="space-y-12">
              {phases?.map((phase, index) => {
                // Compute whether this phase is locked for the current user
                // Phase is locked if: user doesn't have room access OR phase release date hasn't passed
                const isLockedForUser = !hasAccess || phase.isLocked;
                
                // Find promo banners that should display after this phase
                // Compare as numbers to avoid type issues and ensure banner belongs to this room
                const bannersAfterPhase = (promoBanners || []).filter(
                  banner => {
                    // Ensure room exists before checking
                    if (!room || !banner) {
                      return false;
                    }
                    
                    // Ensure banner belongs to this room
                    if (banner.roomId !== room.id) {
                      return false;
                    }
                    
                    // Ensure banner is active
                    if (banner.isActive === false) {
                      return false;
                    }
                    
                    // Ensure both are numbers for comparison
                    const bannerOrder = Number(banner.displayAfterPhaseOrder);
                    const phaseOrderNum = Number(phase.order);
                    const matches = bannerOrder === phaseOrderNum;
                    
                    // Debug: Log when checking phase 3 or when there's a match
                    if (phaseOrderNum === 3 || matches) {
                      console.log(`🔍 Banner check - Phase ${phaseOrderNum} (${phase.title}):`, {
                        bannerTitle: banner.title,
                        bannerDisplayAfter: banner.displayAfterPhaseOrder,
                        bannerOrder,
                        phaseOrder: phase.order,
                        phaseOrderNum,
                        matches,
                        isActive: banner.isActive,
                        roomIdMatch: banner.roomId === room.id
                      });
                    }
                    
                    return matches;
                  }
                );
                
                return (
                  <div key={`phase-${phase.id}`}>
                    <div className="space-y-4">
                      {/* Phase Header */}
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="text-2xl font-bold">{phase.title}</h3>
                            
                            {/* Show "Bloqueado" if user doesn't have room access */}
                            {!hasAccess && (
                              <Badge variant="secondary" className="gap-1">
                                <Lock className="h-3 w-3" />
                                Requiere acceso
                              </Badge>
                            )}
                            
                            {/* Show release date for locked phases (due to future release) */}
                            {hasAccess && phase.isLocked && (
                              <Badge variant="outline" className="gap-1">
                                <Calendar className="h-3 w-3" />
                                Se desbloquea {new Date(phase.releaseDate).toLocaleDateString()}
                              </Badge>
                            )}
                          </div>
                          
                          {phase.description && (
                            <p className="text-muted-foreground mt-1">{phase.description}</p>
                          )}
                        </div>
                      </div>

                      {/* Phase Content - Horizontal scroll on mobile, grid on desktop */}
                      <div className="relative">
                        <div className="flex overflow-x-auto gap-4 pb-4 -mx-4 pl-6 pr-16 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 sm:gap-4 sm:overflow-visible scrollbar-hide sm:pr-0">
                        {phase.content
                          .filter((content) => {
                            // Filter out content that doesn't have courseData (deleted courses)
                            return content.courseData !== null && content.courseData !== undefined;
                          })
                          .map((content) => {
                          const getHref = () => {
                            // Allow non-authenticated users to click on courses (they can see first lesson)
                            if (isLockedForUser && isAuthenticated) return "#";
                            if (content.contentType === 'course') {
                              // Use slug if available, fallback to ID for backwards compatibility
                              const courseIdentifier = content.courseData?.slug || content.contentId;
                              return `/sala/${slug}/curso/${courseIdentifier}`;
                            }
                            if (content.contentType === 'workshop') return `/taller/${content.contentId}`;
                            if (content.contentType === 'guide') return `/guia/${content.contentId}`;
                            return "#";
                          };

                          const getBadgeText = () => {
                            if (content.contentType === 'workshop') return 'Workshop';
                            if (content.contentType === 'guide') return 'Guía';
                            return 'Curso';
                          };

                          // El endpoint indexa por content.contentId, pero también intentamos con courseData.id como fallback
                          const courseId = content.contentId;
                          const courseIdFromData = content.courseData?.id;
                          // Intentar obtener progreso con ambos IDs por si hay discrepancia
                          const courseProgress = content.contentType === 'course' && (
                            userProgress?.[courseId] || 
                            (courseIdFromData && userProgress?.[courseIdFromData])
                          );
                          
                          // Debug: Log para verificar el progreso
                          if (content.contentType === 'course' && content.courseData?.slug === 'introduccion-formacion-agentes-ia') {
                            console.log('[DEBUG Room Progress]', {
                              courseTitle: content.courseData?.title,
                              courseSlug: content.courseData?.slug,
                              contentId: courseId,
                              courseDataId: courseIdFromData,
                              userProgressKeys: Object.keys(userProgress || {}),
                              progressByContentId: userProgress?.[courseId],
                              progressByDataId: courseIdFromData ? userProgress?.[courseIdFromData] : undefined,
                              finalProgress: courseProgress,
                              progressPercentage: courseProgress?.progressPercentage,
                              is100Percent: courseProgress?.progressPercentage >= 100
                            });
                            // Log detallado del objeto completo
                            console.log('[DEBUG] Full userProgress object:', JSON.stringify(userProgress, null, 2));
                            console.log('[DEBUG] Progress for contentId:', courseId, '=', userProgress?.[courseId]);
                            if (courseIdFromData) {
                              console.log('[DEBUG] Progress for courseDataId:', courseIdFromData, '=', userProgress?.[courseIdFromData]);
                            }
                          }
                          
                          const CardContent = (
                            <div className={cn(
                              "relative transition-all duration-300 w-full",
                              isLockedForUser ? "cursor-not-allowed" : "cursor-pointer hover:scale-105 hover:z-10 hover:shadow-2xl"
                            )}>
                              {/* Ícono de información para descripción - Versión ultra sutil */}
                              {content.courseData?.description && (
                                <Popover 
                                  open={openPopovers[content.id] || false} 
                                  onOpenChange={(open) => {
                                    setOpenPopovers(prev => ({ ...prev, [content.id]: open }));
                                  }}
                                >
                                  <PopoverTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="absolute top-2 right-2 z-20 w-5 h-5 p-0 bg-transparent hover:bg-black/30 rounded-full opacity-30 hover:opacity-80 transition-all duration-200 border-0"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setOpenPopovers(prev => ({ ...prev, [content.id]: !prev[content.id] }));
                                      }}
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                      }}
                                    >
                                      <Info className="h-2.5 w-2.5 text-white/50 hover:text-white/90" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent 
                                    side="right" 
                                    align="start"
                                    className="w-[500px] max-w-[90vw] bg-black/95 border border-white/20 p-6 rounded-lg shadow-2xl z-[9999]"
                                    onClick={(e) => e.stopPropagation()}
                                    onPointerDownOutside={(e) => {
                                      setOpenPopovers(prev => ({ ...prev, [content.id]: false }));
                                    }}
                                  >
                                    <div className="space-y-3">
                                      <h4 className="text-white font-semibold text-base mb-3">
                                        {content.courseData?.title}
                                      </h4>
                                      <div className="text-sm max-h-[400px] overflow-y-auto pr-3 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                                        {(() => {
                                          const description = content.courseData.description || '';
                                          // Detectar si el contenido tiene HTML
                                          const isHtml = /<[^>]+>/.test(description);
                                          
                                          if (isHtml) {
                                            // Si es HTML, renderizar con dangerouslySetInnerHTML pero con estilos
                                            return (
                                              <div 
                                                className="prose prose-invert prose-sm max-w-none text-white/80 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-2 [&_li]:mb-1.5 [&_p]:mb-3 [&_p]:leading-relaxed [&_strong]:text-white [&_strong]:font-semibold [&_h1]:text-white [&_h1]:text-lg [&_h1]:mb-3 [&_h2]:text-white [&_h2]:text-base [&_h2]:mb-2 [&_h3]:text-white [&_h3]:text-sm [&_h3]:mb-2"
                                                dangerouslySetInnerHTML={{ __html: description }}
                                              />
                                            );
                                          }
                                          
                                          // Si es Markdown o texto plano, usar ReactMarkdown
                                          return (
                                            <div className="markdown-content">
                                              <ReactMarkdown 
                                                remarkPlugins={[remarkGfm]}
                                                rehypePlugins={[rehypeHighlight, rehypeRaw]}
                                                components={{
                                                  p: ({ children }) => <p className="mb-3 text-white/80 leading-relaxed">{children}</p>,
                                                  ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-2 text-white/80 pl-5">{children}</ul>,
                                                  ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-2 text-white/80 pl-5">{children}</ol>,
                                                  li: ({ children }) => <li className="mb-1.5 text-white/80">{children}</li>,
                                                  strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                                                  em: ({ children }) => <em className="italic text-white/90">{children}</em>,
                                                  h1: ({ children }) => <h1 className="text-lg font-bold text-white mb-3 mt-4 first:mt-0">{children}</h1>,
                                                  h2: ({ children }) => <h2 className="text-base font-bold text-white mb-2 mt-3 first:mt-0">{children}</h2>,
                                                  h3: ({ children }) => <h3 className="text-sm font-semibold text-white mb-2 mt-2 first:mt-0">{children}</h3>,
                                                  code: ({ children }) => <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs font-mono text-purple-300">{children}</code>,
                                                  blockquote: ({ children }) => <blockquote className="border-l-2 border-white/30 pl-3 italic my-3 text-white/70">{children}</blockquote>,
                                                }}
                                              >
                                                {description}
                                              </ReactMarkdown>
                                            </div>
                                          );
                                        })()}
                                      </div>
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              )}

                              {/* Poster Image */}
                              <div className={cn(
                                "relative aspect-[2/3] rounded-lg overflow-hidden group-hover:rounded-b-none transition-all duration-300",
                                (isLockedForUser || !isAuthenticated) && "opacity-50"
                              )}>
                                {content.courseData?.coverImageUrl ? (
                                  <img 
                                    src={content.courseData.coverImageUrl} 
                                    alt={content.courseData.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                    {content.contentType === 'workshop' && (
                                      <Video className="h-16 w-16 text-primary/40" />
                                    )}
                                    {content.contentType === 'guide' && (
                                      <BookOpen className="h-16 w-16 text-primary/40" />
                                    )}
                                    {content.contentType === 'course' && (
                                      <Play className="h-16 w-16 text-primary/40" />
                                    )}
                                  </div>
                                )}

                                {/* Lock Overlay - Different behavior for non-authenticated users */}
                                {!isAuthenticated ? (
                                  <>
                                    {/* Lock icon in top right corner with tooltip */}
                                    <div className="absolute top-3 right-3 z-10">
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="w-8 h-8 p-0 hover:bg-muted/50 bg-muted/90 backdrop-blur-sm rounded-lg border border-border"
                                              onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                window.location.href = '/planes';
                                              }}
                                            >
                                              <Lock className="w-4 h-4 text-foreground" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent side="top" align="center" avoidCollisions={false} sideOffset={12} className="z-[9999] bg-card border border-border p-3 rounded-lg shadow-lg max-w-48">
                                            <div className="text-sm font-medium text-foreground mb-2">
                                              Exclusivo solo para miembros suscritos
                                            </div>
                                            <Button 
                                              size="sm" 
                                              className="w-full"
                                              onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                window.location.href = '/planes';
                                              }}
                                            >
                                              Inscribirse
                                            </Button>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    </div>
                                  </>
                                ) : isLockedForUser ? (
                                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                    <Lock className="h-12 w-12 text-white" />
                                  </div>
                                ) : null}
                              </div>

                              {/* Title and Progress - Show on hover */}
                              <div className="max-h-0 group-hover:max-h-96 overflow-hidden transition-all duration-300 bg-black rounded-b-lg w-full">
                                <div className="p-3 space-y-1">
                                  <h4 className="text-white font-semibold text-sm line-clamp-2 leading-tight">
                                    {content.courseData?.title || 'Sin título'}
                                  </h4>
                                  
                                  {/* Progress info - Show on hover if available */}
                                  {courseProgress ? (
                                    <>
                                      {courseProgress.lastLessonTitle && (
                                        <p className="text-white/70 text-xs line-clamp-1 mt-1">
                                          {courseProgress.lastLessonTitle}
                                        </p>
                                      )}
                                      {courseProgress.subscriptionExpiresAt && (
                                        <p className="text-white/60 text-xs flex items-center gap-1 mt-1">
                                          <Clock className="h-3 w-3" />
                                          Acceso hasta {format(new Date(courseProgress.subscriptionExpiresAt), "dd/MM/yy", { locale: es })}
                                        </p>
                                      )}
                                      {/* Progress bar */}
                                      <div className="mt-2 space-y-1">
                                        <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                                          <div 
                                            className={cn(
                                              "h-full transition-all duration-300",
                                              (courseProgress.progressPercentage >= 100) ? "bg-green-500" : "bg-[#faa318]"
                                            )}
                                            style={{ width: `${Math.min(courseProgress.progressPercentage || 0, 100)}%` }}
                                          />
                                        </div>
                                        <p className={cn(
                                          "text-xs text-right",
                                          (courseProgress.progressPercentage >= 100) ? "text-green-500 font-semibold" : "text-white/60"
                                        )}>
                                          {(courseProgress.progressPercentage >= 100) ? "100% Completado" : `${courseProgress.progressPercentage || 0}%`}
                                        </p>
                                      </div>
                                    </>
                                  ) : (
                                    <p className="text-white/60 text-xs mt-1">
                                      0% completado
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );

                          return (
                            <div key={content.id} className="group flex-shrink-0 w-[140px] sm:w-auto flex flex-col">
                              {getHref() !== "#" ? (
                                <Link href={getHref()} className="flex flex-col w-full">
                                  {CardContent}
                                </Link>
                              ) : (
                                <div onClick={(e) => e.preventDefault()} className="flex flex-col w-full">
                                  {CardContent}
                                </div>
                              )}
                            </div>
                          );
                        })}
                        
                        {phase.content.length === 0 && (
                          <div className="col-span-full p-12 text-center text-muted-foreground">
                            <p>No hay contenido disponible en esta fase todavía</p>
                          </div>
                        )}
                        </div>
                        
                        {/* Scroll indicator arrow - Only on mobile */}
                        {phase.content.length > 2 && (
                          <div className="sm:hidden absolute right-2 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
                            <div className="w-8 h-8 rounded-full bg-[#faa318] flex items-center justify-center shadow-lg">
                              <ChevronRight className="h-5 w-5 text-white" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Promo Banners After Phase - Full width del área de contenido (respetando sidebar) */}
                    {bannersAfterPhase.map(banner => {
                      // Identificar banners que deben preservar colores originales
                      // Buscar en título, subtítulo y descripción para detectar banners de Supabase y Cursor
                      const titleLower = banner.title.toLowerCase();
                      const subtitleLower = banner.subtitle?.toLowerCase() || '';
                      const descriptionLower = banner.description?.toLowerCase() || '';
                      const shouldPreserveColors = titleLower.includes('supabase') || 
                                                  subtitleLower.includes('supabase') ||
                                                  descriptionLower.includes('supabase') ||
                                                  titleLower.includes('cursor') ||
                                                  subtitleLower.includes('cursor') ||
                                                  descriptionLower.includes('cursor');
                      
                      return (
                        <div 
                          key={banner.id} 
                          className={cn(
                            "my-8 sm:my-12 -mx-4 w-[calc(100%+2rem)] sm:-mx-6 sm:w-[calc(100%+3rem)]",
                            sidebarOpen
                              ? "lg:relative lg:left-[calc(50%-50vw+125px)] lg:right-[calc(50%-50vw+125px)] lg:w-screen lg:mx-0"
                              : "lg:relative lg:left-1/2 lg:right-1/2 lg:-translate-x-1/2 lg:w-screen lg:mx-0"
                          )}
                        >
                          <PromoBanner
                            title={banner.title}
                            subtitle={banner.subtitle || undefined}
                            description={banner.description || undefined}
                            ctaText={banner.ctaText || undefined}
                            ctaLink={banner.ctaLink || undefined}
                            backgroundImage={banner.backgroundImageUrl || undefined}
                            backgroundColor={banner.backgroundColor}
                            enhancedGlow={shouldEnhanceGlow}
                            preserveOriginalColors={shouldPreserveColors}
                          />
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

        </main>
      </div>
      
      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
}
