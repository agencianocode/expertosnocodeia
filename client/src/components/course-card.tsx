import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { Award, Bot, Users, GraduationCap, Code, Megaphone, DollarSign, Brain, Settings, BarChart, CheckSquare, Scale, Heart, Building, Bookmark, BookmarkCheck } from "lucide-react";
import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CourseCardProps {
  course: any;
  category?: any;
  progress?: any;
  variant?: "default" | "horizontal";
}

export default function CourseCard({ course, category, progress, variant = "default" }: CourseCardProps) {
  if (!course) return null;
  
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Check if course is saved/bookmarked
  const { data: savedCourses } = useQuery({
    queryKey: ['/api/users/saved-courses'],
    retry: false,
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
        return await apiRequest('POST', url, { courseId: course.id });
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
          const courseUrl = course.type === 'workshop' ? `/taller/${course.id}` : `/curso/${course.id}`;
          setLocation(courseUrl);
        }}
        className="flex items-start space-x-4 p-4 cursor-pointer hover:bg-muted/50 transition-colors w-full"
      >
        {/* Course Image */}
        <div className="w-20 h-14 bg-muted rounded-lg overflow-hidden flex-shrink-0 relative">
          {course.coverImageUrl ? (
            <img 
              src={course.coverImageUrl} 
              alt={course.title}
              className="w-full h-full object-cover"
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
        </div>
      </div>
    );
  }

  return (
    <div 
      className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg hover:shadow-primary/20 hover:scale-105 transition-all duration-300 cursor-pointer group flex flex-col h-full"
      onClick={() => {
        const courseUrl = course.type === 'workshop' ? `/taller/${course.id}` : `/curso/${course.id}`;
        setLocation(courseUrl);
      }}
    >
      {/* Top section - Image or colored background */}
      <div className={cn(
        "relative h-48 flex flex-col justify-between overflow-hidden",
        !course.coverImageUrl && "p-6",
        !course.coverImageUrl && typeColor === 'purple' && "bg-purple-500",
        !course.coverImageUrl && typeColor === 'blue' && "bg-blue-400",
        !course.coverImageUrl && typeColor === 'green' && "bg-green-500",
        !course.coverImageUrl && typeColor === 'orange' && "bg-orange-400",
        !course.coverImageUrl && typeColor === 'pink' && "bg-pink-400"
      )}>
        
        {/* Progress bar - only show if there's progress */}
        {progress && progressPercentage > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
            <div 
              className="h-full bg-destructive transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        )}
        
        {/* Custom course image */}
        {course.coverImageUrl && (
          <div className="absolute inset-0">
            <img 
              src={course.coverImageUrl} 
              alt={course.title}
              className="w-full h-full object-cover"
              style={{ 
                imageRendering: 'crisp-edges',
                objectPosition: '50% 25%'
              } as React.CSSProperties}
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
        
        {/* Gradient overlay for better text visibility on images */}
        {course.coverImageUrl && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/30" />
        )}
        
        {/* Save/Bookmark button - moved to top right with gray background */}
        <div className="absolute top-3 right-3 z-10">
          <div className="bg-muted/90 backdrop-blur-sm rounded-lg border border-border p-1">
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
          </div>
        </div>
        
        {/* Course icon - only show if no custom image */}
        {!course.coverImageUrl && (
          <div className="flex justify-center relative z-10">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <Icon className="text-primary-foreground" size={32} />
            </div>
          </div>
        )}
        

      </div>
      
      {/* Bottom dark section */}
      <div className="p-4 bg-card flex-1 flex flex-col">
        <div className="h-12 mb-2 flex items-start">
          <h3 className="font-semibold text-foreground line-clamp-2 leading-6">
            {course.title}
          </h3>
        </div>
        
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
          
          {/* Show progress percentage if available */}
          {progress && progressPercentage > 0 && (
            <span className="text-xs text-destructive font-medium">
              {progressPercentage}% completado
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
