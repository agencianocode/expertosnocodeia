import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import MobileHeader from "@/components/layout/mobile-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, BookOpen, FileText, User, Calendar, Clock, Download, Bookmark, BookmarkCheck } from "lucide-react";
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
  const guideSummary = metadata?.summary || guide?.shortDescription || "";
  const guideTools = metadata?.tools || "No se requiere ninguno";
  const guideUpdatedAt = metadata?.updatedAt || guide?.createdAt;
  
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
                  <Badge className="bg-[#20132d] text-[#c0467f] border border-[#2c1d3e] text-[14px] uppercase">
                    {guide.difficulty === "beginner" ? "Principiante" : guide.difficulty}
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
                {guideVideoUrl ? (
                  <div className="rounded-xl overflow-hidden bg-muted/30 aspect-video">
                    <VideoPlayer
                      src={guideVideoUrl}
                      poster={guide?.coverImageUrl || undefined}
                      className="w-full h-full"
                    />
                  </div>
                ) : guide?.coverImageUrl ? (
                  <div className="rounded-xl overflow-hidden bg-muted/30 aspect-video">
                    <div className="h-full w-full flex items-center justify-center">
                      <img
                        src={guide.coverImageUrl}
                        alt={guide.title || 'Guía'}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl overflow-hidden bg-muted/30 aspect-video">
                    <div className="h-full w-full flex items-center justify-center">
                      <FileText className="h-12 w-12 text-muted-foreground" />
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