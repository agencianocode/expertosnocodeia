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
import { ObjectUploader } from "@/components/ObjectUploader";
import { ArrowLeft, Save, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAdmin } from "@/hooks/useAdmin";
import { apiRequest } from "@/lib/queryClient";

const courseSchema = z.object({
  title: z.string().min(1, "El título es requerido"),
  description: z.string().min(1, "La descripción es requerida"),
  categoryId: z.string().min(1, "La categoría es requerida"),
  type: z.enum(["course", "guide", "workshop"]),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  estimatedHours: z.number().min(1, "Las horas estimadas son requeridas"),
  isPublished: z.boolean().default(false),
  hasCertificate: z.boolean().default(false),
  coverImageUrl: z.string().optional(),
  prerequisites: z.string().optional(),
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
  const [, navigate] = useLocation();

  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
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
      description: "",
      categoryId: "",
      type: "course",
      difficulty: undefined,
      estimatedHours: 1,
      isPublished: false,
      hasCertificate: false,
      coverImageUrl: "",
      prerequisites: "",
    },
  });

  useEffect(() => {
    if (course && isEditing) {
      form.reset({
        title: course.title,
        description: course.description,
        categoryId: course.categoryId,
        type: course.type,
        difficulty: course.difficulty,
        estimatedHours: course.estimatedHours || 1,
        isPublished: course.isPublished,
        hasCertificate: course.hasCertificate,
        coverImageUrl: course.coverImageUrl || "",
        prerequisites: course.prerequisites || "",
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
      
      // Navigate to appropriate view if published
      if (data.isPublished) {
        if (resultType === 'guide') {
          navigate('/guides');
        } else if (resultType === 'workshop') {
          navigate('/workshops');
        } else {
          navigate('/courses');
        }
      } else {
        // Navigate to admin content list
        navigate('/admin/content');
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
    saveMutation.mutate(data);
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
                  <Label htmlFor="description" className="text-white">Descripción *</Label>
                  <Textarea
                    id="description"
                    {...form.register("description")}
                    className="bg-slate-800 border-slate-600 text-white min-h-[100px]"
                    placeholder="Describe el contenido y objetivos del curso..."
                  />
                  {form.formState.errors.description && (
                    <p className="text-red-400 text-sm mt-1">{form.formState.errors.description.message}</p>
                  )}
                </div>

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