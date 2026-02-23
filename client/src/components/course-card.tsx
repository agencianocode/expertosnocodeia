import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { Award, Bot, Users, GraduationCap, Code, Megaphone, DollarSign, Brain, Settings, BarChart, CheckSquare, Scale, Heart, Building, Bookmark, BookmarkCheck, Lock } from "lucide-react";
import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Avatar del instructor en la home (Cursos, Talleres, Programas, Guías). Intenta .webp y, si falla, .png
const INSTRUCTOR_AVATAR_PATHS = ["/instructor-avatar.webp", "/instructor-avatar.png"] as const;
function InstructorAvatarImage({ src, alt, fallbackChar, className }: { src: string; alt: string; fallbackChar: string; className?: string }) {
  const isInstructorAvatarPath = INSTRUCTOR_AVATAR_PATHS.includes(src as any);
  const [currentSrc, setCurrentSrc] = useState(src);
  const [tryNext, setTryNext] = useState(0);
  const fallbackPath = src === "/instructor-avatar.webp" ? "/instructor-avatar.png" : "/instructor-avatar.webp";
  const onError = () => {
    if (isInstructorAvatarPath && tryNext === 0) {
      setCurrentSrc(fallbackPath);
      setTryNext(1);
    }
  };
  return (
    <>
      <AvatarImage src={currentSrc} alt={alt} onError={onError} />
      <AvatarFallback delayMs={0} className={className}>{fallbackChar}</AvatarFallback>
    </>
  );
}

interface CourseCardProps {
  course: any;
  category?: any;
  progress?: any;
  variant?: "default" | "horizontal" | "guideGrid";
  lastLessonId?: string; // For "Continue where you left off" navigation
  showContinueText?: boolean; // Show "Continuar" text instead of normal navigation
  isAuthenticated?: boolean; // Whether user is authenticated - shows padlock if false
  roomSlug?: string | null; // Optional room context for navigation
  imageFit?: "cover" | "contain"; // Image fit for cover artwork
  compact?: boolean; // 380x380 card layout (dashboard carousels)
  instructorLabel?: string; // Override "Impartido por X" with this text (e.g. "Expertos NoCode IA")
  showBrandLogo?: boolean; // Show sidebar logo "Universidad Expertos NoCode IA" (gradient + text) instead of instructor
}

export default function CourseCard({ course, category, progress, variant = "default", lastLessonId, showContinueText = false, isAuthenticated = true, roomSlug, imageFit = "cover", compact = false, instructorLabel, showBrandLogo }: CourseCardProps) {
  if (!course) return null;
  
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Check if course is saved/bookmarked (only when authenticated)
  const { data: savedCourses } = useQuery({
    queryKey: ['/api/users/saved-courses'],
    retry: false,
    enabled: isAuthenticated,
  });
  
  const isSaved = Array.isArray(savedCourses) && savedCourses.some((savedCourse: any) => savedCourse.courseId === course.id);
  
  // Save/unsave course mutation
  const saveCourseMutation = useMutation({
    mutationFn: async () => {
      const method = isSaved ? 'DELETE' : 'POST';
      const url = isSaved 
        ? `/api/users/saved-courses/${course.id}`
        : '/api/users/saved-courses';
      
      if (method === 'POST') {
        return await apiRequest('POST', url, { 
          courseId: course.id,
          roomSlug: roomSlug || null, // Include room context if available
        });
      } else {
        return await apiRequest('DELETE', url);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/saved-courses'] });
      toast({
        title: isSaved ? "Curso removido" : "Curso guardado",
        description: isSaved 
          ? "El curso fue removido de tus favoritos" 
          : "El curso fue guardado en tus favoritos",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo guardar el curso",
        variant: "destructive",
      });
    },
  });

  const getTypeColor = (course: any) => {
    // Based on course title/category to match the image colors
    const title = course.title?.toLowerCase() || '';
    if (title.includes('consultoría')) return 'purple';
    if (title.includes('inicio') || title.includes('kit')) return 'blue';
    if (title.includes('codificación')) return 'green';
    if (title.includes('marketing')) return 'orange';
    if (title.includes('contenido') || title.includes('diseño')) return 'pink';
    if (title.includes('educación') || title.includes('aprendizaje')) return 'green';
    if (title.includes('operaciones')) return 'purple';
    if (title.includes('finanzas')) return 'blue';
    if (title.includes('atención') || title.includes('médica')) return 'pink';
    if (title.includes('gobierno')) return 'green';
    if (title.includes('proyectos')) return 'pink';
    if (title.includes('legal')) return 'blue';
    if (title.includes('recursos')) return 'purple';
    if (title.includes('ventas')) return 'blue';
    if (title.includes('datos')) return 'orange';
    return 'purple';
  };

  const getProgressColor = (color: string) => {
    return `progress-${color}`;
  };

  const getCertificateBadgeColor = (color: string) => {
    return color === 'purple' ? 'certificate-badge' : `certificate-badge-${color}`;
  };

  const getDifficultyLabel = (difficulty?: string) => {
    if (difficulty === "beginner") return "Principiante";
    if (difficulty === "intermediate") return "Intermedio";
    if (difficulty === "advanced") return "Avanzado";
    return difficulty || "Nivel";
  };

  const getDifficultyColors = (difficulty?: string) => {
    if (difficulty === "beginner") return "bg-green-500/15 text-green-400 border-green-500/30";
    if (difficulty === "intermediate") return "bg-yellow-500/15 text-yellow-400 border-yellow-500/30";
    if (difficulty === "advanced") return "bg-red-500/15 text-red-400 border-red-500/30";
    return "bg-muted text-muted-foreground border-border";
  };

  // Instructor por defecto: mismo nombre que la landing; avatar intenta foto del fundador (como en guías) y luego SVG con inicial
  const DEFAULT_INSTRUCTOR_NAME = "Fabián Segura";
  const DEFAULT_AVATAR_PATH = "/instructor-avatar.webp"; // Home: Cursos, Talleres, Programas, Guías (no confundir con fundador.webp = preview-marketing)

  const getInstructorInfo = (courseItem: any) => {
    const raw = courseItem?.metadata;
    const metadata = raw === undefined || raw === null
      ? {}
      : typeof raw === "string"
        ? (() => { try { return JSON.parse(raw); } catch { return {}; } })()
        : raw;
    const instructor = metadata?.instructor || metadata?.Instructor || {};
    const name = instructor?.name ?? instructor?.nombre ?? courseItem?.instructorName ?? courseItem?.instructor_name ?? DEFAULT_INSTRUCTOR_NAME;
    const initial = (name || "I").charAt(0).toUpperCase();
    const avatarUrl = instructor?.avatar ?? instructor?.avatarUrl ?? instructor?.image ?? courseItem?.instructorAvatar ?? courseItem?.instructor_avatar ?? DEFAULT_AVATAR_PATH;
    const hasValidUrl = typeof avatarUrl === "string" && avatarUrl.trim().length > 0 && (avatarUrl.startsWith("http") || avatarUrl.startsWith("data:") || avatarUrl.startsWith("/"));
    // Si no hay URL válida, mismo fallback que guide.tsx: SVG con inicial para que siempre cargue
    const defaultAvatarSvg = `data:image/svg+xml;base64,${btoa(`<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="32" fill="#6366f1"/><text x="32" y="42" font-size="28" fill="white" text-anchor="middle" font-weight="bold" font-family="system-ui">${initial}</text></svg>`)}`;
    const avatar = hasValidUrl ? avatarUrl : defaultAvatarSvg;
    return { name, avatar };
  };

  const getIcon = (course: any) => {
    const title = course.title?.toLowerCase() || '';
    if (title.includes('consultoría')) return Users;
    if (title.includes('inicio') || title.includes('kit')) return Bot;
    if (title.includes('codificación')) return Code;
    if (title.includes('marketing')) return Megaphone;
    if (title.includes('contenido')) return Bot;
    if (title.includes('diseño')) return Bot;
    if (title.includes('educación') || title.includes('aprendizaje')) return GraduationCap;
    if (title.includes('operaciones')) return Settings;
    if (title.includes('finanzas')) return DollarSign;
    if (title.includes('atención') || title.includes('médica')) return Heart;
    if (title.includes('gobierno')) return Building;
    if (title.includes('proyectos')) return CheckSquare;
    if (title.includes('legal')) return Scale;
    if (title.includes('recursos')) return Users;
    if (title.includes('ventas')) return BarChart;
    if (title.includes('datos')) return BarChart;
    return Brain;
  };

  const progressPercentage = progress?.completedLessons && progress?.totalLessons 
    ? Math.round((progress.completedLessons / progress.totalLessons) * 100) 
    : 0;

  const typeColor = getTypeColor(course);
  const progressColor = getProgressColor(typeColor);
  const badgeColor = getCertificateBadgeColor(typeColor);
  const Icon = getIcon(course);

  if (variant === "horizontal") {
    return (
      <div 
        onClick={() => {
          // Allow navigation for both authenticated and non-authenticated users
          // Non-authenticated users will see blocked content in the course page
          let courseUrl;
          
          if (course.type === 'workshop') {
            courseUrl = roomSlug ? `/sala/${roomSlug}/taller/${course.id}` : `/taller/${course.id}`;
          } else if (course.type === 'guide') {
            courseUrl = roomSlug ? `/sala/${roomSlug}/guia/${course.id}` : `/guia/${course.id}`;
          } else {
            // Navigate to course - useLessonPosition will restore last viewed lesson
            courseUrl = roomSlug ? `/sala/${roomSlug}/curso/${course.id}` : `/curso/${course.id}`;
          }
          setLocation(courseUrl);
        }}
        className={cn(
          "flex items-start space-x-4 p-4 cursor-pointer transition-colors w-full relative",
          isAuthenticated ? "hover:bg-muted/50" : "hover:bg-muted/30"
        )}
      >
        {/* Course Image */}
        <div className="w-20 h-14 bg-muted/60 rounded-lg overflow-hidden flex-shrink-0 relative">
          {course.coverImageUrl ? (
            <img 
              src={course.coverImageUrl} 
              alt={course.title}
              className={cn(
                "w-full h-full",
                imageFit === "contain" ? "object-contain" : "object-cover"
              )}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className={cn(
              "w-full h-full flex items-center justify-center",
              typeColor === 'purple' && "bg-purple-500",
              typeColor === 'blue' && "bg-blue-400", 
              typeColor === 'green' && "bg-green-500",
              typeColor === 'orange' && "bg-orange-400",
              typeColor === 'pink' && "bg-pink-400"
            )}>
              <Icon className="text-primary-foreground opacity-80" size={16} />
            </div>
          )}
        </div>

        {/* Course Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground mb-1 line-clamp-2 text-sm">
            {course.title}
          </h3>
          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
            {course.description || `Aprende ${course.title?.toLowerCase()} con este curso completo`}
          </p>
          <div className="flex items-center space-x-3 text-xs text-muted-foreground">
            <span className="flex items-center">
              <Award className="w-3 h-3 mr-1" />
              {category?.name || "General"}
            </span>
            <span>{course.duration || "2h"}</span>
            <span>📜 Certificado</span>
          </div>
        </div>

        {/* Right side info */}
        <div className="flex flex-col items-end space-y-2">
          <div className="text-xs text-muted-foreground">
            {course.difficulty === 'beginner' && '🟢'}
            {course.difficulty === 'intermediate' && '🟡'} 
            {course.difficulty === 'advanced' && '🔴'}
          </div>
          {isAuthenticated ? (
            <Button
              size="sm"
              variant="ghost"
              className="w-8 h-8 p-0 hover:bg-muted/50"
              onClick={(e) => {
                e.stopPropagation();
                saveCourseMutation.mutate();
              }}
              disabled={saveCourseMutation.isPending}
            >
              {isSaved ? (
                <BookmarkCheck className="w-4 h-4 text-foreground" />
              ) : (
                <Bookmark className="w-4 h-4 text-foreground" />
              )}
            </Button>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-8 h-8 p-0 hover:bg-muted/50"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLocation('/planes');
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
                      e.stopPropagation();
                      setLocation('/planes');
                    }}
                  >
                    Inscribirse
                  </Button>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
    );
  }

  // Same layout as /guides grid card (aspect 16/10, same typography and spacing)
  if (variant === "guideGrid") {
    const courseUrl =
      course.type === "workshop"
        ? roomSlug ? `/sala/${roomSlug}/taller/${course.id}` : `/taller/${course.id}`
        : course.type === "guide"
          ? roomSlug ? `/sala/${roomSlug}/guia/${course.id}` : `/guia/${course.id}`
          : roomSlug ? `/sala/${roomSlug}/curso/${(course as any).slug || course.id}` : `/curso/${(course as any).slug || course.id}`;
    const instructor = getInstructorInfo(course);
    return (
      <div className="w-full bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg hover:shadow-primary/10 transition-all duration-300">
        <button
          type="button"
          onClick={() => setLocation(courseUrl)}
          className="w-full text-left"
        >
          <div className="relative aspect-[16/10] bg-muted/40 rounded-t-2xl overflow-hidden">
            {course.coverImageUrl ? (
              <div className="w-full h-full p-4 flex items-center justify-center">
                <img
                  src={course.coverImageUrl}
                  alt={course.title}
                  className="w-full h-full object-contain rounded-xl"
                />
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                Sin imagen
              </div>
            )}
          </div>
          <div className="p-3 space-y-2">
            <h3 className="text-[18px] font-bold text-foreground line-clamp-2 leading-tight">
              {course.title}
            </h3>
            {course.type === "guide" && course.difficulty && (
              <div className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide border ${getDifficultyColors(course.difficulty)}`}>
                {getDifficultyLabel(course.difficulty)}
              </div>
            )}
            {course.type !== "guide" && (
              <div className="text-xs text-muted-foreground">
                {category?.name || "General"}
              </div>
            )}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-muted-foreground min-w-0">
                {showBrandLogo ? (
                  <span className="font-satoshi font-bold text-xs whitespace-nowrap">
                    <span className="bg-gradient-to-r from-purple-accent to-blue-accent bg-clip-text text-transparent">Universidad</span>
                    <span className="text-foreground"> Expertos NoCode IA</span>
                  </span>
                ) : instructorLabel ? (
                  <span className="line-clamp-1 text-sm">{instructorLabel}</span>
                ) : (
                  <>
                    <Avatar className="h-5 w-5 flex-shrink-0">
                      {(instructor.avatar === "/instructor-avatar.webp" || instructor.avatar === "/instructor-avatar.png") ? (
                        <InstructorAvatarImage src={instructor.avatar} alt={instructor.name} fallbackChar={instructor.name.charAt(0).toUpperCase()} className="text-[10px]" />
                      ) : (
                        <>
                          <AvatarImage src={instructor.avatar} alt={instructor.name} />
                          <AvatarFallback className="text-[10px]">{instructor.name.charAt(0).toUpperCase()}</AvatarFallback>
                        </>
                      )}
                    </Avatar>
                    <span className="line-clamp-1 text-sm">Impartido por {instructor.name}</span>
                  </>
                )}
              </div>
              {isAuthenticated ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-8 h-8 p-0 flex-shrink-0 hover:bg-muted/50"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    saveCourseMutation.mutate();
                  }}
                  disabled={saveCourseMutation.isPending}
                >
                  {isSaved ? (
                    <BookmarkCheck className="w-4 h-4 text-foreground" />
                  ) : (
                    <Bookmark className="w-4 h-4 text-foreground" />
                  )}
                </Button>
              ) : (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-8 h-8 p-0 flex-shrink-0 hover:bg-muted/50"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setLocation('/planes');
                        }}
                      >
                        <Lock className="w-4 h-4 text-foreground" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="z-[9999]">
                      Inicia sesión para guardar
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "bg-card border border-border rounded-xl transition-all duration-300 cursor-pointer group flex flex-col h-full relative",
        isAuthenticated ? "hover:shadow-lg hover:shadow-primary/20 hover:scale-105" : "hover:shadow-md opacity-90"
      )}
      onClick={() => {
        // Allow navigation for both authenticated and non-authenticated users
        // Non-authenticated users will see blocked content in the course page
        let courseUrl;
        
        // Use slug if available, fallback to ID for backwards compatibility
        const courseIdentifier = (course as any).slug || course.id;
        
        if (course.type === 'workshop') {
          courseUrl = roomSlug ? `/sala/${roomSlug}/taller/${course.id}` : `/taller/${course.id}`;
        } else if (course.type === 'guide') {
          courseUrl = roomSlug ? `/sala/${roomSlug}/guia/${course.id}` : `/guia/${course.id}`;
        } else {
          // Navigate to course - useLessonPosition will restore last viewed lesson
          courseUrl = roomSlug ? `/sala/${roomSlug}/curso/${courseIdentifier}` : `/curso/${courseIdentifier}`;
        }
        setLocation(courseUrl);
      }}
    >
      {/* Top section - Image or colored background */}
      <div className={cn(
        "relative flex flex-col justify-between overflow-hidden flex-shrink-0",
        compact ? "h-[240px]" : "h-40",
        course.coverImageUrl && "p-2.5",
        !course.coverImageUrl && "p-6",
        !course.coverImageUrl && typeColor === 'purple' && "bg-purple-500",
        !course.coverImageUrl && typeColor === 'blue' && "bg-blue-400",
        !course.coverImageUrl && typeColor === 'green' && "bg-green-500",
        !course.coverImageUrl && typeColor === 'orange' && "bg-orange-400",
        !course.coverImageUrl && typeColor === 'pink' && "bg-pink-400"
      )}>
        
        {/* Progress bar - only show if there's progress */}
        {progress && progressPercentage > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted z-[1]">
            <div 
              className="h-full bg-destructive transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        )}
        
        {/* Custom course image - inside inner border frame */}
        {course.coverImageUrl && (
          <div className="absolute inset-2.5 rounded-xl border-2 border-white/20 overflow-hidden bg-black/10 shadow-inner">
            <img 
              src={course.coverImageUrl} 
              alt={course.title}
              className={cn(
                "w-full h-full",
                imageFit === "contain" ? "object-contain" : "object-cover"
              )}
              onError={(e) => {
                console.error('Image load error - URL:', course.coverImageUrl);
                console.error('Image load error - Element:', e.currentTarget);
                e.currentTarget.style.display = 'none';
              }}
              onLoad={() => {
                console.log('Image loaded successfully:', course.coverImageUrl);
              }}
            />
          </div>
        )}
        
        {/* Gradient overlay for better text visibility on images - reduced opacity for brighter images */}
        {course.coverImageUrl && (
          <div className="absolute inset-2.5 rounded-xl pointer-events-none bg-gradient-to-t from-black/30 via-black/10 to-black/15" />
        )}

        {/* NUEVO badge for guides (when course.isNew is set) */}
        {course.type === "guide" && course.isNew && (
          <div className="absolute top-3 left-3 z-10">
            <span className="inline-flex items-center rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
              Nuevo
            </span>
          </div>
        )}
        
        {/* Course icon - only show if no custom image */}
        {!course.coverImageUrl && (
          <div className="flex justify-center relative z-10">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <Icon className="text-primary-foreground" size={32} />
            </div>
          </div>
        )}
        

      </div>
      
      {/* Bottom section: for guides show name + level + instructor; for courses show existing layout */}
      <div className={cn(
        "bg-card flex-1 flex flex-col min-h-0 overflow-hidden",
        compact ? "p-3" : "p-4"
      )}>
        <div className={compact ? "mb-1 flex items-start" : "mb-2 flex items-start"}>
          <h3 className={cn(
            "font-semibold text-foreground line-clamp-2",
            compact ? "text-sm leading-5" : "leading-6"
          )}>
            {course.title}
          </h3>
        </div>

        {course.type === "guide" ? (
          <>
            {course.difficulty && (
              <div className="mb-2">
                <span className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border",
                  getDifficultyColors(course.difficulty)
                )}>
                  {getDifficultyLabel(course.difficulty)}
                </span>
              </div>
            )}
            {(() => {
              const instructor = getInstructorInfo(course);
              return (
                <div className="flex items-center justify-between gap-2 mt-auto">
                  <div className="flex items-center gap-2 min-w-0">
                    {showBrandLogo ? (
                      <span className="font-satoshi font-bold text-xs whitespace-nowrap">
                        <span className="bg-gradient-to-r from-purple-accent to-blue-accent bg-clip-text text-transparent">Universidad</span>
                        <span className="text-foreground"> Expertos NoCode IA</span>
                      </span>
                    ) : instructorLabel ? (
                      <span className="text-xs text-muted-foreground truncate">{instructorLabel}</span>
                    ) : (
                      <>
                        <Avatar className="h-6 w-6 flex-shrink-0">
                          {(instructor.avatar === "/instructor-avatar.webp" || instructor.avatar === "/instructor-avatar.png") ? (
                            <InstructorAvatarImage src={instructor.avatar} alt={instructor.name} fallbackChar={instructor.name.charAt(0).toUpperCase()} className="text-xs bg-muted text-muted-foreground" />
                          ) : (
                            <>
                              <AvatarImage src={instructor.avatar} alt={instructor.name} />
                              <AvatarFallback delayMs={0} className="text-xs bg-muted text-muted-foreground">
                                {instructor.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </>
                          )}
                        </Avatar>
                        <span className="text-xs text-muted-foreground truncate">
                          Impartido por {instructor.name}
                        </span>
                      </>
                    )}
                  </div>
                  {isAuthenticated ? (
                    <Button size="sm" variant="ghost" className="w-8 h-8 p-0 flex-shrink-0" onClick={(e) => { e.stopPropagation(); saveCourseMutation.mutate(); }} disabled={saveCourseMutation.isPending}>
                      {isSaved ? <BookmarkCheck className="w-4 h-4 text-foreground" /> : <Bookmark className="w-4 h-4 text-foreground" />}
                    </Button>
                  ) : (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="sm" variant="ghost" className="w-8 h-8 p-0 flex-shrink-0" onClick={(e) => { e.stopPropagation(); setLocation('/planes'); }}>
                            <Lock className="w-4 h-4 text-foreground" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="z-[9999]">Inicia sesión para guardar</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              );
            })()}
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-2">
              <div className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded-md">
                <Award className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Certificado</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {category?.name || "General"}
              </p>
              <div className="flex items-center gap-1">
                {progress && progressPercentage > 0 && (
                  <span className="text-xs text-destructive font-medium">
                    {progressPercentage}% completado
                  </span>
                )}
                {isAuthenticated ? (
                  <Button size="sm" variant="ghost" className="w-8 h-8 p-0" onClick={(e) => { e.stopPropagation(); saveCourseMutation.mutate(); }} disabled={saveCourseMutation.isPending}>
                    {isSaved ? <BookmarkCheck className="w-4 h-4 text-foreground" /> : <Bookmark className="w-4 h-4 text-foreground" />}
                  </Button>
                ) : (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="sm" variant="ghost" className="w-8 h-8 p-0" onClick={(e) => { e.stopPropagation(); setLocation('/planes'); }}>
                          <Lock className="w-4 h-4 text-foreground" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="z-[9999]">Inicia sesión para guardar</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
