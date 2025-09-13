import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Clock, User, BookOpen, Calendar, ArrowLeft } from "lucide-react";
import { useSimpleAuth } from "@/hooks/use-simple-auth";
import { useLocation } from "wouter";

export default function Guide() {
  const params = useParams();
  const guideId = params?.id;
  const { user, isAuthenticated, isLoading: isAuthLoading } = useSimpleAuth();
  const [, setLocation] = useLocation();

  const { data: guide, isLoading: guideLoading, error } = useQuery<any>({
    queryKey: ['/api/courses', guideId],
    enabled: !!guideId,
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Cargando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Error cargando la guía</div>
      </div>
    );
  }

  if (!guide) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Guía no encontrada</div>
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
  const processContent = (content: string) => {
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header con botón de volver */}
      <div className="border-b border-border/40 bg-background/95 backdrop-blur sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/guides')}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Guías
          </Button>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="mb-12">
          {/* Imagen de portada si existe */}
          {guide?.coverImageUrl && (
            <div className="mb-8 rounded-xl overflow-hidden">
              <img 
                src={guide.coverImageUrl} 
                alt={guide.title || 'Guía'}
                className="w-full h-64 object-cover"
              />
            </div>
          )}

          {/* Título y metadatos */}
          <div className="space-y-6">
            <div>
              <Badge variant="secondary" className="mb-4">
                <BookOpen className="h-3 w-3 mr-1" />
                Guía
              </Badge>
              <h1 className="text-4xl font-bold text-foreground leading-tight">
                {guide?.title || 'Guía sin título'}
              </h1>
            </div>

            {/* Metadatos */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {instructor?.name && (
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={instructor.avatar} alt={instructor.name} />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-foreground">{instructor.name}</div>
                    {instructor.title && (
                      <div className="text-xs">{instructor.title}</div>
                    )}
                  </div>
                </div>
              )}
              
              <Separator orientation="vertical" className="h-6" />
              
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {guide?.createdAt && formatDate(guide.createdAt)}
              </div>
              
              {guide?.estimatedHours && (
                <>
                  <Separator orientation="vertical" className="h-6" />
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {guide.estimatedHours} {guide.estimatedHours === 1 ? 'hora' : 'horas'} de lectura
                  </div>
                </>
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
                      <h2 key={block.key} className="text-2xl font-bold text-foreground mt-12 mb-6 first:mt-0">
                        {block.content}
                      </h2>
                    );
                  
                  case 'step':
                    return (
                      <div key={block.key} className="bg-primary/5 border border-primary/20 rounded-lg p-6 my-8">
                        <h3 className="text-xl font-semibold text-primary mb-4">
                          {block.content.split(':')[0]}:
                        </h3>
                        <p className="text-foreground leading-relaxed">
                          {block.content.split(':').slice(1).join(':').trim()}
                        </p>
                      </div>
                    );
                  
                  case 'image':
                    return (
                      <div key={block.key} className="my-8 text-center">
                        <div className="bg-muted/30 rounded-lg p-8 border-2 border-dashed border-muted-foreground/30">
                          <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground italic">
                            {block.content}
                          </p>
                        </div>
                      </div>
                    );
                  
                  case 'paragraph':
                  default:
                    return (
                      <p key={block.key} className="text-foreground leading-relaxed mb-6 text-[16px]">
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
          <Card className="mt-12 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
            <CardContent className="p-8 text-center">
              <h3 className="text-xl font-semibold text-foreground mb-4">
                ¿Te gustó esta guía?
              </h3>
              <p className="text-muted-foreground mb-6">
                Únete a nuestra plataforma para acceder a más guías y cursos exclusivos
              </p>
              <Button 
                size="lg"
                onClick={() => setLocation('/login')}
                data-testid="button-join"
              >
                Comenzar Ahora
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}