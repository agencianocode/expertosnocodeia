import { useEffect, useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import MobileHeader from "@/components/layout/mobile-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, BookOpen, FileText, User, Calendar, Clock, Download, Bookmark, BookmarkCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { useSimpleAuth } from "@/hooks/use-simple-auth";
import { cn } from "@/lib/utils";
import { VideoPlayer } from "@/components/ui/video-player";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';

// Helper function to convert YouTube URLs to embed format
const getYouTubeEmbedUrl = (url: string) => {
  if (!url) return '';
  
  // Handle different YouTube URL formats
  let videoId = '';
  
  if (url.includes('youtube.com/watch?v=')) {
    videoId = url.split('v=')[1]?.split('&')[0];
  } else if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1]?.split('?')[0];
  } else if (url.includes('youtube.com/embed/')) {
    return url; // Already in embed format
  }
  
  return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
};

export default function Guide() {
  const params = useParams();
  const guideId = params?.id;
  const { user, isAuthenticated, isLoading: isAuthLoading } = useSimpleAuth();
  const [, setLocation] = useLocation();
  const [questionOpen, setQuestionOpen] = useState(false);
  const [questionText, setQuestionText] = useState("");
  const [isPostingQuestion, setIsPostingQuestion] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: guide, isLoading: guideLoading, error } = useQuery<any>({
    queryKey: ['/api/courses', guideId],
    enabled: !!guideId,
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<any[]>({
    queryKey: ['/api/categories'],
  });

  // Obtener todas las guías para mostrar relacionadas
  const { data: allGuides = [] } = useQuery<any[]>({
    queryKey: ['/api/guides/all'],
    enabled: !!guideId,
  });

  // Estado para el carrusel de guías relacionadas
  const [relatedGuidesStartIndex, setRelatedGuidesStartIndex] = useState(0);

  const getDifficultyLabel = (difficulty?: string) => {
    if (difficulty === "beginner") return "Principiante";
    if (difficulty === "intermediate") return "Intermedio";
    if (difficulty === "advanced") return "Avanzado";
    return difficulty || "Nivel";
  };

  const getDifficultyColors = (difficulty?: string) => {
    if (difficulty === "beginner") {
      return "bg-green-500/15 text-green-400 border-green-500/30";
    }
    if (difficulty === "intermediate") {
      return "bg-yellow-500/15 text-yellow-400 border-yellow-500/30";
    }
    if (difficulty === "advanced") {
      return "bg-red-500/15 text-red-400 border-red-500/30";
    }
    return "bg-gray-500/15 text-gray-400 border-gray-500/30";
  };

  // Función para obtener información del instructor de una guía
  const getInstructorInfo = (guideItem: any) => {
    const metadata = guideItem?.metadata ? (typeof guideItem.metadata === 'string' ? JSON.parse(guideItem.metadata) : guideItem.metadata) : {};
    const instructor = metadata?.instructor || {};
    const fallbackName = user?.firstName || user?.lastName
      ? `${user?.firstName || ""} ${user?.lastName || ""}`.trim()
      : "";
    const name = instructor?.name || guideItem?.instructorName || fallbackName || "Instructor";
    const avatar = instructor?.avatar || guideItem?.instructorAvatar || 
      `data:image/svg+xml;base64,${btoa(`<svg width="40" height="40" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="20" fill="#6366f1"/><text x="20" y="28" font-size="20" fill="white" text-anchor="middle" font-weight="bold">${name.charAt(0).toUpperCase()}</text></svg>`)}`;
    return { name, avatar };
  };

  const { data: savedCourses } = useQuery({
    queryKey: ['/api/users/saved-courses'],
    enabled: isAuthenticated,
    retry: false,
  });
  const isSaved = Array.isArray(savedCourses) && savedCourses.some(
    (savedCourse: any) => savedCourse.courseId === guideId
  );
  const saveGuideMutation = useMutation({
    mutationFn: async () => {
      const method = isSaved ? 'DELETE' : 'POST';
      const url = isSaved
        ? `/api/users/saved-courses/${guideId}`
        : '/api/users/saved-courses';
      if (method === 'POST') {
        return await apiRequest('POST', url, { 
          courseId: guideId,
          roomSlug: null,
        });
      }
      return await apiRequest('DELETE', url);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['/api/users/saved-courses'] });
      const previous = queryClient.getQueryData(['/api/users/saved-courses']);
      const nextSaved = !isSaved;
      queryClient.setQueryData(['/api/users/saved-courses'], (current: any) => {
        const list = Array.isArray(current) ? current.slice() : [];
        if (isSaved) {
          return list.filter((item: any) => item.courseId !== guideId);
        }
        return [...list, { courseId: guideId }];
      });
      return { previous, nextSaved };
    },
    onSuccess: (_data, _variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/saved-courses'] });
      const nowSaved = context?.nextSaved ?? !isSaved;
      toast({
        title: nowSaved ? "Guía guardada" : "Guía removida",
        description: nowSaved
          ? "La guía fue guardada en tus favoritos"
          : "La guía fue removida de tus favoritos",
      });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/saved-courses'] });
      toast({
        title: "Error",
        description: "No se pudo guardar la guía",
        variant: "destructive",
      });
    },
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
        <Sidebar />
        <div className="flex-1 flex items-center justify-center lg:ml-[250px] lg:mr-[640px]">
          <div className="text-foreground">Cargando...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center lg:ml-[250px] lg:mr-[640px]">
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
        <Sidebar />
        <div className="flex-1 flex items-center justify-center lg:ml-[250px] lg:mr-[640px]">
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
  const fallbackName = user?.firstName || user?.lastName
    ? `${user?.firstName || ""} ${user?.lastName || ""}`.trim()
    : "";
  const instructorName = instructor?.name || (guide as any)?.instructorName || fallbackName || "Instructor";
  const instructorTitle = instructor?.title || (guide as any)?.instructorBio || "Consultor/Educador de IA";
  const instructorAvatar =
    instructor?.avatar ||
    (guide as any)?.instructorAvatar ||
    (user as any)?.profileImageUrl ||
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96'><rect width='96' height='96' fill='%2320132d'/><circle cx='48' cy='36' r='16' fill='%23c0467f'/><rect x='20' y='58' width='56' height='26' rx='13' fill='%23c0467f'/></svg>";
  const guideVideoUrl = typeof metadata?.videoUrl === "string" ? metadata.videoUrl.trim() : "";
  const presentationVideoUrl = metadata?.presentationVideoUrl || "";
  const guideSummary = metadata?.summary || guide?.shortDescription || "";
  const guideTools = metadata?.tools || "No se requiere ninguno";
  const guideUpdatedAt = metadata?.updatedAt || guide?.createdAt;
  const guideFiles = metadata?.files || [];
  
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
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        <div className="flex-1 lg:ml-[250px] bg-[#0f0f19]">
          <div className="max-w-[1200px] mx-auto px-4 lg:px-8 py-6 lg:py-8">
            <div className="lg:hidden mb-4">
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

            <div className="bg-[#0f0f19] rounded-xl p-5 lg:p-8 border border-border mb-6">
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge variant="secondary" className="text-[14px] uppercase">
                  Guía
                </Badge>
                {guide?.difficulty && (
                  <Badge className={`${getDifficultyColors(guide.difficulty)} text-[14px] uppercase`}>
                    {getDifficultyLabel(guide.difficulty)}
                  </Badge>
                )}
              </div>

              <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-2">
                {guide?.title || 'Guía sin título'}
              </h1>

              {guideSummary && (
                <p className="text-muted-foreground">Resumen: {guideSummary}</p>
              )}

              <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
                {guide?.estimatedHours && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {guide.estimatedHours} {guide.estimatedHours === 1 ? 'hora' : 'horas'}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
                <div className="bg-card rounded-xl p-4 border border-border">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                    Herramientas necesarias
                  </div>
                  <div className="text-sm text-foreground font-medium">{guideTools}</div>
                </div>
                <div className="bg-card rounded-xl p-4 border border-border">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                    Actualizado
                  </div>
                  <div className="text-sm text-foreground font-medium">
                    {guideUpdatedAt ? formatDate(guideUpdatedAt) : "Fecha no disponible"}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6 mb-6">
              <div>
                {/* Presentation Video */}
                {presentationVideoUrl && (
                  <div className="relative rounded-lg overflow-hidden mb-6" style={{ paddingBottom: '56.25%' }}>
                    <iframe
                      className="absolute top-0 left-0 w-full h-full"
                      src={getYouTubeEmbedUrl(presentationVideoUrl)}
                      title="Video de presentación de la guía"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )}

                {guideVideoUrl ? (
                  <div className="rounded-xl overflow-hidden bg-muted/30 aspect-video mb-6">
                    <VideoPlayer
                      src={guideVideoUrl}
                      poster={guide?.coverImageUrl || undefined}
                      className="w-full h-full"
                    />
                  </div>
                ) : guide?.coverImageUrl ? (
                  <div className="rounded-xl overflow-hidden bg-muted/30 aspect-video mb-6">
                    <div className="h-full w-full flex items-center justify-center">
                      <img
                        src={guide.coverImageUrl}
                        alt={guide.title || 'Guía'}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl overflow-hidden bg-muted/30 aspect-video mb-6">
                    <div className="h-full w-full flex items-center justify-center">
                      <FileText className="h-12 w-12 text-muted-foreground" />
                    </div>
                  </div>
                )}

                {/* Sección RECURSO - Debajo del video */}
                {guideFiles && guideFiles.length > 0 && (
                  <div className="border border-border rounded-xl p-5 lg:p-6 bg-card mb-6">
                    <h3 className="text-lg font-bold text-foreground mb-2 uppercase">RECURSO</h3>
                    <p className="text-sm text-muted-foreground mb-4">Esta guía tiene recursos.</p>
                    <div className="space-y-3">
                      {guideFiles.map((file: any, index: number) => {
                        // Construir URL de descarga
                        let downloadUrl = file.url;
                        
                        // Si es una ruta relativa del servidor, convertir a URL de API
                        if (file.url && file.url.startsWith('/')) {
                          downloadUrl = `/api/object-proxy/objects${file.url}`;
                        } else if (file.url && file.url.includes('supabase.co/storage')) {
                          // Si es una URL de Supabase, extraer la ruta
                          const urlMatch = file.url.match(/attached-assets\/(.+)$/);
                          if (urlMatch) {
                            downloadUrl = `/api/object-proxy/objects/attached-assets/${urlMatch[1]}`;
                          } else {
                            // Intentar extraer cualquier ruta después del dominio
                            const pathMatch = file.url.match(/supabase\.co\/storage\/v1\/object\/[^\/]+\/([^?]+)/);
                            if (pathMatch) {
                              downloadUrl = `/api/object-proxy/objects/${pathMatch[1]}`;
                            }
                          }
                        } else if (file.url && !file.url.startsWith('http')) {
                          // Si es una ruta sin protocolo, asumir que es relativa
                          downloadUrl = `/api/object-proxy/objects/attached-assets/${file.url}`;
                        }
                        
                        // Determinar tipo de archivo
                        const getFileType = (fileName: string, fileType?: string) => {
                          const ext = fileName.split('.').pop()?.toLowerCase() || fileType?.toLowerCase() || '';
                          if (ext === 'pdf' || fileType === 'pdf') return 'Recurso PDF';
                          if (['doc', 'docx'].includes(ext)) return 'Recurso DOC';
                          if (['xls', 'xlsx'].includes(ext)) return 'Recurso XLS';
                          if (['ppt', 'pptx'].includes(ext)) return 'Recurso PPT';
                          if (ext === 'zip' || ext === 'rar') return 'Recurso ZIP';
                          return `Recurso ${ext.toUpperCase()}`;
                        };
                        
                        const handleDownload = async () => {
                          try {
                            const response = await fetch(downloadUrl, {
                              credentials: 'include',
                              method: 'GET',
                            });
                            
                            if (!response.ok) {
                              throw new Error(`Error al descargar: ${response.status}`);
                            }
                            
                            const blob = await response.blob();
                            const blobUrl = window.URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = blobUrl;
                            link.download = file.name || 'archivo';
                            link.style.display = 'none';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            window.URL.revokeObjectURL(blobUrl);
                            
                            toast({
                              title: "Descarga iniciada",
                              description: `Descargando ${file.name}...`,
                            });
                          } catch (error: any) {
                            console.error('Error descargando archivo:', error);
                            toast({
                              title: "Error",
                              description: `No se pudo descargar ${file.name}`,
                              variant: "destructive",
                            });
                          }
                        };
                        
                        return (
                          <div
                            key={index}
                            className="flex items-center justify-between bg-muted/20 border border-border rounded-lg p-4 hover:bg-muted/40 transition-colors cursor-pointer"
                            onClick={handleDownload}
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="bg-purple-500/20 p-3 rounded-lg flex-shrink-0 border border-purple-500/30">
                                <FileText className="h-6 w-6 text-purple-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate mb-1">
                                  {file.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {getFileType(file.name, file.type)}
                                </p>
                              </div>
                            </div>
                            <Download className="h-5 w-5 text-muted-foreground hover:text-foreground flex-shrink-0 ml-3 transition-colors" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <aside className="h-full flex flex-col gap-4">
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-card border-border text-foreground hover:bg-muted"
                    onClick={() => {
                      if (!isAuthenticated) {
                        toast({
                          title: "Inicia sesión",
                          description: "Debes iniciar sesión para guardar guías",
                          variant: "destructive",
                        });
                        setLocation('/login');
                        return;
                      }
                      saveGuideMutation.mutate();
                    }}
                    disabled={saveGuideMutation.isPending}
                  >
                    {isSaved ? (
                      <BookmarkCheck className="h-4 w-4 mr-2" />
                    ) : (
                      <Bookmark className="h-4 w-4 mr-2" />
                    )}
                    {isSaved ? "Guía guardada" : "Guardar Guía"}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-card border-border text-foreground hover:bg-muted"
                    onClick={() => setQuestionOpen(true)}
                  >
                    <span className="inline-flex items-center justify-center h-4 w-4 mr-2">
                      ?
                    </span>
                    Haz una pregunta
                  </Button>
                </div>

                <div className="bg-card rounded-xl p-4 border border-border space-y-4 flex-1">
                  <div>
                    <h3 className="text-[14px] uppercase tracking-wide text-muted-foreground mb-2">Instructor</h3>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={instructorAvatar} alt={instructorName} />
                        <AvatarFallback>
                          <User className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium">{instructorName}</div>
                        <div className="text-xs text-muted-foreground">{instructorTitle}</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[14px] uppercase tracking-wide text-muted-foreground mb-2 font-semibold">Publicado</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {guide?.createdAt ? formatDate(guide.createdAt) : 'Fecha no disponible'}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[14px] uppercase tracking-wide text-muted-foreground mb-2 font-semibold">Categorías</h3>
                    <div className="grid grid-cols-1 gap-2">
                      {guideCategories.length > 0 ? (
                        guideCategories.map((category) => (
                          <Badge 
                            key={category.id} 
                            className="w-fit inline-flex text-[12px] uppercase bg-[#2d252c] text-[#c0467f] border border-[#2c1d3e]"
                          >
                            {category.name}
                          </Badge>
                        ))
                      ) : (
                        <Badge className="w-fit inline-flex text-[12px] uppercase bg-[#2d252c] text-[#c0467f] border border-[#2c1d3e]">
                          General
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </aside>
            </div>

            <div className="bg-card rounded-xl p-5 lg:p-8 border border-border">
              {!isAuthenticated ? (
                <div className="prose prose-sm lg:prose-base max-w-none">
                  {guide?.description ? (
                    <div className="markdown-content">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeHighlight, rehypeRaw]}
                        components={{
                          img: ({ src, alt }) => {
                            // Si la URL es relativa, convertirla a absoluta
                            let imageUrl = src || '';
                            if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('//') && !imageUrl.startsWith('data:')) {
                              // Si es una URL relativa, intentar construir la URL completa
                              if (imageUrl.startsWith('/')) {
                                imageUrl = `${window.location.origin}${imageUrl}`;
                              } else {
                                // Si no empieza con /, asumir que es relativa a la raíz
                                imageUrl = `${window.location.origin}/${imageUrl}`;
                              }
                            }
                            return (
                              <img 
                                src={imageUrl} 
                                alt={alt || ''} 
                                className="max-w-full h-auto rounded-lg my-4"
                                onError={(e) => {
                                  // Si falla, intentar con la URL original
                                  if (src && src !== imageUrl) {
                                    (e.target as HTMLImageElement).src = src;
                                  }
                                }}
                              />
                            );
                          }
                        }}
                      >
                        {guide.description}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic">Contenido de la guía no disponible.</p>
                  )}
                  
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
                <div className="prose prose-sm lg:prose-base max-w-none">
                  {guide?.description ? (
                    <div className="markdown-content">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeHighlight, rehypeRaw]}
                        components={{
                          img: ({ src, alt }) => {
                            // Si la URL es relativa, convertirla a absoluta
                            let imageUrl = src || '';
                            if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('//') && !imageUrl.startsWith('data:')) {
                              // Si es una URL relativa, intentar construir la URL completa
                              if (imageUrl.startsWith('/')) {
                                imageUrl = `${window.location.origin}${imageUrl}`;
                              } else {
                                // Si no empieza con /, asumir que es relativa a la raíz
                                imageUrl = `${window.location.origin}/${imageUrl}`;
                              }
                            }
                            return (
                              <img 
                                src={imageUrl} 
                                alt={alt || ''} 
                                className="max-w-full h-auto rounded-lg my-4"
                                onError={(e) => {
                                  // Si falla, intentar con la URL original
                                  if (src && src !== imageUrl) {
                                    (e.target as HTMLImageElement).src = src;
                                  }
                                }}
                              />
                            );
                          }
                        }}
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

            {/* Guías Relacionadas */}
            {guide && (() => {
              // Calcular las guías relacionadas filtradas
              const filteredRelatedGuides = allGuides.filter((g: any) => 
                g.id !== guideId && 
                g.type === 'guide' && 
                g.isPublished &&
                (guide.categories?.some((catId: string) => 
                  (Array.isArray(g.categories) ? g.categories : (g.categoryId ? [g.categoryId] : [])).includes(catId)
                ) || guide.categoryId === g.categoryId)
              );
              
              const totalGuides = filteredRelatedGuides.length;
              const guidesToShow = filteredRelatedGuides.slice(relatedGuidesStartIndex, relatedGuidesStartIndex + 3);
              const hasMoreGuides = relatedGuidesStartIndex + 3 < totalGuides;
              const hasPreviousGuides = relatedGuidesStartIndex > 0;
              
              if (totalGuides === 0) return null;
              
              return (
                <div className="mt-12 mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-foreground">Guías relacionadas</h2>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setRelatedGuidesStartIndex(prev => Math.max(0, prev - 1));
                        }}
                        disabled={!hasPreviousGuides}
                        className="h-8 w-8"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setRelatedGuidesStartIndex(prev => prev + 1);
                        }}
                        disabled={!hasMoreGuides}
                        className="h-8 w-8"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {guidesToShow.map((relatedGuide: any) => {
                        const instructor = getInstructorInfo(relatedGuide);
                        const isSaved = Array.isArray(savedCourses) && savedCourses.some(
                          (savedCourse: any) => savedCourse.courseId === relatedGuide.id
                        );

                        return (
                          <div
                            key={relatedGuide.id}
                            className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 cursor-pointer"
                            onClick={() => setLocation(`/guia/${relatedGuide.id}`)}
                          >
                            <div className="relative aspect-[16/10] bg-muted/40 rounded-t-2xl overflow-hidden">
                              {relatedGuide.coverImageUrl ? (
                                <div className="w-full h-full p-4 flex items-center justify-center">
                                  <img
                                    src={relatedGuide.coverImageUrl}
                                    alt={relatedGuide.title}
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
                                {relatedGuide.title}
                              </h3>

                              <div className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide border ${getDifficultyColors(relatedGuide.difficulty)}`}>
                                {getDifficultyLabel(relatedGuide.difficulty)}
                              </div>

                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                  <Avatar className="h-5 w-5">
                                    <AvatarImage src={instructor.avatar} alt={instructor.name} />
                                    <AvatarFallback className="text-[10px]">{instructor.name.charAt(0).toUpperCase()}</AvatarFallback>
                                  </Avatar>
                                  <span className="line-clamp-1 text-sm">Impartido por {instructor.name}</span>
                                </div>

                                {isAuthenticated && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0 hover:bg-muted/50 flex-shrink-0"
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      const method = isSaved ? 'DELETE' : 'POST';
                                      const url = isSaved
                                        ? `/api/users/saved-courses/${relatedGuide.id}`
                                        : '/api/users/saved-courses';
                                      try {
                                        if (method === 'POST') {
                                          await apiRequest('POST', url, { courseId: relatedGuide.id });
                                        } else {
                                          await apiRequest('DELETE', url);
                                        }
                                        queryClient.invalidateQueries({ queryKey: ['/api/users/saved-courses'] });
                                        toast({
                                          title: isSaved ? "Guía removida" : "Guía guardada",
                                          description: isSaved 
                                            ? "La guía fue removida de tus favoritos" 
                                            : "La guía fue guardada en tus favoritos",
                                        });
                                      } catch (error) {
                                        toast({
                                          title: "Error",
                                          description: "No se pudo guardar la guía",
                                          variant: "destructive",
                                        });
                                      }
                                    }}
                                  >
                                    {isSaved ? (
                                      <BookmarkCheck className="h-4 w-4 text-primary" />
                                    ) : (
                                      <Bookmark className="h-4 w-4" />
                                    )}
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <MobileNav />
      <Dialog open={questionOpen} onOpenChange={setQuestionOpen}>
        <DialogContent className="bg-card border-border text-foreground">
          <DialogHeader className="text-left">
            <DialogTitle>Haz una pregunta</DialogTitle>
            <DialogDescription>
              Incluiremos un enlace a: {guide?.title || "esta guía"}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={questionText}
            onChange={(event) => setQuestionText(event.target.value)}
            placeholder="Escribe tu pregunta aquí..."
            className="bg-background border-border text-foreground"
          />
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setQuestionOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                if (!questionText.trim()) return;
                setIsPostingQuestion(true);
                try {
                  const channelsRes = await fetch("/api/community/channels", { credentials: "include" });
                  if (!channelsRes.ok) {
                    throw new Error("No se pudo cargar los canales");
                  }
                  const channels = await channelsRes.json();
                  const targetChannel = channels.find((channel: any) => channel.slug === "haz-tu-pregunta");
                  if (!targetChannel) {
                    throw new Error("No se encontró el canal Haz tu Pregunta");
                  }
                  const guideUrl = guide?.slug ? `/guia/${guide.slug}` : `/guia/${guideId}`;
                  const content = `${questionText.trim()}\n\n${guideUrl}`;
                  const token = localStorage.getItem("simpleAuthToken");
                  const messageRes = await fetch(`/api/community/channels/${targetChannel.id}/posts`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                    credentials: "include",
                    body: JSON.stringify({
                      title: `Pregunta sobre: ${guide?.title || "Guía"}`,
                      content,
                    }),
                  });
                  if (!messageRes.ok) {
                    throw new Error("No se pudo publicar la pregunta");
                  }
                  setQuestionText("");
                  setQuestionOpen(false);
                  toast({ title: "Pregunta publicada", description: "Se envió a Haz tu Pregunta" });
                } catch (error: any) {
                  toast({
                    title: "Error",
                    description: error?.message || "No se pudo publicar la pregunta",
                    variant: "destructive",
                  });
                } finally {
                  setIsPostingQuestion(false);
                }
              }}
              disabled={!questionText.trim() || isPostingQuestion}
            >
              {isPostingQuestion ? "Publicando..." : "Publicar en #haz-una-pregunta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}