import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save } from "lucide-react";
import { Link } from "wouter";

export default function SimpleCourseForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Estados del formulario
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    categoryId: "",
    type: "course",
    difficulty: "beginner",
    estimatedHours: 1,
    isPublished: false,
    hasCertificate: false,
    coverImageUrl: "",
    prerequisites: "",
  });

  // Cargar categorías
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: () => fetch("/api/categories").then(r => r.json()),
  });

  // Mutación para crear curso
  const createCourseMutation = useMutation({
    mutationFn: async (courseData: any) => {
      const response = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('simpleAuthToken')}`
        },
        body: JSON.stringify(courseData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error creando curso');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "¡Éxito!",
        description: "Curso creado correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      // Reset form
      setFormData({
        title: "",
        description: "",
        categoryId: "",
        type: "course",
        difficulty: "beginner",
        estimatedHours: 1,
        isPublished: false,
        hasCertificate: false,
        coverImageUrl: "",
        prerequisites: "",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "El título es requerido",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.description.trim()) {
      toast({
        title: "Error",
        description: "La descripción es requerida",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.categoryId) {
      toast({
        title: "Error",
        description: "La categoría es requerida",
        variant: "destructive",
      });
      return;
    }

    createCourseMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Obtener URL de subida
      const uploadResponse = await fetch('/api/admin/media/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileType: file.type })
      });
      
      if (!uploadResponse.ok) {
        throw new Error('Error obteniendo URL de subida');
      }
      
      const { uploadUrl } = await uploadResponse.json();
      
      // Subir archivo
      const uploadResult = await fetch(uploadUrl, {
        method: 'PUT',
        body: file
      });
      
      if (uploadResult.ok) {
        // Usar la URL de subida como URL de imagen
        handleInputChange('coverImageUrl', uploadUrl);
        toast({
          title: "¡Éxito!",
          description: "Imagen subida correctamente",
        });
      } else {
        throw new Error('Error subiendo imagen');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "No se pudo subir la imagen",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/simple-admin">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Crear Nuevo Curso</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Formulario principal */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Información Básica</CardTitle>
                  <CardDescription>
                    Datos principales del curso
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Título */}
                  <div>
                    <Label htmlFor="title">Título *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="Ej: IA para consultoría empresarial"
                      required
                    />
                  </div>

                  {/* Descripción */}
                  <div>
                    <Label htmlFor="description">Descripción *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Describe el contenido y objetivos del curso..."
                      className="min-h-[100px]"
                      required
                    />
                  </div>

                  {/* Prerrequisitos */}
                  <div>
                    <Label htmlFor="prerequisites">Prerrequisitos</Label>
                    <Textarea
                      id="prerequisites"
                      value={formData.prerequisites}
                      onChange={(e) => handleInputChange('prerequisites', e.target.value)}
                      placeholder="Conocimientos previos necesarios..."
                    />
                  </div>

                  {/* Imagen de portada */}
                  <div>
                    <Label htmlFor="coverImage">Imagen de Portada</Label>
                    <div className="space-y-3">
                      <Input
                        type="file"
                        id="coverImage"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="cursor-pointer"
                      />
                      
                      {/* URL manual */}
                      <Input
                        value={formData.coverImageUrl}
                        onChange={(e) => handleInputChange('coverImageUrl', e.target.value)}
                        placeholder="O pega una URL de imagen aquí"
                      />

                      {/* Preview */}
                      {formData.coverImageUrl && (
                        <div className="border rounded-lg p-3">
                          <Label className="text-sm mb-2 block">Vista Previa:</Label>
                          <img
                            src={formData.coverImageUrl}
                            alt="Preview"
                            className="w-full h-32 object-cover rounded-md"
                            onError={(e) => {
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

            {/* Configuración */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Configuración</CardTitle>
                  <CardDescription>
                    Opciones del curso
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Categoría */}
                  <div>
                    <Label htmlFor="categoryId">Categoría *</Label>
                    <Select 
                      value={formData.categoryId} 
                      onValueChange={(value) => handleInputChange('categoryId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoriesLoading ? (
                          <SelectItem value="" disabled>Cargando...</SelectItem>
                        ) : (
                          (categories as any)?.map((category: any) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Tipo */}
                  <div>
                    <Label htmlFor="type">Tipo *</Label>
                    <Select 
                      value={formData.type} 
                      onValueChange={(value) => handleInputChange('type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="course">Curso</SelectItem>
                        <SelectItem value="guide">Guía</SelectItem>
                        <SelectItem value="workshop">Taller</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Dificultad */}
                  <div>
                    <Label htmlFor="difficulty">Dificultad</Label>
                    <Select 
                      value={formData.difficulty} 
                      onValueChange={(value) => handleInputChange('difficulty', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona la dificultad" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Principiante</SelectItem>
                        <SelectItem value="intermediate">Intermedio</SelectItem>
                        <SelectItem value="advanced">Avanzado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Horas estimadas */}
                  <div>
                    <Label htmlFor="estimatedHours">Horas Estimadas *</Label>
                    <Input
                      id="estimatedHours"
                      type="number"
                      min="1"
                      value={formData.estimatedHours}
                      onChange={(e) => handleInputChange('estimatedHours', parseInt(e.target.value) || 1)}
                      required
                    />
                  </div>

                  {/* Opciones */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="isPublished">Publicado</Label>
                      <Switch
                        id="isPublished"
                        checked={formData.isPublished}
                        onCheckedChange={(checked) => handleInputChange('isPublished', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="hasCertificate">Certificado</Label>
                      <Switch
                        id="hasCertificate"
                        checked={formData.hasCertificate}
                        onCheckedChange={(checked) => handleInputChange('hasCertificate', checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3">
            <Link href="/simple-admin">
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </Link>
            <Button 
              type="submit" 
              disabled={createCourseMutation.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              {createCourseMutation.isPending ? "Creando..." : "Crear Curso"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
