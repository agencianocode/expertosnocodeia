import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import CourseSidebar from "@/components/layout/course-sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import MobileHeader from "@/components/layout/mobile-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Clock, User, BookOpen, Calendar, ArrowLeft, FileText, Bookmark, BookmarkCheck } from "lucide-react";
import { useSimpleAuth } from "@/hooks/use-simple-auth";
import { cn } from "@/lib/utils";

interface ContentBlock {
  type: 'heading' | 'subheading' | 'step' | 'paragraph' | 'image';
  content: string;
  key: string;
}

export default function Guide() {
  const params = useParams();
  const guideId = params?.id;
  const { user, isAuthenticated, isLoading: isAuthLoading } = useSimpleAuth();
  const [, setLocation] = useLocation();

  const { data: guide, isLoading: guideLoading, error } = useQuery<any>({
    queryKey: ['/api/courses', guideId],
    enabled: !!guideId,
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<any[]>({
    queryKey: ['/api/categories'],
  });

  useEffect(() => {
    if (guide && guide?.type && guide.type !== 'guide') {
      // Si no es una guía, redirigir a la ruta correcta
      if (guide.type === 'course') {
        setLocation(`/curso/${guideId}`);
      } else if (guide.type === 'workshop') {
        setLocation(`/taller/${guideId}`);
      }
    }
  }, [guide, guideId, setLocation]);

  if (isAuthLoading || guideLoading) {
    return (
      <div className="min-h-screen bg-background flex">
        <CourseSidebar />
        <div className="flex-1 flex items-center justify-center lg:ml-[250px] lg:mr-[560px]">
          <div className="text-foreground">Cargando...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex">
        <CourseSidebar />
        <div className="flex-1 flex items-center justify-center lg:ml-[250px] lg:mr-[560px]">
          <div className="text-foreground">Error cargando la guía</div>
        </div>
      </div>
    );
  }

  if (!guide) {
    return (
      <div className="min-h-screen bg-background flex">
        <CourseSidebar />
        <div className="flex-1 flex items-center justify-center lg:ml-[250px] lg:mr-[560px]">
          <div className="text-foreground">Guía no encontrada</div>
        </div>
      </div>
    );
  }

  // Parsear la metadata para obtener información del instructor
  const metadata = guide?.metadata ? (typeof guide.metadata === 'string' ? JSON.parse(guide.metadata) : guide.metadata) : {};
  const instructor = metadata?.instructor || {};
  
  // Formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Dividir el contenido en párrafos y procesar imágenes
  const processContent = (content: string): ContentBlock[] => {
    if (!content) return [];
    
    // Dividir por párrafos y filtrar vacíos
    const paragraphs = content.split('\n\n').filter(p => p.trim());
    
    return paragraphs.map((paragraph, index) => {
      const trimmed = paragraph.trim();
      
      // Detectar títulos (líneas que terminan con : o son más cortas y en mayúsculas)
      if (trimmed.length < 100 && (trimmed.endsWith(':') || trimmed === trimmed.toUpperCase())) {
        return {
          type: 'heading',
          content: trimmed,
          key: `heading-${index}`
        };
      }
      
      // Detectar imágenes (líneas que contienen .png, .jpg, etc.)
      if (trimmed.includes('.png') || trimmed.includes('.jpg') || trimmed.includes('.jpeg') || trimmed.includes('Captura de pantalla')) {
        return {
          type: 'image',
          content: trimmed,
          key: `image-${index}`
        };
      }
      
      // Detectar pasos numerados (PASO 1:, PASO 2:, etc.)
      if (/^PASO \d+:/i.test(trimmed)) {
        return {
          type: 'step',
          content: trimmed,
          key: `step-${index}`
        };
      }
      
      // Contenido normal
      return {
        type: 'paragraph',
        content: trimmed,
        key: `paragraph-${index}`
      };
    });
  };

  const contentBlocks = processContent(guide?.description || '');

  // Obtener categorías de la guía
  const guideCategoryIds = guide?.categories || [];
  const guideCategories = categories.filter(cat => guideCategoryIds.includes(cat.id));

  return (
    <>
      {/* Mobile Header */}
      <MobileHeader />
      <div className="flex">
        {/* Course Sidebar - Hidden on mobile */}
        <div className="hidden lg:block">
          <CourseSidebar />
        </div>
        
        <div className="flex-1 flex bg-background lg:ml-[250px] lg:mr-[560px] h-screen overflow-y-auto hide-scrollbar">
          {/* Main Content - Center Column - Full width on mobile */}
          <main className="flex-1 lg:w-[920px] bg-background overflow-y-auto hide-scrollbar h-screen">
            {/* Header con navegación móvil */}
            <div className="lg:hidden px-4 py-4 flex items-center justify-between border-b border-border">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/guides')}
                data-testid="button-back-guides"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a Guías
              </Button>
            </div>

            {/* Contenido principal */}
            <div className="px-4 lg:px-6 py-6 lg:py-8">
              {/* Hero Section */}
              <div className="mb-8">
                {/* Imagen de portada si existe */}
                {guide?.coverImageUrl && (
                  <div className="mb-6 rounded-xl overflow-hidden">
                    <img 
                      src={guide.coverImageUrl} 
                      alt={guide.title || 'Guía'}
                      className="w-full h-48 lg:h-64 object-cover"
                    />
                  </div>
                )}

                {/* Título y metadatos */}
                <div className="space-y-4">
                  <div>
                    <Badge variant="secondary" className="mb-3">
                      <FileText className="h-3 w-3 mr-1" />
                      Guía
                    </Badge>
                    <h1 className="text-2xl lg:text-3xl font-bold text-foreground leading-tight">
                      {guide?.title || 'Guía sin título'}
                    </h1>
                  </div>

                  {/* Metadatos del instructor */}
                  {instructor?.name && (
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={instructor.avatar} alt={instructor.name} />
                        <AvatarFallback>
                          <User className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-foreground">{instructor.name}</div>
                        {instructor.title && (
                          <div className="text-sm text-muted-foreground">{instructor.title}</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Metadatos adicionales */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {guide?.createdAt && formatDate(guide.createdAt)}
                    </div>
                    
                    {guide?.estimatedHours && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {guide.estimatedHours} {guide.estimatedHours === 1 ? 'hora' : 'horas'} de lectura
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Contenido del artículo */}
              <Card className="border-0 shadow-none bg-transparent">
                <CardContent className="p-0">
                  <div className="prose prose-lg max-w-none">
                    {contentBlocks.map((block) => {
                      switch (block.type) {
                        case 'heading':
                          return (
                            <h2 key={block.key} className="text-xl lg:text-2xl font-bold text-foreground mt-8 mb-4 first:mt-0">
                              {block.content}
                            </h2>
                          );
                        
                        case 'step':
                          return (
                            <div key={block.key} className="bg-primary/5 border border-primary/20 rounded-lg p-4 lg:p-6 my-6">
                              <h3 className="text-lg font-semibold text-primary mb-3">
                                {block.content.split(':')[0]}:
                              </h3>
                              <p className="text-foreground leading-relaxed">
                                {block.content.split(':').slice(1).join(':').trim()}
                              </p>
                            </div>
                          );
                        
                        case 'image':
                          return (
                            <div key={block.key} className="my-6 text-center">
                              <div className="bg-muted/30 rounded-lg p-6 border-2 border-dashed border-muted-foreground/30">
                                <BookOpen className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground italic">
                                  {block.content}
                                </p>
                              </div>
                            </div>
                          );
                        
                        case 'paragraph':
                        default:
                          return (
                            <p key={block.key} className="text-foreground leading-relaxed mb-4 text-[15px] lg:text-[16px]">
                              {block.content}
                            </p>
                          );
                      }
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Call to Action final */}
              {!isAuthenticated && (
                <Card className="mt-8 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                  <CardContent className="p-6 text-center">
                    <h3 className="text-lg font-semibold text-foreground mb-3">
                      ¿Te gustó esta guía?
                    </h3>
                    <p className="text-muted-foreground mb-4 text-sm">
                      Únete a nuestra plataforma para acceder a más guías y cursos exclusivos
                    </p>
                    <Button 
                      size="sm"
                      onClick={() => setLocation('/login')}
                      data-testid="button-join"
                    >
                      Comenzar Ahora
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </main>
        </div>

        {/* Right Sidebar - Guide Information */}
        <aside className="hidden lg:block w-[560px] bg-background fixed right-0 top-0 h-screen overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
          {/* Header with back button */}
          <div className="pl-6 pr-12 py-4 flex justify-between items-center border-b border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/guides')}
              data-testid="button-back-guides-sidebar"
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Guías
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80"
              data-testid="button-bookmark-guide"
            >
              <Bookmark className="h-4 w-4 mr-1" />
              Guardar guía
            </Button>
          </div>
          
          <div className="pl-6 pr-12 pt-12 space-y-6">
            {/* Guide Information Card */}
            <div className="bg-card rounded-lg p-5">
              <h3 className="font-satoshi font-medium text-foreground mb-4 text-[18px]">Información de la guía</h3>
              
              <div className="space-y-4">
                {/* Categorías */}
                {guideCategories.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Categorías</h4>
                    <div className="flex flex-wrap gap-2">
                      {guideCategories.map((category) => (
                        <Badge key={category.id} variant="secondary" className="text-xs">
                          {category.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dificultad */}
                {guide?.difficulty && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Dificultad</h4>
                    <Badge 
                      variant={guide.difficulty === 'Principiante' ? 'default' : guide.difficulty === 'Intermedio' ? 'secondary' : 'destructive'}
                      className="text-xs"
                    >
                      {guide.difficulty}
                    </Badge>
                  </div>
                )}

                {/* Tiempo estimado */}
                {guide?.estimatedHours && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Tiempo de lectura</h4>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{guide.estimatedHours} {guide.estimatedHours === 1 ? 'hora' : 'horas'}</span>
                    </div>
                  </div>
                )}

                {/* Fecha de publicación */}
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Fecha de publicación</h4>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{guide?.createdAt && formatDate(guide.createdAt)}</span>
                  </div>
                </div>

                {/* Instructor */}
                {instructor?.name && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Autor</h4>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={instructor.avatar} alt={instructor.name} />
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-sm text-foreground">{instructor.name}</div>
                        {instructor.title && (
                          <div className="text-xs text-muted-foreground">{instructor.title}</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Guides relacionadas - placeholder para futuras funcionalidades */}
            <div className="bg-card rounded-lg p-5">
              <h3 className="font-satoshi font-medium text-foreground mb-4 text-[18px]">Guías relacionadas</h3>
              <p className="text-sm text-muted-foreground">
                Próximamente encontrarás aquí más guías relacionadas con este tema.
              </p>
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile Navigation */}
      <MobileNav />
    </>
  );
}