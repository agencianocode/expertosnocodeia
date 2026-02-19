import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, Link, useLocation } from "wouter";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import MobileHeader from "@/components/layout/mobile-header";
import { useForm, Controller } from "react-hook-form";
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
import { Checkbox } from "@/components/ui/checkbox";
import { ObjectUploader } from "@/components/ObjectUploader";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { ArrowLeft, Save, Eye, FileText, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAdmin } from "@/hooks/useAdmin";
import { apiRequest } from "@/lib/queryClient";

// Helper function to generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD') // Normaliza caracteres especiales (á → a)
    .replace(/[\u0300-\u036f]/g, '') // Elimina diacríticos
    .replace(/[^a-z0-9]+/g, '-') // Reemplaza espacios y caracteres especiales con guiones
    .replace(/^-+|-+$/g, '') // Elimina guiones al inicio y final
    .substring(0, 100); // Limita la longitud
}

function formatDateInput(dateValue?: string | Date | null): string {
  if (!dateValue) return "";
  const date = typeof dateValue === "string" ? new Date(dateValue) : dateValue;
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function parseMetadata(raw: any): Record<string, any> {
  if (!raw) return {};
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  return raw;
}

const courseSchema = z.object({
  title: z.string().min(1, "El título es requerido"),
  slug: z.string().optional(), // Slug opcional, se generará automáticamente si no se proporciona
  description: z.string().min(1, "La descripción es requerida"),
  categoryId: z.string().optional(), // Made optional - will be set conditionally
  selectedCategoryIds: z.array(z.string()).optional(), // For guides with multiple categories
  type: z.enum(["course", "guide", "workshop"]),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  estimatedHours: z.number().min(1, "Las horas estimadas son requeridas"),
  isPublished: z.boolean().default(false),
  hasCertificate: z.boolean().default(false),
  coverImageUrl: z.string().optional(),
  prerequisites: z.string().optional(),
  roomId: z.string().optional(), // Sala a la que pertenece
  phaseId: z.string().optional(), // Fase dentro de la sala
  publishedAt: z.string().optional(), // Solo para guías
  guideVideoUrl: z.string().optional(), // Solo para guías
  guideSummary: z.string().optional(), // Solo para guías
  guideTools: z.string().optional(), // Solo para guías
  guideUpdatedAt: z.string().optional(), // Solo para guías
  guideInstructorName: z.string().optional(), // Nombre del instructor (guías)
  guideInstructorAvatar: z.string().optional(), // URL foto del instructor (guías)
  guideFiles: z.array(z.object({
    name: z.string(),
    url: z.string(),
    size: z.number().optional(),
    type: z.string().optional(),
  })).optional(), // Solo para guías
  faqs: z.array(z.object({
    question: z.string().min(1, "La pregunta es requerida"),
    answer: z.string().min(1, "La respuesta es requerida"),
  })).optional(), // Preguntas frecuentes para cursos
  presentationVideoUrl: z.string().optional(), // Video de presentación para cursos
}).superRefine((data, ctx) => {
  // Conditional validation based on type
  if (data.type === 'guide') {
    // For guides, require selectedCategoryIds
    if (!data.selectedCategoryIds || data.selectedCategoryIds.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Las guías deben tener al menos una categoría seleccionada",
        path: ["selectedCategoryIds"]
      });
    }
  } else {
    // For courses/workshops, require categoryId
    if (!data.categoryId || data.categoryId.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La categoría es requerida",
        path: ["categoryId"]
      });
    }
  }
});

type CourseFormData = z.infer<typeof courseSchema>;

export default function CourseForm() {
  const [matchEdit, paramsEdit] = useRoute<{ id: string }>("/admin/content/course/:id/edit");
  const [matchNew] = useRoute("/admin/content/course/new");
  
  // Verificar que alguna ruta coincide
  if (!matchEdit && !matchNew) {
    return null;
  }
  
  const isEditing = !!matchEdit;
  const courseId = paramsEdit?.id;
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location] = useLocation();

  const requestedType = (() => {
    if (!matchNew) return null;
    const query = location.split('?')[1];
    if (!query) return null;
    const type = new URLSearchParams(query).get('type');
    if (type === 'course' || type === 'guide' || type === 'workshop') {
      return type;
    }
    return null;
  })();

  const initialType = requestedType ?? "course";

  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
  });

  const { data: rooms } = useQuery({
    queryKey: ["/api/admin/rooms"],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/admin/rooms');
        return response.json();
      } catch (error) {
        // Fallback to public rooms if admin auth is not available
        const fallbackResponse = await fetch('/api/rooms', { credentials: 'include' });
        if (!fallbackResponse.ok) {
          throw error;
        }
        return fallbackResponse.json();
      }
    },
  });

  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ["/api/admin/courses", courseId],
    queryFn: async () => {
      if (!courseId) return null;
      const response = await apiRequest('GET', `/api/admin/courses/${courseId}`);
      return response.json();
    },
    enabled: isEditing && !!courseId,
  });

  const form = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: "",
      slug: "",
      description: "",
      categoryId: "",
      selectedCategoryIds: [],
      type: initialType,
      difficulty: undefined,
      estimatedHours: 1,
      isPublished: false,
      hasCertificate: false,
      coverImageUrl: "",
      prerequisites: "",
      roomId: "",
      phaseId: "",
      publishedAt: "",
      guideVideoUrl: "",
      guideSummary: "",
      guideTools: "",
      guideUpdatedAt: "",
      guideInstructorName: "",
      guideInstructorAvatar: "",
      guideFiles: [],
      faqs: [],
      presentationVideoUrl: "",
    },
  });

  const selectedRoomId = form.watch('roomId');
  const { data: phases } = useQuery({
    queryKey: ["/api/phases", selectedRoomId],
    queryFn: async () => {
      if (!selectedRoomId) return [];
      const response = await apiRequest('GET', `/api/rooms/${selectedRoomId}/phases`);
      return response.json();
    },
    enabled: !!selectedRoomId,
  });

  // Auto-generate slug when title changes
  const title = form.watch('title');
  useEffect(() => {
    if (title && !isEditing) {
      const generatedSlug = generateSlug(title);
      const currentSlug = form.getValues('slug');
      // Only auto-generate if slug is empty or matches the previous title's slug
      if (!currentSlug || currentSlug === generateSlug(form.formState.defaultValues?.title || '')) {
        form.setValue('slug', generatedSlug);
      }
    }
  }, [title, isEditing, form]);

  useEffect(() => {
    if (course && isEditing) {
      const metadata = parseMetadata((course as any)?.metadata);
      form.reset({
        title: course.title,
        slug: (course as any).slug || "",
        description: course.description,
        categoryId: course.categoryId,
        selectedCategoryIds: Array.isArray(course.categories) && course.categories.length > 0
          ? course.categories.map((cat: any) => typeof cat === 'string' ? cat : cat.id)
          : course.categoryId 
            ? [course.categoryId].filter(Boolean)
            : [], // Use multiple categories if available, fallback to single
        type: course.type,
        difficulty: course.difficulty,
        estimatedHours: course.estimatedHours || 1,
        isPublished: course.isPublished,
        hasCertificate: course.hasCertificate,
        coverImageUrl: course.coverImageUrl || "",
        prerequisites: course.prerequisites || "",
        roomId: course.roomId || "",
        phaseId: course.phaseId || "",
        publishedAt: formatDateInput(course.createdAt),
        guideVideoUrl: metadata.videoUrl || "",
        guideSummary: metadata.summary || "",
        guideTools: metadata.tools || "",
        guideUpdatedAt: formatDateInput(metadata.updatedAt),
        guideInstructorName: metadata.instructor?.name || "",
        guideInstructorAvatar: metadata.instructor?.avatar || "",
        guideFiles: metadata.files || [],
        faqs: metadata.faqs || [],
        presentationVideoUrl: metadata.presentationVideoUrl || "",
      });
    }
  }, [course, isEditing, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: CourseFormData) => {
      const url = isEditing ? `/api/admin/courses/${courseId}` : '/api/admin/courses';
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await apiRequest(method, url, data);
      return response.json();
    },
    onSuccess: (data) => {
      const resultType = data.type || currentType;
      const resultLabel = contentLabels[resultType as keyof typeof contentLabels];
      
      toast({
        title: "¡Éxito!",
        description: isEditing ? `${resultLabel} actualizado correctamente` : `${resultLabel} creado correctamente`,
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/guides"] });
      
      // Stay on current page - no navigation
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (adminLoading || (isEditing && courseLoading)) {
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

  const onSubmit = (data: CourseFormData) => {
    // Prepare data for submission
    const submitData = { ...data };
    
    // Generate slug if not provided
    if (!submitData.slug || submitData.slug.trim() === '') {
      submitData.slug = generateSlug(data.title);
    } else {
      // Normalize slug if provided manually
      submitData.slug = generateSlug(submitData.slug);
    }
    
    // For guides, include categoryIds and ensure categoryId is set
    if (data.type === 'guide' && data.selectedCategoryIds && data.selectedCategoryIds.length > 0) {
      (submitData as any).categoryIds = data.selectedCategoryIds;
      submitData.categoryId = data.selectedCategoryIds[0]; // Set primary category
      if (submitData.publishedAt) {
        (submitData as any).createdAt = new Date(submitData.publishedAt);
      }
      const existingMetadata = parseMetadata((course as any)?.metadata);
      const videoUrl = submitData.guideVideoUrl?.trim();
      const presentationVideoUrl = submitData.presentationVideoUrl?.trim();
      const summary = submitData.guideSummary?.trim();
      const tools = submitData.guideTools?.trim();
      const updatedAt = submitData.guideUpdatedAt ? new Date(submitData.guideUpdatedAt).toISOString() : "";
      const files = submitData.guideFiles || [];
      const nextMetadata = { ...existingMetadata };
      if (videoUrl) {
        nextMetadata.videoUrl = videoUrl;
      } else {
        delete (nextMetadata as any).videoUrl;
      }
      if (presentationVideoUrl) {
        nextMetadata.presentationVideoUrl = presentationVideoUrl;
      } else {
        delete (nextMetadata as any).presentationVideoUrl;
      }
      if (summary) {
        nextMetadata.summary = summary;
      } else {
        delete (nextMetadata as any).summary;
      }
      if (tools) {
        nextMetadata.tools = tools;
      } else {
        delete (nextMetadata as any).tools;
      }
      if (updatedAt) {
        nextMetadata.updatedAt = updatedAt;
      } else {
        delete (nextMetadata as any).updatedAt;
      }
      if (files && files.length > 0) {
        nextMetadata.files = files;
      } else {
        delete (nextMetadata as any).files;
      }
      const instructorName = (submitData as any).guideInstructorName?.trim();
      const instructorAvatar = (submitData as any).guideInstructorAvatar?.trim();
      if (instructorName || instructorAvatar) {
        nextMetadata.instructor = {
          name: instructorName || (existingMetadata.instructor?.name) || "Instructor",
          avatar: instructorAvatar || (existingMetadata.instructor?.avatar) || "",
        };
      } else {
        delete (nextMetadata as any).instructor;
      }
      (submitData as any).metadata = nextMetadata;
    } else if (data.type !== 'guide') {
      // For non-guides, clear categoryIds and keep only categoryId
      delete (submitData as any).selectedCategoryIds;
      (submitData as any).categoryIds = []; // Signal to clear multiple categories
      
      // Save FAQs and presentation video in metadata for courses and workshops
      const existingMetadata = parseMetadata((course as any)?.metadata);
      const faqs = submitData.faqs || [];
      const presentationVideoUrl = submitData.presentationVideoUrl?.trim();
      const nextMetadata = { ...existingMetadata };
      if (faqs && faqs.length > 0) {
        nextMetadata.faqs = faqs;
      } else {
        delete (nextMetadata as any).faqs;
      }
      if (presentationVideoUrl) {
        nextMetadata.presentationVideoUrl = presentationVideoUrl;
      } else {
        delete (nextMetadata as any).presentationVideoUrl;
      }
      (submitData as any).metadata = nextMetadata;
    }

    delete (submitData as any).publishedAt;
    delete (submitData as any).guideVideoUrl;
    delete (submitData as any).guideSummary;
    delete (submitData as any).guideTools;
    delete (submitData as any).guideUpdatedAt;
    delete (submitData as any).guideInstructorName;
    delete (submitData as any).guideInstructorAvatar;
    delete (submitData as any).guideFiles;
    delete (submitData as any).faqs; // Remove from submitData, already saved in metadata
    delete (submitData as any).presentationVideoUrl; // Remove from submitData, already saved in metadata
    
    saveMutation.mutate(submitData);
  };

  // Get current type for dynamic UI text
  const currentType = form.watch('type') || course?.type || 'course';
  const contentLabels = {
    course: 'Curso',
    guide: 'Guía', 
    workshop: 'Taller'
  };
  const contentLabel = contentLabels[currentType as keyof typeof contentLabels];

  const typeOptions = [
    { value: "course", label: "Curso" },
    { value: "guide", label: "Guía" },
    { value: "workshop", label: "Taller" },
  ];

  const difficultyOptions = [
    { value: "beginner", label: "Principiante" },
    { value: "intermediate", label: "Intermedio" },
    { value: "advanced", label: "Avanzado" },
  ];

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
        <Link href="/admin/content">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Contenido
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white">
            {isEditing ? `Editar ${contentLabel}` : `Nuevo ${contentLabel}`}
          </h1>
          <p className="text-gray-400 mt-1">
            {isEditing ? `Modifica los datos del ${contentLabel.toLowerCase()}` : `Crea un nuevo ${contentLabel.toLowerCase()} para la plataforma`}
          </p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Información Básica</CardTitle>
                <CardDescription className="text-gray-400">
                  Datos principales del {contentLabel.toLowerCase()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title" className="text-white">Título *</Label>
                  <Input
                    id="title"
                    {...form.register("title")}
                    className="bg-slate-800 border-slate-600 text-white"
                    placeholder="Ej: IA para consultoría empresarial"
                    data-testid="input-titulo"
                  />
                  {form.formState.errors.title && (
                    <p className="text-red-400 text-sm mt-1">{form.formState.errors.title.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="slug" className="text-white">Slug (URL) *</Label>
                  <Input
                    id="slug"
                    {...form.register("slug")}
                    className="bg-slate-800 border-slate-600 text-white"
                    placeholder="ia-para-consultoria-empresarial"
                    data-testid="input-slug"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    URL amigable para SEO. Se genera automáticamente desde el título, pero puedes editarlo.
                  </p>
                  {form.formState.errors.slug && (
                    <p className="text-red-400 text-sm mt-1">{form.formState.errors.slug.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="description" className="text-white">Descripción *</Label>
                  <RichTextEditor
                    content={form.watch("description") || ""}
                    onChange={(content) => form.setValue("description", content)}
                    placeholder="Describe el contenido y objetivos del curso..."
                    className="mt-2"
                  />
                  {form.formState.errors.description && (
                    <p className="text-red-400 text-sm mt-1">{form.formState.errors.description.message}</p>
                  )}
                </div>

                {/* Presentation Video - For courses, workshops and guides */}
                {(currentType === 'course' || currentType === 'workshop' || currentType === 'guide') && (
                  <div>
                    <Label htmlFor="presentationVideoUrl" className="text-white">Video de presentación</Label>
                    <Input
                      id="presentationVideoUrl"
                      {...form.register("presentationVideoUrl")}
                      className="bg-slate-800 border-slate-600 text-white mt-2"
                      placeholder="https://www.youtube.com/watch?v=... o https://youtu.be/..."
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      URL del video de presentación. Se mostrará arriba de la descripción.
                    </p>
                  </div>
                )}

                {/* FAQs Section - For courses and workshops */}
                {(currentType === 'course' || currentType === 'workshop') && (
                  <div>
                    <Label className="text-white">Preguntas frecuentes (FAQ)</Label>
                    <p className="text-xs text-gray-400 mb-3">
                      Agrega preguntas frecuentes que se mostrarán en formato de acordeón en la página del curso
                    </p>
                    <div className="space-y-3">
                      {form.watch('faqs')?.map((faq, index) => (
                        <div
                          key={index}
                          className="bg-slate-800 border border-slate-600 rounded-lg p-4 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-400">Pregunta {index + 1}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const currentFaqs = form.getValues('faqs') || [];
                                form.setValue('faqs', currentFaqs.filter((_, i) => i !== index));
                              }}
                              className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <div>
                            <Label className="text-white text-sm">Pregunta</Label>
                            <Input
                              value={faq.question}
                              onChange={(e) => {
                                const currentFaqs = form.getValues('faqs') || [];
                                const updatedFaqs = [...currentFaqs];
                                updatedFaqs[index] = { ...updatedFaqs[index], question: e.target.value };
                                form.setValue('faqs', updatedFaqs);
                              }}
                              className="bg-slate-700 border-slate-600 text-white mt-1"
                              placeholder="¿Necesito saber codificar para realizar este curso?"
                            />
                          </div>
                          <div>
                            <Label className="text-white text-sm">Respuesta</Label>
                            <Textarea
                              value={faq.answer}
                              onChange={(e) => {
                                const currentFaqs = form.getValues('faqs') || [];
                                const updatedFaqs = [...currentFaqs];
                                updatedFaqs[index] = { ...updatedFaqs[index], answer: e.target.value };
                                form.setValue('faqs', updatedFaqs);
                              }}
                              className="bg-slate-700 border-slate-600 text-white mt-1 min-h-[80px]"
                              placeholder="No. Este curso está diseñado para principiantes..."
                            />
                          </div>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          const currentFaqs = form.getValues('faqs') || [];
                          form.setValue('faqs', [...currentFaqs, { question: '', answer: '' }]);
                        }}
                        className="w-full border-slate-600 text-gray-300 hover:bg-slate-800 hover:text-white"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar pregunta frecuente
                      </Button>
                    </div>
                  </div>
                )}

                {currentType === 'guide' && (
                  <div>
                    <Label htmlFor="publishedAt" className="text-white">Fecha de publicación</Label>
                    <Input
                      id="publishedAt"
                      type="date"
                      {...form.register("publishedAt")}
                      className="bg-slate-800 border-slate-600 text-white"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Se usa para ordenar y mostrar la fecha en la guía.
                    </p>
                  </div>
                )}

                {currentType === 'guide' && (
                  <div>
                    <Label htmlFor="guideVideoUrl" className="text-white">URL del video de la guía</Label>
                    <Input
                      id="guideVideoUrl"
                      {...form.register("guideVideoUrl")}
                      className="bg-slate-800 border-slate-600 text-white"
                      placeholder="https://www.youtube.com/watch?v=..."
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Si agregas un video, se mostrará aquí y la imagen será su carátula.
                    </p>
                  </div>
                )}

                {currentType === 'guide' && (
                  <div>
                    <Label htmlFor="guideSummary" className="text-white">Resumen</Label>
                    <Textarea
                      id="guideSummary"
                      {...form.register("guideSummary")}
                      className="bg-slate-800 border-slate-600 text-white"
                      placeholder="Breve resumen que aparecerá en la cabecera de la guía"
                    />
                  </div>
                )}

                {currentType === 'guide' && (
                  <div>
                    <Label htmlFor="guideTools" className="text-white">Herramientas necesarias</Label>
                    <Input
                      id="guideTools"
                      {...form.register("guideTools")}
                      className="bg-slate-800 border-slate-600 text-white"
                      placeholder="Ej: No se requiere ninguno"
                    />
                  </div>
                )}

                {currentType === 'guide' && (
                  <div>
                    <Label htmlFor="guideUpdatedAt" className="text-white">Actualizado</Label>
                    <Input
                      id="guideUpdatedAt"
                      type="date"
                      {...form.register("guideUpdatedAt")}
                      className="bg-slate-800 border-slate-600 text-white"
                    />
                  </div>
                )}

                {currentType === 'guide' && (
                  <div className="space-y-3 border-t border-slate-600 pt-4">
                    <Label className="text-white font-medium">Instructor de la guía</Label>
                    <p className="text-xs text-gray-400">
                      Se muestra en la card de la guía en la home (nombre y foto en &quot;Impartido por&quot;).
                    </p>
                    <div>
                      <Label htmlFor="guideInstructorName" className="text-gray-300 text-sm">Nombre del instructor</Label>
                      <Input
                        id="guideInstructorName"
                        placeholder="Ej. Fabián Segura"
                        {...form.register("guideInstructorName")}
                        className="bg-slate-800 border-slate-600 text-white mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300 text-sm block mb-1">Foto del instructor</Label>
                      <div className="flex flex-wrap items-center gap-3">
                        <ObjectUploader
                          maxNumberOfFiles={1}
                          maxFileSize={2 * 1024 * 1024}
                          accept="image/*"
                          onGetUploadParameters={async () => {
                            const response = await apiRequest('POST', '/api/admin/media/upload-url', { fileType: 'image/jpeg' });
                            const { uploadURL } = await response.json();
                            return { method: 'PUT' as const, url: uploadURL };
                          }}
                          onComplete={async (result) => {
                            if (result?.[0]) {
                              const uploadUrl = result[0].uploadURL;
                              const imageUrl = uploadUrl?.split('?')[0];
                              try {
                                const response = await apiRequest('POST', '/api/admin/media/normalize-path', { url: imageUrl });
                                const { normalizedPath } = await response.json();
                                form.setValue("guideInstructorAvatar", normalizedPath || "");
                              } catch (error) {
                                console.error('Error normalizing path:', error);
                                form.setValue("guideInstructorAvatar", imageUrl || "");
                              }
                              toast({
                                title: "Foto subida",
                                description: "La foto del instructor se ha subido correctamente",
                              });
                            }
                          }}
                          buttonClassName="bg-slate-700 hover:bg-slate-600 text-white text-sm px-3 py-2"
                        >
                          📷 Subir foto
                        </ObjectUploader>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => form.setValue("guideInstructorAvatar", "")}
                          className="text-gray-400 border-slate-600 hover:bg-slate-700"
                        >
                          Quitar foto
                        </Button>
                      </div>
                      {form.watch("guideInstructorAvatar") && (
                        <div className="mt-2 flex items-center gap-2">
                          <img
                            src={form.watch("guideInstructorAvatar")?.startsWith('/objects/')
                              ? `/api/object-proxy${form.watch("guideInstructorAvatar")}`
                              : form.watch("guideInstructorAvatar")}
                            alt="Instructor"
                            className="w-14 h-14 rounded-full object-cover border-2 border-slate-600"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                          <span className="text-xs text-gray-400">Vista previa</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {currentType === 'guide' && (
                  <div>
                    <Label className="text-white">Archivos descargables</Label>
                    <p className="text-xs text-gray-400 mb-3">
                      Sube PDFs, documentos u otros archivos que los usuarios puedan descargar
                    </p>
                    <div className="space-y-3">
                      <ObjectUploader
                        maxNumberOfFiles={10}
                        maxFileSize={50 * 1024 * 1024} // 50MB
                        accept=".pdf,.doc,.docx,.xlsx,.xls,.ppt,.pptx,.txt,.zip,.rar,.csv"
                        onGetUploadParameters={async () => {
                          const response = await apiRequest('POST', '/api/admin/media/upload-url', { 
                            fileType: 'application/pdf' 
                          });
                          const { uploadURL } = await response.json();
                          return { method: 'PUT' as const, url: uploadURL };
                        }}
                        onComplete={async (results) => {
                          if (results && results.length > 0) {
                            const currentFiles = form.getValues('guideFiles') || [];
                            const newFiles = await Promise.all(
                              results.map(async (result) => {
                                const fileName = result.name;
                                const fileUrl = result.uploadURL?.split('?')[0] || result.uploadURL;
                                
                                // Normalizar la URL a través del backend
                                try {
                                  const normalizeResponse = await apiRequest('POST', '/api/admin/media/normalize-path', { 
                                    url: fileUrl 
                                  });
                                  const { normalizedPath } = await normalizeResponse.json();
                                  return {
                                    name: fileName,
                                    url: normalizedPath || fileUrl,
                                    size: 0,
                                    type: fileName.split('.').pop()?.toLowerCase() || 'unknown',
                                  };
                                } catch (error) {
                                  console.error('Error normalizing path:', error);
                                  return {
                                    name: fileName,
                                    url: fileUrl,
                                    size: 0,
                                    type: fileName.split('.').pop()?.toLowerCase() || 'unknown',
                                  };
                                }
                              })
                            );
                            
                            form.setValue('guideFiles', [...currentFiles, ...newFiles]);
                            toast({
                              title: "¡Éxito!",
                              description: `${results.length} archivo(s) agregado(s) correctamente`,
                            });
                          }
                        }}
                        buttonClassName="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-2"
                      >
                        📎 Subir Archivos
                      </ObjectUploader>
                      
                      {form.watch('guideFiles') && form.watch('guideFiles')!.length > 0 && (
                        <div className="space-y-2 mt-4">
                          <p className="text-sm text-gray-400">Archivos subidos:</p>
                          <div className="space-y-2">
                            {form.watch('guideFiles')!.map((file, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between bg-slate-800 border border-slate-600 rounded-lg p-3"
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <FileText className="h-4 w-4 text-blue-400 flex-shrink-0" />
                                  <span className="text-white text-sm truncate">{file.name}</span>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const currentFiles = form.getValues('guideFiles') || [];
                                    const updatedFiles = currentFiles.filter((_, i) => i !== index);
                                    form.setValue('guideFiles', updatedFiles);
                                  }}
                                  className="text-red-400 hover:text-red-300 hover:bg-red-900/20 ml-2"
                                >
                                  ❌
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="prerequisites" className="text-white">Prerrequisitos</Label>
                  <Textarea
                    id="prerequisites"
                    {...form.register("prerequisites")}
                    className="bg-slate-800 border-slate-600 text-white"
                    placeholder="Conocimientos previos necesarios..."
                  />
                </div>

                <div>
                  <Label htmlFor="coverImageUrl" className="text-white">Imagen de Portada</Label>
                  <div className="space-y-3">
                    <Input
                      id="coverImageUrl"
                      {...form.register("coverImageUrl")}
                      className="bg-slate-800 border-slate-600 text-white"
                      placeholder="https://ejemplo.com/imagen.jpg o usa el botón para subir"
                    />
                    
                    <div className="flex gap-3">
                      <ObjectUploader
                        maxNumberOfFiles={1}
                        maxFileSize={5242880} // 5MB
                        onGetUploadParameters={async () => {
                          const response = await apiRequest('POST', '/api/admin/media/upload-url', { fileType: 'image/jpeg' });
                          const { uploadURL } = await response.json();
                          return { method: 'PUT' as const, url: uploadURL };
                        }}
                        onComplete={async (result) => {
                          if (result?.[0]) {
                            const uploadUrl = result[0].uploadURL;
                            const imageUrl = uploadUrl?.split('?')[0]; // Remove query params
                            
                            // Convert to object path through backend
                            try {
                              const response = await apiRequest('POST', '/api/admin/media/normalize-path', { url: imageUrl });
                              const { normalizedPath } = await response.json();
                              form.setValue("coverImageUrl", normalizedPath || "");
                            } catch (error) {
                              console.error('Error normalizing path:', error);
                              form.setValue("coverImageUrl", imageUrl || "");
                            }
                            
                            toast({
                              title: "¡Éxito!",
                              description: "Imagen subida correctamente",
                            });
                          }
                        }}
                        buttonClassName="bg-purple-600 hover:bg-purple-700 text-white text-sm px-3 py-2"
                      >
                        📷 Subir Imagen
                      </ObjectUploader>
                      
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => form.setValue("coverImageUrl", "")}
                        className="text-gray-400 border-slate-600 hover:bg-slate-700"
                      >
                        ❌ Limpiar
                      </Button>
                    </div>

                    {/* Preview */}
                    {form.watch("coverImageUrl") && (
                      <div className="border border-slate-600 rounded-lg p-3 bg-slate-800/50">
                        <Label className="text-white text-sm mb-2 block">Vista Previa:</Label>
                        <img
                          src={form.watch("coverImageUrl")?.startsWith('/objects/') 
                            ? `/api/object-proxy${form.watch("coverImageUrl")}` 
                            : form.watch("coverImageUrl")
                          }
                          alt="Preview"
                          className="w-full h-32 object-cover rounded-md"
                          onError={(e) => {
                            console.error('Image load error:', e);
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Configuración</CardTitle>
                <CardDescription className="text-gray-400">
                  Opciones del {contentLabel.toLowerCase()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Category Selection - Multiple for guides, single for others */}
                {currentType === 'guide' ? (
                  <div>
                    <Label className="text-white">Categorías * (Selecciona múltiples para guías)</Label>
                    <Controller
                      name="selectedCategoryIds"
                      control={form.control}
                      render={({ field }) => (
                        <div className="space-y-3 mt-2 max-h-48 overflow-y-auto bg-slate-800/50 rounded-lg p-3 border border-slate-600" data-testid="select-categorias-multiple">
                          {(categories as any)?.map((category: any) => {
                            const currentValues = Array.isArray(field.value) ? field.value : [];
                            const isChecked = currentValues.includes(category.id);
                            return (
                              <div key={category.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`category-${category.id}`}
                                  checked={isChecked}
                                  onCheckedChange={(checked) => {
                                    // Get fresh value from form to avoid stale closures
                                    const currentValues = form.getValues('selectedCategoryIds');
                                    const freshValues: string[] = Array.isArray(currentValues) 
                                      ? currentValues 
                                      : [];
                                    
                                    if (checked) {
                                      // Only add if not already in the array
                                      if (!freshValues.includes(category.id)) {
                                        const newValues = [...freshValues, category.id];
                                        field.onChange(newValues);
                                        form.setValue('selectedCategoryIds', newValues, { shouldValidate: true });
                                        // Also set primary category for compatibility
                                        if (freshValues.length === 0) {
                                          form.setValue('categoryId', category.id);
                                        }
                                      }
                                    } else {
                                      // Remove from array
                                      const newValues = freshValues.filter((id: string) => id !== category.id);
                                      field.onChange(newValues);
                                      form.setValue('selectedCategoryIds', newValues, { shouldValidate: true });
                                      // Update primary category if this was the primary one
                                      if (form.getValues('categoryId') === category.id && newValues.length > 0) {
                                        form.setValue('categoryId', newValues[0]);
                                      } else if (newValues.length === 0) {
                                        form.setValue('categoryId', '');
                                      }
                                    }
                                  }}
                                  data-testid={`checkbox-categoria-${category.id}`}
                                />
                                <Label htmlFor={`category-${category.id}`} className="text-white text-sm cursor-pointer">
                                  {category.name}
                                </Label>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    />
                    {form.formState.errors.selectedCategoryIds && (
                      <p className="text-red-400 text-sm mt-1">{form.formState.errors.selectedCategoryIds.message}</p>
                    )}
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="categoryId" className="text-white">Categoría *</Label>
                    <Controller
                      name="categoryId"
                      control={form.control}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          data-testid="select-categoria"
                        >
                          <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                            <SelectValue placeholder="Selecciona una categoría" />
                          </SelectTrigger>
                          <SelectContent>
                            {(categories as any)?.map((category: any) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {form.formState.errors.categoryId && (
                      <p className="text-red-400 text-sm mt-1">{form.formState.errors.categoryId.message}</p>
                    )}
                  </div>
                )}

                <div>
                  <Label htmlFor="type" className="text-white">Tipo *</Label>
                  <Controller
                    name="type"
                    control={form.control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        data-testid="select-tipo"
                      >
                        <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                          <SelectValue placeholder="Selecciona el tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {typeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div>
                  <Label htmlFor="difficulty" className="text-white">Dificultad</Label>
                  <Controller
                    name="difficulty"
                    control={form.control}
                    render={({ field }) => (
                      <Select
                        value={field.value || ""}
                        onValueChange={field.onChange}
                        data-testid="select-dificultad"
                      >
                        <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                          <SelectValue placeholder="Selecciona la dificultad" />
                        </SelectTrigger>
                        <SelectContent>
                          {difficultyOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="border-t border-slate-600 pt-4">
                  <Label className="text-white font-semibold text-sm mb-3 block">Asignación a Sala y Fase (Opcional)</Label>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="roomId" className="text-white text-sm">Sala</Label>
                      <div className="flex gap-2">
                        <Controller
                          name="roomId"
                          control={form.control}
                          render={({ field }) => (
                            <Select
                              value={field.value || undefined}
                              onValueChange={(value) => {
                                field.onChange(value);
                                // Reset phase when room changes
                                form.setValue("phaseId", "");
                              }}
                            >
                              <SelectTrigger className="bg-slate-800 border-slate-600 text-white flex-1">
                                <SelectValue placeholder="Ninguna - No asignar a sala" />
                              </SelectTrigger>
                              <SelectContent>
                                {(rooms as any)?.map((room: any) => (
                                  <SelectItem key={room.id} value={room.id}>
                                    {room.title}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                        {form.watch("roomId") && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              form.setValue("roomId", "");
                              form.setValue("phaseId", "");
                            }}
                            className="text-gray-400 border-slate-600 hover:bg-slate-700"
                          >
                            Limpiar
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Selecciona la sala a la que pertenece este contenido</p>
                    </div>

                    <div>
                      <Label htmlFor="phaseId" className="text-white text-sm">Fase</Label>
                      <Controller
                        name="phaseId"
                        control={form.control}
                        render={({ field }) => (
                          <Select
                            value={field.value || undefined}
                            onValueChange={field.onChange}
                            disabled={!selectedRoomId}
                          >
                            <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                              <SelectValue placeholder={selectedRoomId ? "Selecciona una fase" : "Primero selecciona una sala"} />
                            </SelectTrigger>
                            <SelectContent>
                              {(phases as any)?.map((phase: any) => (
                                <SelectItem key={phase.id} value={phase.id}>
                                  Fase {phase.order}: {phase.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      <p className="text-xs text-gray-400 mt-1">Selecciona la fase dentro de la sala</p>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="estimatedHours" className="text-white">Horas Estimadas *</Label>
                  <Input
                    id="estimatedHours"
                    type="number"
                    min="1"
                    {...form.register("estimatedHours", { valueAsNumber: true })}
                    className="bg-slate-800 border-slate-600 text-white"
                    data-testid="input-horas"
                  />
                  {form.formState.errors.estimatedHours && (
                    <p className="text-red-400 text-sm mt-1">{form.formState.errors.estimatedHours.message}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="isPublished" className="text-white">Publicado</Label>
                    <Switch
                      id="isPublished"
                      checked={form.watch("isPublished")}
                      onCheckedChange={(checked) => form.setValue("isPublished", checked)}
                      data-testid="switch-publicado"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="hasCertificate" className="text-white">Con Certificado</Label>
                    <Switch
                      id="hasCertificate"
                      checked={form.watch("hasCertificate")}
                      onCheckedChange={(checked) => form.setValue("hasCertificate", checked)}
                      data-testid="switch-certificado"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={saveMutation.isPending}
            className="bg-purple-600 hover:bg-purple-700"
            data-testid={`button-guardar-${currentType}`}
          >
            {saveMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
{isEditing ? "Actualizar" : "Crear"} {contentLabel}
              </>
            )}
          </Button>
          
          {isEditing && course && (
            <Link href={`/course/${course.id}`}>
              <Button variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                Ver {contentLabel}
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