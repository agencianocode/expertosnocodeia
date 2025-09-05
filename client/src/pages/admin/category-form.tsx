import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import MobileHeader from "@/components/layout/mobile-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAdmin } from "@/hooks/useAdmin";

const categorySchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().min(1, "La descripción es requerida"),
  color: z.string().min(1, "El color es requerido"),
  icon: z.string().min(1, "El icono es requerido"),
});

type CategoryFormData = z.infer<typeof categorySchema>;

export default function CategoryForm() {
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      description: "",
      color: "#8b5cf6",
      icon: "BookOpen",
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al crear la categoría');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "¡Éxito!",
        description: "Categoría creada correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (adminLoading) {
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

  const onSubmit = (data: CategoryFormData) => {
    saveMutation.mutate(data);
  };

  const colorOptions = [
    { value: "#8b5cf6", label: "Púrpura", class: "bg-purple-500" },
    { value: "#3b82f6", label: "Azul", class: "bg-blue-500" },
    { value: "#10b981", label: "Verde", class: "bg-green-500" },
    { value: "#f59e0b", label: "Naranja", class: "bg-orange-500" },
    { value: "#ef4444", label: "Rojo", class: "bg-red-500" },
    { value: "#ec4899", label: "Rosa", class: "bg-pink-500" },
  ];

  const iconOptions = [
    { value: "BookOpen", label: "Libro" },
    { value: "Code", label: "Código" },
    { value: "Briefcase", label: "Negocios" },
    { value: "Users", label: "Usuarios" },
    { value: "Lightbulb", label: "Ideas" },
    { value: "Target", label: "Objetivo" },
    { value: "Zap", label: "Rayo" },
    { value: "Globe", label: "Mundo" },
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
          <h1 className="text-3xl font-bold text-white">Nueva Categoría</h1>
          <p className="text-gray-400 mt-1">Crea una nueva categoría para organizar los cursos</p>
        </div>
      </div>

      <div className="max-w-2xl">
        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Información de la Categoría</CardTitle>
            <CardDescription className="text-gray-400">
              Define los datos básicos de la nueva categoría
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-white">Nombre *</Label>
                <Input
                  id="name"
                  {...form.register("name")}
                  className="bg-slate-800 border-slate-600 text-white"
                  placeholder="Ej: Inteligencia Artificial"
                />
                {form.formState.errors.name && (
                  <p className="text-red-400 text-sm mt-1">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="description" className="text-white">Descripción *</Label>
                <Textarea
                  id="description"
                  {...form.register("description")}
                  className="bg-slate-800 border-slate-600 text-white"
                  placeholder="Describe el enfoque y contenido de esta categoría..."
                />
                {form.formState.errors.description && (
                  <p className="text-red-400 text-sm mt-1">{form.formState.errors.description.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="color" className="text-white">Color *</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {colorOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => form.setValue("color", option.value)}
                      className={`flex items-center gap-2 p-2 rounded border ${
                        form.watch("color") === option.value
                          ? "border-purple-400 bg-slate-700"
                          : "border-slate-600 hover:bg-slate-800"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded ${option.class}`}></div>
                      <span className="text-white text-sm">{option.label}</span>
                    </button>
                  ))}
                </div>
                {form.formState.errors.color && (
                  <p className="text-red-400 text-sm mt-1">{form.formState.errors.color.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="icon" className="text-white">Icono *</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {iconOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => form.setValue("icon", option.value)}
                      className={`flex items-center gap-2 p-2 rounded border text-left ${
                        form.watch("icon") === option.value
                          ? "border-purple-400 bg-slate-700"
                          : "border-slate-600 hover:bg-slate-800"
                      }`}
                    >
                      <span className="text-white text-sm">{option.label}</span>
                    </button>
                  ))}
                </div>
                {form.formState.errors.icon && (
                  <p className="text-red-400 text-sm mt-1">{form.formState.errors.icon.message}</p>
                )}
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {saveMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Crear Categoría
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
            </div>
          </div>
        </main>
      </div>
      
      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
}