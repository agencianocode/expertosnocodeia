import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Trash2, Save, Eye, Upload, X, FileText, Download } from "lucide-react";
import { ObjectUploader } from "@/components/ObjectUploader";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import MobileHeader from "@/components/layout/mobile-header";
import { useAdmin } from "@/hooks/useAdmin";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Schema for workshop with timestamps
const workshopSchema = z.object({
  title: z.string().min(1, "El título es requerido"),
  description: z.string().min(1, "La descripción es requerida"),
  categoryIds: z.array(z.string()).min(1, "Selecciona al menos una categoría"),
  coverImageUrl: z.string().optional(),
  videoUrl: z.string().url("URL de video inválida").optional(),
  duration: z.string().min(1, "La duración es requerida"),
  participants: z.number().min(0, "Número de participantes inválido"),
  rating: z.number().min(0).max(5, "Calificación debe estar entre 0 y 5"),
  instructor: z.object({
    name: z.string().min(1, "Nombre del instructor requerido"),
    title: z.string().min(1, "Título del instructor requerido"),
    avatar: z.string().optional()
  }),
  recordedDate: z.string().min(1, "Fecha de grabación requerida"),
  status: z.enum(["draft", "published"]),
  timestamps: z.array(z.object({
    time: z.string().min(1, "Tiempo requerido"),
    description: z.string().min(1, "Descripción requerida")
  })).default([])
});

// Schema for new category
const newCategorySchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  color: z.string().min(1, "El color es requerido"),
  icon: z.string().min(1, "El icono es requerido")
});

type WorkshopFormData = z.infer<typeof workshopSchema>;
type NewCategoryData = z.infer<typeof newCategorySchema>;

export default function WorkshopEditor() {
  const [match, params] = useRoute("/admin/workshops/:action/:id?");
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const [timestamps, setTimestamps] = useState<Array<{ time: string; description: string }>>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [resources, setResources] = useState<Array<{ id?: string; title: string; description: string; fileUrl: string; fileName: string; fileType: string; fileSize?: number }>>([]);
  const [showNewCategoryDialog, setShowNewCategoryDialog] = useState(false);
  const [newCategoryForm, setNewCategoryForm] = useState<NewCategoryData>({ name: "", description: "", color: "purple", icon: "BookOpen" });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const isEditing = params?.action === "edit" && params?.id;
  const workshopId = params?.id;

  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
  });

  const { data: workshop, isLoading: workshopLoading } = useQuery({
    queryKey: ["/api/admin/courses", workshopId],
    enabled: !!workshopId,
  });

  const { data: workshopResources } = useQuery({
    queryKey: ["/api/resources", workshopId],
    enabled: !!workshopId,
  });

  const form = useForm<WorkshopFormData>({
    resolver: zodResolver(workshopSchema),
    defaultValues: {
      title: "",
      description: "",
      categoryIds: [],
      coverImageUrl: "",
      videoUrl: "",
      duration: "",
      participants: 0,
      rating: 0,
      instructor: {
        name: "Fabián Segura",
        title: "Instructor",
        avatar: ""
      },
      recordedDate: "",
      status: "draft",
      timestamps: []
    }
  });

  // Set form values when workshop data is loaded
  useEffect(() => {
    if (workshop && isEditing) {
      const workshopData = workshop as any;
      const categoryIds = Array.isArray(workshopData.categoryIds) ? workshopData.categoryIds : 
                         workshopData.categoryId ? [workshopData.categoryId] : [];
      
      const formData = {
        title: workshopData.title || "",
        description: workshopData.description || "",
        categoryIds,
        coverImageUrl: workshopData.coverImageUrl || "",
        videoUrl: workshopData.videoUrl || "",
        duration: workshopData.duration || "60 min",
        participants: workshopData.participants || 0,
        rating: workshopData.rating || 0,
        instructor: {
          name: workshopData.instructorName || workshopData.instructor?.name || "Fabián Segura",
          title: workshopData.instructorBio || workshopData.instructor?.title || "Instructor",
          avatar: workshopData.instructorAvatar || workshopData.instructor?.avatar || ""
        },
        recordedDate: workshopData.recordedDate || "",
        status: workshopData.status || "published",
        timestamps: workshopData.timestamps || []
      };
      
      console.log('Loading workshop data into form:', formData);
      form.reset(formData);
      setTimestamps(workshopData.timestamps || []);
      setSelectedCategories(categoryIds);
    }
  }, [workshop, isEditing, form]);

  // Set resources when loaded
  useEffect(() => {
    if (workshopResources) {
      setResources((workshopResources as any) || []);
    }
  }, [workshopResources]);

  const saveWorkshop = useMutation({
    mutationFn: async (data: WorkshopFormData) => {
      // Transform instructor data to match backend expectations
      const workshopData = {
        ...data,
        type: "workshop",
        timestamps,
        categoryIds: selectedCategories,
        instructorName: data.instructor.name,
        instructorBio: data.instructor.title,
        instructorAvatar: data.instructor.avatar,
        // Remove nested instructor object
        instructor: undefined
      };

      console.log('Sending workshop data:', workshopData);

      if (isEditing) {
        return await apiRequest("PUT", `/api/admin/courses/${workshopId}`, workshopData);
      } else {
        return await apiRequest("POST", "/api/admin/courses", workshopData);
      }
    },
    onSuccess: () => {
      toast({
        title: isEditing ? "Taller actualizado" : "Taller creado",
        description: "Los cambios han sido guardados exitosamente"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar el taller",
        variant: "destructive"
      });
    }
  });

  const createCategory = useMutation({
    mutationFn: async (categoryData: NewCategoryData) => {
      return await apiRequest("POST", "/api/admin/categories", categoryData);
    },
    onSuccess: (newCategory: any) => {
      toast({
        title: "Categoría creada",
        description: "La nueva categoría se ha creado exitosamente"
      });
      setSelectedCategories([...selectedCategories, newCategory.id]);
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setShowNewCategoryDialog(false);
      setNewCategoryForm({ name: "", description: "", color: "purple", icon: "BookOpen" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la categoría",
        variant: "destructive"
      });
    }
  });

  const saveResource = useMutation({
    mutationFn: async (resourceData: any) => {
      return await apiRequest("POST", "/api/resources", {
        ...resourceData,
        courseId: workshopId // Use courseId for workshops
      });
    },
    onSuccess: () => {
      toast({
        title: "Recurso guardado",
        description: "El recurso se ha guardado exitosamente"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/resources", workshopId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar el recurso",
        variant: "destructive"
      });
    }
  });

  const deleteResource = useMutation({
    mutationFn: async (resourceId: string) => {
      return await apiRequest("DELETE", `/api/resources/${resourceId}`);
    },
    onSuccess: () => {
      toast({
        title: "Recurso eliminado",
        description: "El recurso se ha eliminado exitosamente"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/resources", workshopId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el recurso",
        variant: "destructive"
      });
    }
  });

  const addTimestamp = () => {
    setTimestamps([...timestamps, { time: "", description: "" }]);
  };

  const removeTimestamp = (index: number) => {
    setTimestamps(timestamps.filter((_, i) => i !== index));
  };

  const updateTimestamp = (index: number, field: "time" | "description", value: string) => {
    const updated = timestamps.map((timestamp, i) =>
      i === index ? { ...timestamp, [field]: value } : timestamp
    );
    setTimestamps(updated);
  };

  const handleCategoryToggle = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      setSelectedCategories(selectedCategories.filter(id => id !== categoryId));
    } else {
      setSelectedCategories([...selectedCategories, categoryId]);
    }
  };

  const handleResourceUpload = async (fileUrl: string, fileName: string) => {
    if (!fileUrl || !fileName) {
      console.error('Invalid file data:', { fileUrl, fileName });
      return;
    }

    try {
      // Normalize the URL to make it accessible via API
      const response = await apiRequest("POST", "/api/admin/media/normalize-path", {
        url: fileUrl
      });
      const data = await response.json();
      
      const resourceData = {
        title: fileName,
        description: `Recurso del taller: ${fileName}`,
        fileUrl: data.normalizedPath,
        fileName,
        fileType: fileName.split('.').pop() || 'unknown',
        fileSize: 0
      };
      
      saveResource.mutate(resourceData);
    } catch (error) {
      console.error('Error normalizing resource path:', error);
      // Fallback to original URL
      const resourceData = {
        title: fileName,
        description: `Recurso del taller: ${fileName}`,
        fileUrl,
        fileName,
        fileType: fileName.split('.').pop() || 'unknown',
        fileSize: 0
      };
      
      saveResource.mutate(resourceData);
    }
  };

  const onSubmit = (data: WorkshopFormData) => {
    const submitData = {
      ...data,
      timestamps,
      categoryIds: selectedCategories,
      instructorName: data.instructor.name,
      instructorBio: data.instructor.title,
      instructorAvatar: data.instructor.avatar
    };
    console.log('Sending workshop data:', submitData);
    saveWorkshop.mutate(submitData);
  };

  if (adminLoading || (isEditing && workshopLoading)) {
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
        <p className="text-gray-600">No tienes permisos para acceder a esta página.</p>
        <Link href="/">
          <Button>Volver al inicio</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg text-white">
      {/* Mobile Navigation */}
      <div className="lg:hidden">
        <MobileHeader />
        <MobileNav />
      </div>

      <div className="lg:flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block lg:w-[250px] lg:fixed lg:inset-y-0 lg:z-50">
          <Sidebar />
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-auto pb-20 lg:pb-0 lg:ml-[250px]">
          <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <Link href="/admin/content">
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Volver a contenido
                  </Button>
                </Link>
                <div>
                  <h1 className="text-3xl font-bold">
                    {isEditing ? "Editar Taller" : "Crear Nuevo Taller"}
                  </h1>
                  <p className="text-gray-400 mt-1">
                    {isEditing ? "Modifica la información del taller" : "Crea un nuevo taller para la plataforma"}
                  </p>
                </div>
              </div>

              <div className="flex space-x-3">
                {isEditing && (
                  <Link href={`/taller/${workshopId}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      Vista previa
                    </Button>
                  </Link>
                )}
                <Button 
                  onClick={form.handleSubmit(onSubmit)}
                  disabled={saveWorkshop.isPending}
                  className="bg-purple-accent hover:bg-purple-accent/90"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saveWorkshop.isPending ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </div>

            <Form {...form}>
              <form className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  
                  {/* Main Information */}
                  <div className="lg:col-span-2 space-y-6">
                    
                    {/* Basic Info Card */}
                    <Card className="bg-dark-card border-dark-border">
                      <CardHeader>
                        <CardTitle>Información Básica</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <FormField
                          control={form.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Título del Taller</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  placeholder="Ej: Dominando los agentes de IA para el servicio al cliente..."
                                  className="bg-dark-bg border-dark-border"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Descripción</FormLabel>
                              <FormControl>
                                <Textarea 
                                  {...field}
                                  placeholder="Describe el contenido del taller..."
                                  className="bg-dark-bg border-dark-border min-h-[100px]"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Categories Selection */}
                        <FormField
                          control={form.control}
                          name="categoryIds"
                          render={() => (
                            <FormItem>
                              <div className="flex items-center justify-between">
                                <FormLabel>Categorías</FormLabel>
                                <Dialog open={showNewCategoryDialog} onOpenChange={setShowNewCategoryDialog}>
                                  <DialogTrigger asChild>
                                    <Button type="button" variant="outline" size="sm">
                                      <Plus className="w-4 h-4 mr-2" />
                                      Nueva Categoría
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="bg-dark-card border-dark-border">
                                    <DialogHeader>
                                      <DialogTitle>Crear Nueva Categoría</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <Input
                                        placeholder="Nombre de la categoría"
                                        value={newCategoryForm.name}
                                        onChange={(e) => setNewCategoryForm({...newCategoryForm, name: e.target.value})}
                                        className="bg-dark-bg border-dark-border"
                                      />
                                      <Input
                                        placeholder="Descripción (opcional)"
                                        value={newCategoryForm.description}
                                        onChange={(e) => setNewCategoryForm({...newCategoryForm, description: e.target.value})}
                                        className="bg-dark-bg border-dark-border"
                                      />
                                      <div className="grid grid-cols-2 gap-4">
                                        <Select onValueChange={(value) => setNewCategoryForm({...newCategoryForm, color: value})}>
                                          <SelectTrigger className="bg-dark-bg border-dark-border">
                                            <SelectValue placeholder="Color" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="purple">Morado</SelectItem>
                                            <SelectItem value="blue">Azul</SelectItem>
                                            <SelectItem value="green">Verde</SelectItem>
                                            <SelectItem value="orange">Naranja</SelectItem>
                                            <SelectItem value="red">Rojo</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <Select onValueChange={(value) => setNewCategoryForm({...newCategoryForm, icon: value})}>
                                          <SelectTrigger className="bg-dark-bg border-dark-border">
                                            <SelectValue placeholder="Icono" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="BookOpen">Libro</SelectItem>
                                            <SelectItem value="Code2">Código</SelectItem>
                                            <SelectItem value="Building2">Empresa</SelectItem>
                                            <SelectItem value="BarChart3">Gráfico</SelectItem>
                                            <SelectItem value="Settings">Configuración</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="flex space-x-3">
                                        <Button 
                                          type="button"
                                          onClick={() => createCategory.mutate(newCategoryForm)}
                                          disabled={createCategory.isPending || !newCategoryForm.name}
                                          className="flex-1"
                                        >
                                          {createCategory.isPending ? "Creando..." : "Crear"}
                                        </Button>
                                        <Button type="button" variant="outline" onClick={() => setShowNewCategoryDialog(false)}>
                                          Cancelar
                                        </Button>
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </div>
                              <div className="grid grid-cols-2 gap-2 mt-2 max-h-32 overflow-y-auto">
                                {(categories as any)?.map((category: any) => (
                                  <div key={category.id} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={category.id}
                                      checked={selectedCategories.includes(category.id)}
                                      onCheckedChange={() => {
                                        handleCategoryToggle(category.id);
                                        // Update form value
                                        const newCategories = selectedCategories.includes(category.id) 
                                          ? selectedCategories.filter(id => id !== category.id)
                                          : [...selectedCategories, category.id];
                                        form.setValue('categoryIds', newCategories);
                                      }}
                                    />
                                    <label htmlFor={category.id} className="text-sm text-gray-300 cursor-pointer">
                                      {category.name}
                                    </label>
                                  </div>
                                ))}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="status"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Estado</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="bg-dark-bg border-dark-border">
                                    <SelectValue placeholder="Estado del taller" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="draft">Borrador</SelectItem>
                                  <SelectItem value="published">Publicado</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>

                    {/* Video & Technical Info */}
                    <Card className="bg-dark-card border-dark-border">
                      <CardHeader>
                        <CardTitle>Información del Video</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <FormField
                          control={form.control}
                          name="videoUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>URL del Video</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field}
                                  placeholder="https://youtube.com/embed/..."
                                  className="bg-dark-bg border-dark-border"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <FormField
                            control={form.control}
                            name="duration"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Duración</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field}
                                    placeholder="60 min"
                                    className="bg-dark-bg border-dark-border"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="participants"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Participantes</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field}
                                    type="number"
                                    placeholder="125"
                                    className="bg-dark-bg border-dark-border"
                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="rating"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Calificación</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field}
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="5"
                                    placeholder="4.8"
                                    className="bg-dark-bg border-dark-border"
                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="recordedDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Fecha de Grabación</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field}
                                  type="date"
                                  className="bg-dark-bg border-dark-border"
                                  onChange={(e) => {
                                    // Convert date to friendly Spanish format for display
                                    if (e.target.value) {
                                      const date = new Date(e.target.value + 'T00:00:00');
                                      const options = { 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric' 
                                      } as const;
                                      const formattedDate = date.toLocaleDateString('es-ES', options);
                                      field.onChange(formattedDate);
                                    } else {
                                      field.onChange('');
                                    }
                                  }}
                                  value={
                                    field.value ? 
                                      // Convert back to YYYY-MM-DD for input
                                      (() => {
                                        try {
                                          const dateStr = field.value.toLowerCase();
                                          const months = {
                                            'enero': '01', 'febrero': '02', 'marzo': '03',
                                            'abril': '04', 'mayo': '05', 'junio': '06',
                                            'julio': '07', 'agosto': '08', 'septiembre': '09',
                                            'octubre': '10', 'noviembre': '11', 'diciembre': '12'
                                          };
                                          const match = dateStr.match(/(\d+) de (\w+) de (\d+)/);
                                          if (match) {
                                            const [, day, monthName, year] = match;
                                            const month = months[monthName as keyof typeof months];
                                            if (month) {
                                              return `${year}-${month}-${day.padStart(2, '0')}`;
                                            }
                                          }
                                        } catch (e) {
                                          console.log('Date conversion error:', e);
                                        }
                                        return '';
                                      })()
                                      : ''
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                              {field.value && (
                                <p className="text-sm text-gray-400 mt-1">
                                  Se mostrará como: {field.value}
                                </p>
                              )}
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>

                    {/* Timestamps Card */}
                    <Card className="bg-dark-card border-dark-border">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle>Marcas de Tiempo</CardTitle>
                          <Button 
                            type="button"
                            onClick={addTimestamp}
                            size="sm"
                            className="bg-purple-accent hover:bg-purple-accent/90"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Agregar
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {timestamps.map((timestamp, index) => (
                            <div key={index} className="flex items-start space-x-3 p-4 bg-dark-bg rounded-lg border border-dark-border">
                              <Input
                                placeholder="[00:00]"
                                value={timestamp.time}
                                onChange={(e) => updateTimestamp(index, "time", e.target.value)}
                                className="w-24 bg-gray-800 border-gray-600 font-mono"
                              />
                              <Input
                                placeholder="Descripción de lo que ocurre en este momento..."
                                value={timestamp.description}
                                onChange={(e) => updateTimestamp(index, "description", e.target.value)}
                                className="flex-1 bg-gray-800 border-gray-600"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeTimestamp(index)}
                                className="text-red-400 hover:text-red-300"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                          
                          {timestamps.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                              <p>No hay marcas de tiempo definidas.</p>
                              <p className="text-sm">Haz clic en "Agregar" para crear la primera marca de tiempo.</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                  </div>

                  {/* Sidebar Info */}
                  <div className="space-y-6">
                    
                    {/* Instructor Info */}
                    <Card className="bg-dark-card border-dark-border">
                      <CardHeader>
                        <CardTitle>Instructor</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <FormField
                          control={form.control}
                          name="instructor.name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nombre</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field}
                                  className="bg-dark-bg border-dark-border"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="instructor.title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Título</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field}
                                  placeholder="Instructor"
                                  className="bg-dark-bg border-dark-border"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="instructor.avatar"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Avatar del Instructor</FormLabel>
                              <div className="space-y-3">
                                <ObjectUploader
                                  maxNumberOfFiles={1}
                                  maxFileSize={2 * 1024 * 1024} // 2MB
                                  onGetUploadParameters={async () => {
                                    try {
                                      const response = await apiRequest("POST", "/api/lesson-resources/upload-url", {
                                        fileName: `avatar-${Date.now()}.jpg`
                                      });
                                      const data = await response.json();
                                      console.log('Avatar upload URL response:', data);
                                      return {
                                        method: "PUT" as const,
                                        url: data.uploadURL
                                      };
                                    } catch (error) {
                                      console.error('Error getting avatar upload URL:', error);
                                      throw error;
                                    }
                                  }}
                                  onComplete={async (files) => {
                                    if (files && files[0]) {
                                      const fileUrl = files[0].uploadURL;
                                      try {
                                        // Normalize the URL to make it accessible via API
                                        const response = await apiRequest("POST", "/api/admin/media/normalize-path", {
                                          url: fileUrl
                                        });
                                        const data = await response.json();
                                        field.onChange(data.normalizedPath);
                                        toast({
                                          title: "Avatar subido",
                                          description: "El avatar del instructor se ha subido exitosamente"
                                        });
                                      } catch (error) {
                                        console.error('Error normalizing path:', error);
                                        field.onChange(fileUrl);
                                        toast({
                                          title: "Avatar subido",
                                          description: "El avatar del instructor se ha subido exitosamente"
                                        });
                                      }
                                    }
                                  }}
                                  accept="image/*"
                                  buttonClassName="w-full"
                                >
                                  <Upload className="w-4 h-4 mr-2" />
                                  Subir Avatar
                                </ObjectUploader>
                                
                                {field.value && (
                                  <div className="flex items-center justify-center">
                                    <img
                                      src={field.value}
                                      alt="Avatar del instructor"
                                      className="w-16 h-16 rounded-full object-cover border-2 border-gray-600"
                                    />
                                  </div>
                                )}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>

                    {/* Cover Image */}
                    <Card className="bg-dark-card border-dark-border">
                      <CardHeader>
                        <CardTitle>Imagen de Portada</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <ObjectUploader
                          maxNumberOfFiles={1}
                          maxFileSize={5 * 1024 * 1024} // 5MB
                          onGetUploadParameters={async () => {
                            try {
                              const response = await apiRequest("POST", "/api/lesson-resources/upload-url", {
                                fileName: `cover-${Date.now()}.jpg`
                              });
                              const data = await response.json();
                              console.log('Upload URL response:', data);
                              return {
                                method: "PUT" as const,
                                url: data.uploadURL
                              };
                            } catch (error) {
                              console.error('Error getting upload URL:', error);
                              throw error;
                            }
                          }}
                          onComplete={async (files) => {
                            if (files && files[0]) {
                              const fileUrl = files[0].uploadURL;
                              try {
                                // Normalize the URL to make it accessible via API
                                const response = await apiRequest("POST", "/api/admin/media/normalize-path", {
                                  url: fileUrl
                                });
                                const data = await response.json();
                                form.setValue("coverImageUrl", data.normalizedPath);
                                toast({
                                  title: "Imagen subida",
                                  description: "La imagen de portada se ha subido exitosamente"
                                });
                              } catch (error) {
                                console.error('Error normalizing path:', error);
                                form.setValue("coverImageUrl", fileUrl);
                                toast({
                                  title: "Imagen subida",
                                  description: "La imagen de portada se ha subido exitosamente"
                                });
                              }
                            }
                          }}
                          accept="image/*"
                          buttonClassName="w-full"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Subir Imagen de Portada
                        </ObjectUploader>
                        
                        {form.watch("coverImageUrl") && (
                          <div className="mt-4">
                            <img
                              src={form.watch("coverImageUrl")}
                              alt="Vista previa"
                              className="w-full h-32 object-cover rounded-lg"
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Resources */}
                    <Card className="bg-dark-card border-dark-border">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle>Recursos del Taller</CardTitle>
                          <ObjectUploader
                            maxNumberOfFiles={5}
                            maxFileSize={10 * 1024 * 1024} // 10MB
                            onGetUploadParameters={async () => {
                              try {
                                const response = await apiRequest("POST", "/api/lesson-resources/upload-url", {
                                  fileName: `resource-${Date.now()}.pdf`
                                });
                                const data = await response.json();
                                console.log('Resource upload URL response:', data);
                                return {
                                  method: "PUT" as const,
                                  url: data.uploadURL
                                };
                              } catch (error) {
                                console.error('Error getting resource upload URL:', error);
                                throw error;
                              }
                            }}
                            onComplete={(files) => {
                              files?.forEach((file) => {
                                handleResourceUpload(file.uploadURL, file.name);
                              });
                            }}
                            accept="application/pdf,.pdf,.doc,.docx,.txt,.zip"
                            buttonClassName="bg-green-600 hover:bg-green-700"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Subir Recursos
                          </ObjectUploader>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {resources.map((resource, index) => (
                            <div key={resource.id || index} className="flex items-center justify-between p-3 bg-dark-bg rounded-lg border border-dark-border">
                              <div className="flex items-center space-x-3">
                                <FileText className="w-5 h-5 text-blue-400" />
                                <div>
                                  <p className="text-sm font-medium text-white">{resource.title}</p>
                                  <p className="text-xs text-gray-400">{resource.fileName}</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <a
                                  href={resource.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 hover:text-blue-300"
                                >
                                  <Download className="w-4 h-4" />
                                </a>
                                {resource.id && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteResource.mutate(resource.id!)}
                                    className="text-red-400 hover:text-red-300"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                          
                          {resources.length === 0 && (
                            <div className="text-center py-6 text-gray-500">
                              <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">No hay recursos subidos.</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                  </div>

                </div>
              </form>
            </Form>

          </div>
        </main>
      </div>
    </div>
  );
}