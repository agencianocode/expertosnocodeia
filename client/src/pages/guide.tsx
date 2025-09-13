import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import CourseSidebar from "@/components/layout/course-sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import MobileHeader from "@/components/layout/mobile-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, BookOpen, FileText, User, Calendar, Clock, Download } from "lucide-react";
import { useSimpleAuth } from "@/hooks/use-simple-auth";
import { cn } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';

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
          <div className="text-foreground text-center">
            <h2 className="text-2xl font-bold mb-4">Error cargando la guía</h2>
            <p className="text-muted-foreground">Hubo un problema al cargar la guía. Intenta de nuevo más tarde.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!guide) {
    return (
      <div className="min-h-screen bg-background flex">
        <CourseSidebar />
        <div className="flex-1 flex items-center justify-center lg:ml-[250px] lg:mr-[560px]">
          <div className="text-foreground text-center">
            <h2 className="text-2xl font-bold mb-4">Guía no encontrada</h2>
            <p className="text-muted-foreground">La guía que buscas no existe o ha sido eliminada.</p>
          </div>
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

            {/* Guide Title */}
            <div className="px-4 lg:px-8 pb-4">
              <h1 className="text-xl lg:text-2xl font-bold text-foreground">{guide?.title || 'Guía sin título'}</h1>
            </div>

            <div className="px-4 lg:px-8 pb-24 lg:pb-8 lg:pl-[45px] lg:pr-[15px]">
            {/* Guide Content */}
            <section>
              {/* Media Area - Image/Video based on guide content - Exact same structure as Course */}
              {guide?.coverImageUrl ? (
                <div className="relative rounded-lg overflow-hidden mb-6 lg:mb-8" style={{ paddingBottom: '56.25%' }}>
                  <img 
                    src={guide.coverImageUrl} 
                    alt={guide.title || 'Guía'}
                    className="absolute top-0 left-0 w-full h-full object-cover"
                  />
                </div>
              ) : (
                // Placeholder media area if no cover image - Same aspect ratio as Course
                <div className="relative rounded-lg overflow-hidden mb-6 lg:mb-8 bg-muted/30" style={{ paddingBottom: '56.25%' }}>
                  <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Guía de texto</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-6 lg:space-y-8">
                <div className="bg-card rounded-xl p-4 lg:p-8 font-satoshi font-normal text-[14px] lg:text-[16px] leading-[22px] lg:leading-[26px] text-card-foreground">
                  {/* Guide Title inside content card - Exact same structure as Course */}
                  <div className="mb-4 lg:mb-6">
                    <h2 className="text-lg lg:text-xl font-bold text-foreground mb-3 flex items-center font-satoshi" style={{fontSize: '24px'}}>
                      <div className="w-8 h-8 rounded-lg mr-3 flex items-center justify-center flex-shrink-0" style={{backgroundColor: '#363636'}}>
                        <FileText className="h-4 w-4 text-foreground" />
                      </div>
                      {guide?.title || 'Guía sin título'}
                    </h2>
                    {guide?.shortDescription && (
                      <p className="text-muted-foreground text-sm lg:text-base">
                        {guide.shortDescription}
                      </p>
                    )}
                  </div>
                  
                  {!isAuthenticated ? (
                    // Blocked content for non-authenticated users
                    <div className="prose prose-sm lg:prose-base max-w-none">
                      {guide?.description ? (
                        <div className="markdown-content">
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeHighlight, rehypeRaw]}
                          >
                            {guide.description}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-muted-foreground italic">Contenido de la guía no disponible.</p>
                      )}
                      
                      {/* Call to Action dentro del card */}
                      <div className="mt-8 p-6 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg">
                        <div className="text-center">
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
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Normal content for authenticated users  
                    <div className="prose prose-sm lg:prose-base max-w-none">
                      {guide?.description ? (
                        <div className="markdown-content">
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeHighlight, rehypeRaw]}
                          >
                            {guide.description}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-muted-foreground italic">Contenido de la guía no disponible.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </section>
            </div>
          </main>
        </div>

        {/* Right Sidebar - Guide Information */}
        <aside className="hidden lg:block w-[560px] bg-background fixed right-0 top-0 h-screen overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
          {/* Header with back and save buttons */}
          <div className="pl-6 pr-12 py-4 flex justify-between items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/guides')}
              data-testid="button-back-guides-sidebar"
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a las guías
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground hover:text-foreground text-[16px] bg-muted hover:bg-muted/80 mt-[6px] mb-[6px]"
              data-testid="button-bookmark-guide"
            >
              <BookOpen className="h-4 w-4 mr-1" />
              Guía de guardado
            </Button>
          </div>
          
          <div className="pl-6 pr-12 pt-12 space-y-6">
            {/* Instructor Information Card */}
            {instructor?.name && (
              <div className="bg-card rounded-lg p-5">
                <h3 className="font-satoshi font-medium text-foreground mb-4 text-[20px]">Instructores</h3>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={instructor.avatar} alt={instructor.name} />
                    <AvatarFallback>
                      <User className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-satoshi font-medium text-foreground text-[15px]">{instructor.name}</div>
                    {instructor.title && (
                      <div className="text-muted-foreground text-[13px]">{instructor.title}</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Publication Date Card */}
            <div className="bg-card rounded-lg p-5">
              <h3 className="font-satoshi font-medium text-foreground mb-4 text-[20px]">Publicado</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{guide?.createdAt ? formatDate(guide.createdAt) : 'Fecha no disponible'}</span>
              </div>
              {guide?.estimatedHours && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                  <Clock className="h-4 w-4" />
                  <span>{guide.estimatedHours} {guide.estimatedHours === 1 ? 'hora' : 'horas'} de lectura</span>
                </div>
              )}
            </div>

            {/* Resources Card - Placeholder for future functionality */}
            <div className="bg-card rounded-lg p-5">
              <h3 className="font-satoshi font-medium text-foreground mb-4 text-[20px]">Recursos</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium text-foreground text-[14px]">
                        {guide?.title ? `${guide.title.substring(0, 40)}...` : 'Guía'} para una mejor retención
                      </div>
                      <div className="text-xs text-muted-foreground">PDF - 1.2 MB</div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="p-2">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Categories Card */}
            {guideCategories.length > 0 && (
              <div className="bg-card rounded-lg p-5">
                <h3 className="font-satoshi font-medium text-foreground mb-4 text-[20px]">Categorías</h3>
                <div className="space-y-2">
                  {guideCategories.map((category) => (
                    <Badge 
                      key={category.id} 
                      variant="secondary" 
                      className="mr-2 mb-2 text-xs font-satoshi"
                    >
                      {category.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Mobile Navigation */}
      <MobileNav />
    </>
  );
}