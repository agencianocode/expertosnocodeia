import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, Link, useLocation } from "wouter";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import MobileHeader from "@/components/layout/mobile-header";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, Eye, Play, BookOpen, FileText, HelpCircle, GraduationCap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAdmin } from "@/hooks/useAdmin";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { LessonResourcesEditor } from "@/components/lesson-resources-editor";
import { apiRequest } from "@/lib/queryClient";

const lessonSchema = z.object({
  title: z.string().min(1, "El título es requerido"),
  description: z.string().optional(),
  content: z.string().optional(),
  type: z.enum(["video", "text", "quiz", "interactive"]),
  duration: z.number().min(1, "La duración es requerida"),
  order: z.number().min(1, "El orden es requerido"),
  isPublished: z.boolean().default(false),
  isFree: z.boolean().default(false),
  videoUrl: z.string().optional(),
  imageUrl: z.string().optional(),
  attachments: z.string().optional(),
  objectives: z.string().optional(),
  parentLessonId: z.string().optional(), // Optional: if set, this is a sub-lesson under a module
}).refine((data) => {
  // If this is a sub-lesson (has parentLessonId), at least one content type is required
  if (data.parentLessonId) {
    const hasContent = data.content && data.content.trim() !== '';
    const hasVideo = data.videoUrl && data.videoUrl.trim() !== '';
    const hasImage = data.imageUrl && data.imageUrl.trim() !== '';
    const hasAttachments = data.attachments && data.attachments.trim() !== '';
    
    if (!hasContent && !hasVideo && !hasImage && !hasAttachments) {
      return false;
    }
  }
  return true;
}, {
  message: "Las sub-lecciones deben tener al menos contenido, video, imagen o archivos adjuntos",
  path: ["content"],
});

type LessonFormData = z.infer<typeof lessonSchema>;

export default function LessonForm() {
  const [matchEdit, paramsEdit] = useRoute<{ id: string }>("/admin/content/lesson/:id/edit");
  const [matchNew, paramsNew] = useRoute<{ courseId: string }>("/admin/content/lesson/new/:courseId");
  const [editorKey, setEditorKey] = useState(0);
  
  // Verificar que alguna ruta coincide
  if (!matchEdit && !matchNew) {
    return null;
  }
  
  const isEditing = !!matchEdit;
  const lessonId = paramsEdit?.id;
  const newCourseId = paramsNew?.courseId;
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: lesson, isLoading: lessonLoading } = useQuery<any>({
    queryKey: ["/api/admin/lessons", lessonId],
    enabled: isEditing && !!lessonId,
  });

  // Get courseId from lesson data when editing, or from URL params when creating new
  const courseId = isEditing && lesson ? lesson.courseId : newCourseId;

  const { data: course } = useQuery<any>({
    queryKey: ["/api/admin/courses", courseId],
    enabled: !!courseId,
  });

  const { data: existingLessons } = useQuery<any[]>({
    queryKey: ["/api/admin/courses", courseId, "lessons"],
    enabled: !!courseId,
  });

  // Get available modules (lessons without parent) for this lesson to be a sub-lesson
  const availableModules = existingLessons?.filter(l => 
    !l.parentLessonId && l.id !== lessonId // Exclude self when editing
  ) || [];

  const form = useForm<LessonFormData>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      title: "",
      description: "",
      content: "",
      type: "text",
      duration: 10,
      order: 1,
      isPublished: true,
      isFree: false,
      videoUrl: "",
      attachments: "",
      objectives: "",
      parentLessonId: undefined,
    },
  });

  useEffect(() => {
    if (lesson && isEditing) {
      // Reset form with lesson data when it loads
      form.reset({
        title: lesson.title || "",
        description: lesson.description || "",
        content: lesson.content || "",
        type: lesson.type || "text",
        duration: lesson.duration || 10,
        order: lesson.order || 1,
        isPublished: lesson.isPublished ?? true,
        isFree: lesson.isFree ?? false,
        videoUrl: lesson.videoUrl || "",
        attachments: lesson.attachments || "",
        objectives: lesson.objectives || "",
        parentLessonId: lesson.parentLessonId || undefined,
      });
      // Force RichTextEditor to re-render with new content
      setEditorKey(prev => prev + 1);
    } else if (existingLessons && !isEditing) {
      // Set next order number for new lessons
      const maxOrder = existingLessons.reduce((max: number, l: any) => Math.max(max, l.order || 0), 0);
      form.setValue("order", maxOrder + 1);
    }
  }, [lesson, existingLessons, isEditing, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: LessonFormData) => {
      const url = isEditing ? `/api/admin/lessons/${lessonId}` : `/api/admin/courses/${courseId}/lessons`;
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await apiRequest(method, url, data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "¡Éxito!",
        description: isEditing ? "Lección actualizada correctamente" : "Lección creada correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses", courseId, "lessons"] });
      
      // Invalidate the specific lesson cache too
      if (isEditing && lessonId) {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/lessons", lessonId] });
      }
      
      // Navigate back to lessons list after creating a new lesson
      if (!isEditing && courseId) {
        setLocation(`/admin/content/course/${courseId}/lessons`);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (adminLoading || (isEditing && lessonLoading)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <h1 className="text-2xl font-bold text-red-500">Acceso Denegado</h1>
        <p className="text-gray-400">No tienes privilegios de administrador.</p>
        <Link href="/">
          <Button>Volver al Inicio</Button>
        </Link>
      </div>
    );
  }

  const onSubmit = (data: LessonFormData) => {
    saveMutation.mutate(data);
  };

  const typeOptions = [
    { value: "text", label: "Texto/Artículo", icon: FileText, description: "Contenido escrito, tutoriales" },
    { value: "video", label: "Video", icon: Play, description: "Video educativo, conferencia" },
    { value: "quiz", label: "Evaluación", icon: HelpCircle, description: "Quiz, examen, preguntas" },
    { value: "interactive", label: "Interactivo", icon: BookOpen, description: "Ejercicios, simulaciones" },
  ];

  const backUrl = courseId ? `/admin/content/course/${courseId}/lessons` : '/admin/content';

  return (
    <div className="min-h-screen bg-dark-bg text-white">
      {/* Mobile Header */}
      <MobileHeader />
      
      <div className="flex">
        {/* Sidebar - Hidden on mobile */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        
        {/* Main Content */}
        <main className="flex-1 overflow-auto pb-20 lg:pb-0 lg:ml-[250px]">
          <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href={backUrl}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {courseId ? 'Lecciones' : 'Cursos'}
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white">
            {isEditing ? "Editar Lección" : "Nueva Lección"}
          </h1>
          <p className="text-gray-400 mt-1">
            {course && <span className="text-purple-400">{course.title}</span>}
            {isEditing ? " - Modifica el contenido de la lección" : " - Crea nuevo contenido educativo"}
          </p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Contenido de la Lección</CardTitle>
                <CardDescription className="text-gray-400">
                  Información principal y contenido educativo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title" className="text-white">Título *</Label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
                      <GraduationCap className="h-5 w-5 text-gray-400" />
                    </div>
                    <Input
                      id="title"
                      {...form.register("title")}
                      className="bg-slate-800 border-slate-600 text-white pl-12 font-satoshi text-[24px] font-bold"
                      placeholder="Ej: Introducción a la Inteligencia Artificial"
                    />
                  </div>
                  {form.formState.errors.title && (
                    <p className="text-red-400 text-sm mt-1">{form.formState.errors.title.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="description" className="text-white">Descripción</Label>
                  <Textarea
                    id="description"
                    {...form.register("description")}
                    className="bg-slate-800 border-slate-600 text-white min-h-[80px]"
                    placeholder="Breve descripción de lo que aprenderán en esta lección..."
                  />
                  {form.formState.errors.description && (
                    <p className="text-red-400 text-sm mt-1">{form.formState.errors.description.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="objectives" className="text-white">Objetivos de Aprendizaje</Label>
                  <Textarea
                    id="objectives"
                    {...form.register("objectives")}
                    className="bg-slate-800 border-slate-600 text-white"
                    placeholder="• Objetivo 1&#10;• Objetivo 2&#10;• Objetivo 3"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Multimedia Section */}
            <Card className="bg-slate-900/50 border-slate-700 mt-6">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  🎬 Multimedia de la Lección
                  {!form.watch("parentLessonId") && (
                    <span className="text-xs font-normal text-gray-400 bg-slate-800 px-2 py-1 rounded">
                      Opcional para módulos
                    </span>
                  )}
                </CardTitle>
                <CardDescription className="text-gray-400">
                  {!form.watch("parentLessonId") 
                    ? "Los módulos pueden tener multimedia, pero es opcional. Solo el título es requerido."
                    : "Agrega videos, imágenes o GIFs que aparecerán arriba del contenido"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="videoUrl" className="text-white">📹 URL del Video (YouTube)</Label>
                  <Input
                    id="videoUrl"
                    {...form.register("videoUrl")}
                    className="bg-slate-800 border-slate-600 text-white"
                    placeholder="https://youtube.com/watch?v=abc123 o https://youtu.be/abc123"
                  />
                  <p className="text-gray-400 text-xs mt-1">
                    Acepta URLs de YouTube en cualquier formato. Se mostrará como video embebido.
                  </p>
                </div>

                <div className="text-center text-gray-400">
                  <span className="text-sm">— o —</span>
                </div>

                <div>
                  <Label htmlFor="imageUrl" className="text-white">🖼️ URL de la Imagen</Label>
                  <Input
                    id="imageUrl"
                    {...form.register("imageUrl")}
                    className="bg-slate-800 border-slate-600 text-white"
                    placeholder="https://ejemplo.com/imagen.jpg o URL de imagen/GIF"
                  />
                  <p className="text-gray-400 text-xs mt-1">
                    Acepta imágenes (JPG, PNG) y GIFs. Se mostrará arriba del contenido.
                  </p>
                </div>

                {/* Preview */}
                {(form.watch("videoUrl") || form.watch("imageUrl")) && (
                  <div className="border border-slate-600 rounded-lg p-4 bg-slate-800/50">
                    <Label className="text-white text-sm mb-2 block">Vista Previa:</Label>
                    {form.watch("videoUrl") ? (
                      <div className="text-green-400 text-sm flex items-center gap-2">
                        ▶️ Video de YouTube detectado - se mostrará embebido
                      </div>
                    ) : form.watch("imageUrl") ? (
                      <div className="text-blue-400 text-sm flex items-center gap-2">
                        🖼️ Imagen detectada - se mostrará arriba del contenido
                      </div>
                    ) : null}
                  </div>
                )}

                <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-3">
                  <p className="text-blue-300 text-sm">
                    💡 <strong>Tip:</strong> Si agregas tanto video como imagen, solo se mostrará el video. La imagen aparecerá solo si no hay video.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-700 mt-6">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  Contenido de la Lección
                  {!form.watch("parentLessonId") && (
                    <span className="text-xs font-normal text-gray-400 bg-slate-800 px-2 py-1 rounded">
                      Opcional para módulos
                    </span>
                  )}
                </CardTitle>
                <CardDescription className="text-gray-400">
                  {!form.watch("parentLessonId") 
                    ? "Los módulos son contenedores y no requieren contenido."
                    : "Contenido principal que aparecerá debajo del multimedia (sub-lecciones deben tener al menos: contenido, video, imagen o archivos)"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="content" className="text-white">
                    Contenido
                  </Label>
                  <RichTextEditor
                    key={editorKey}
                    content={form.watch("content") || ""}
                    onChange={(content) => form.setValue("content", content)}
                    placeholder={
                      !form.watch("parentLessonId")
                        ? "Opcional para módulos - Los módulos son solo contenedores organizadores"
                        : "Escribe aquí el contenido de la sub-lección. Puedes dejarlo vacío si agregas video, imagen o archivos..."
                    }
                    className="mt-2"
                  />
                  {form.formState.errors.content && (
                    <p className="text-red-400 text-sm mt-1">{form.formState.errors.content.message}</p>
                  )}
                  <p className="text-gray-400 text-xs mt-1">
                    {!form.watch("parentLessonId")
                      ? "💡 Módulos: Solo necesitas darle un título. El contenido se mostrará desde las sub-lecciones."
                      : "💡 Sub-lecciones: Puedes dejar el contenido vacío si agregas video, imagen o archivos adjuntos. Debe haber al menos una de estas opciones."
                    }
                  </p>
                </div>

                <div>
                  <Label htmlFor="attachments" className="text-white">Archivos Adjuntos</Label>
                  <Textarea
                    id="attachments"
                    {...form.register("attachments")}
                    className="bg-slate-800 border-slate-600 text-white"
                    rows={3}
                    placeholder="URLs de PDFs, documentos, código de ejemplo, etc. (uno por línea)"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Configuración</CardTitle>
                <CardDescription className="text-gray-400">
                  Opciones de la lección
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="type" className="text-white">Tipo de Lección *</Label>
                  <Select 
                    value={form.watch("type")}
                    onValueChange={(value) => form.setValue("type", value as any)}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                      <SelectValue placeholder="Selecciona el tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {typeOptions.map((option) => {
                        const IconComponent = option.icon;
                        return (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <IconComponent className="h-4 w-4" />
                              <div>
                                <div className="font-medium">{option.label}</div>
                                <div className="text-xs text-gray-400">{option.description}</div>
                              </div>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
                  <h4 className="text-blue-300 font-medium mb-2 flex items-center gap-2">
                    📚 Estructura: Módulos y Lecciones
                  </h4>
                  <p className="text-blue-200 text-sm mb-2">
                    <strong>Módulo:</strong> Contenedor principal (déjalo sin módulo padre)
                  </p>
                  <p className="text-blue-200 text-sm">
                    <strong>Sub-lección:</strong> Lección dentro de un módulo (selecciona un módulo padre)
                  </p>
                </div>

                <div>
                  <Label htmlFor="parentLessonId" className="text-white">Módulo Padre</Label>
                  <Select 
                    value={form.watch("parentLessonId") || "none"}
                    onValueChange={(value) => form.setValue("parentLessonId", value === "none" ? undefined : value)}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                      <SelectValue placeholder="Sin módulo padre (crear MÓDULO)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        ✨ Sin módulo padre → Crear MÓDULO principal
                      </SelectItem>
                      {availableModules.length > 0 && (
                        <>
                          <div className="px-2 py-1.5 text-xs font-semibold text-gray-400 bg-slate-800">
                            Selecciona un módulo para crear una sub-lección:
                          </div>
                          {availableModules.map((module: any) => (
                            <SelectItem key={module.id} value={module.id}>
                              📂 {module.title}
                            </SelectItem>
                          ))}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-gray-400 text-xs mt-1">
                    {form.watch("parentLessonId") 
                      ? "✅ Esta será una sub-lección dentro del módulo seleccionado" 
                      : "✅ Esta será un MÓDULO principal que puede contener sub-lecciones"}
                  </p>
                </div>

                <div>
                  <Label htmlFor="duration" className="text-white">Duración (minutos) *</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    max="180"
                    {...form.register("duration", { valueAsNumber: true })}
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                  {form.formState.errors.duration && (
                    <p className="text-red-400 text-sm mt-1">{form.formState.errors.duration.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="order" className="text-white">Orden en el Curso *</Label>
                  <Input
                    id="order"
                    type="number"
                    min="1"
                    {...form.register("order", { valueAsNumber: true })}
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                  {form.formState.errors.order && (
                    <p className="text-red-400 text-sm mt-1">{form.formState.errors.order.message}</p>
                  )}
                  <p className="text-gray-400 text-xs mt-1">
                    Define el orden de aparición en el curso
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="isPublished" className="text-white">Publicar</Label>
                      <p className="text-gray-400 text-xs">Visible para estudiantes</p>
                    </div>
                    <Switch
                      id="isPublished"
                      checked={form.watch("isPublished")}
                      onCheckedChange={(checked) => form.setValue("isPublished", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="isFree" className="text-white">Lección Gratuita</Label>
                      <p className="text-gray-400 text-xs">Acceso sin suscripción</p>
                    </div>
                    <Switch
                      id="isFree"
                      checked={form.watch("isFree")}
                      onCheckedChange={(checked) => form.setValue("isFree", checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Preview Card */}
            <Card className="bg-slate-900/50 border-slate-700 mt-4">
              <CardHeader>
                <CardTitle className="text-white text-sm">Vista Previa</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="text-gray-400">
                    <span className="text-white">Tipo:</span> {form.watch("type") || "No seleccionado"}
                  </div>
                  <div className="text-gray-400">
                    <span className="text-white">Duración:</span> {form.watch("duration") || 0} min
                  </div>
                  <div className="text-gray-400">
                    <span className="text-white">Orden:</span> #{form.watch("order") || 1}
                  </div>
                  <div className="flex gap-2 mt-3">
                    {form.watch("isPublished") && (
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
                        Publicado
                      </span>
                    )}
                    {form.watch("isFree") && (
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                        Gratuito
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Lesson Resources Section - Only show when editing existing lesson */}
        {isEditing && lessonId && (
          <div className="mt-6">
            <LessonResourcesEditor lessonId={lessonId} />
          </div>
        )}

        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={saveMutation.isPending}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {saveMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isEditing ? "Actualizar" : "Crear"} Lección
              </>
            )}
          </Button>
          
          <Button 
            type="button" 
            variant="outline"
            onClick={() => form.setValue("isPublished", false)}
          >
            Guardar como Borrador
          </Button>

          {courseId && (
            <Link href={`/course/${courseId}`}>
              <Button variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                Ver Curso
              </Button>
            </Link>
          )}
        </div>
      </form>
          </div>
        </main>
      </div>
      
      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
}