import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import MobileHeader from "@/components/layout/mobile-header";
import { ObjectUploader } from "@/components/ObjectUploader";
import { useAdmin } from "@/hooks/useAdmin";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Save } from "lucide-react";

const promoBannerSchema = z.object({
  roomId: z.string().min(1, "La sala es requerida"),
  title: z.string().min(1, "El título es requerido"),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  backgroundImageUrl: z.string().optional(),
  backgroundColor: z.string().optional(),
  ctaText: z.string().optional(),
  ctaLink: z.string().optional(),
  displayAfterPhaseOrder: z.number().min(1, "El número de fase es requerido"),
  order: z.number().min(0).default(0),
  isActive: z.boolean().default(true),
});

type PromoBannerFormData = z.infer<typeof promoBannerSchema>;

export default function PromoBannerForm() {
  const [matchEdit, paramsEdit] = useRoute<{ id: string }>("/admin/promo-banners/:id/edit");
  const [matchNew] = useRoute("/admin/promo-banners/new");
  const [, setLocation] = useLocation();
  
  const isEditing = !!matchEdit;
  const bannerId = paramsEdit?.id;
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: rooms } = useQuery({
    queryKey: ["/api/rooms"],
  });

  const { data: banner, isLoading: bannerLoading } = useQuery({
    queryKey: ["/api/admin/promo-banners", bannerId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/admin/promo-banners/${bannerId}`);
      return await response.json();
    },
    enabled: isEditing && !!bannerId,
  });

  const form = useForm<PromoBannerFormData>({
    resolver: zodResolver(promoBannerSchema),
    defaultValues: {
      roomId: "",
      title: "",
      subtitle: "",
      description: "",
      backgroundImageUrl: "",
      backgroundColor: "from-orange-600 to-red-600",
      ctaText: "",
      ctaLink: "",
      displayAfterPhaseOrder: 1,
      order: 0,
      isActive: true,
    },
  });

  useEffect(() => {
    if (banner && isEditing) {
      form.reset({
        roomId: banner.roomId,
        title: banner.title,
        subtitle: banner.subtitle || "",
        description: banner.description || "",
        backgroundImageUrl: banner.backgroundImageUrl || "",
        backgroundColor: banner.backgroundColor || "from-orange-600 to-red-600",
        ctaText: banner.ctaText || "",
        ctaLink: banner.ctaLink || "",
        displayAfterPhaseOrder: banner.displayAfterPhaseOrder,
        order: banner.order || 0,
        isActive: banner.isActive !== undefined ? banner.isActive : true,
      });
    }
  }, [banner, isEditing, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: PromoBannerFormData) => {
      try {
        if (isEditing && bannerId) {
          const response = await apiRequest('PATCH', `/api/admin/promo-banners/${bannerId}`, data);
          return await response.json();
        } else {
          const response = await apiRequest('POST', '/api/admin/promo-banners', data);
          const result = await response.json();
          console.log('Banner creado:', result);
          return result;
        }
      } catch (error: any) {
        console.error('Error en mutationFn:', error);
        // apiRequest ya lanza el error, solo necesitamos propagarlo
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Banner guardado exitosamente:', data);
      // Invalidar todas las queries relacionadas
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promo-banners"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      // Invalidar todas las queries de salas (incluye /api/rooms/:slug)
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0] as string;
          return typeof key === 'string' && key.startsWith('/api/rooms');
        }
      });
      toast({
        title: isEditing ? "Banner actualizado" : "Banner creado",
        description: isEditing 
          ? "El banner ha sido actualizado exitosamente"
          : "El banner ha sido creado exitosamente",
      });
      setLocation("/admin/promo-banners");
    },
    onError: (error: any) => {
      console.error('Error guardando banner:', error);
      toast({
        title: "Error",
        description: error.message || (isEditing ? "No se pudo actualizar el banner" : "No se pudo crear el banner"),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PromoBannerFormData) => {
    saveMutation.mutate(data);
  };

  if (adminLoading || (isEditing && bannerLoading)) {
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

  return (
    <div className="min-h-screen bg-dark-bg text-white">
      <MobileHeader />
      
      <div className="flex">
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        
        <main className="flex-1 overflow-auto pb-20 lg:pb-0 lg:ml-[250px]">
          <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="mb-6">
              <Link href="/admin/promo-banners">
                <Button variant="ghost" className="mb-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver a Banners
                </Button>
              </Link>
              <h1 className="text-3xl font-bold text-white">
                {isEditing ? "Editar Banner" : "Nuevo Banner Promocional"}
              </h1>
              <p className="text-gray-400 mt-2">
                {isEditing 
                  ? "Modifica los detalles del banner promocional"
                  : "Crea un nuevo banner que se mostrará entre fases en las salas"}
              </p>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)}>
              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Información del Banner</CardTitle>
                  <CardDescription>
                    Configura los detalles del banner promocional
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Sala */}
                  <div>
                    <Label htmlFor="roomId" className="text-white">
                      Sala <span className="text-red-400">*</span>
                    </Label>
                    <select
                      id="roomId"
                      {...form.register("roomId")}
                      className="w-full mt-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Selecciona una sala</option>
                      {(rooms as any)?.map((room: any) => (
                        <option key={room.id} value={room.id}>
                          {room.title}
                        </option>
                      ))}
                    </select>
                    {form.formState.errors.roomId && (
                      <p className="text-red-400 text-sm mt-1">{form.formState.errors.roomId.message}</p>
                    )}
                  </div>

                  {/* Título */}
                  <div>
                    <Label htmlFor="title" className="text-white">
                      Título <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="title"
                      {...form.register("title")}
                      className="mt-2 bg-slate-800 border-slate-700 text-white"
                      placeholder="Ej: Trilhas Especialistas"
                    />
                    {form.formState.errors.title && (
                      <p className="text-red-400 text-sm mt-1">{form.formState.errors.title.message}</p>
                    )}
                  </div>

                  {/* Subtítulo */}
                  <div>
                    <Label htmlFor="subtitle" className="text-white">
                      Subtítulo
                    </Label>
                    <Input
                      id="subtitle"
                      {...form.register("subtitle")}
                      className="mt-2 bg-slate-800 border-slate-700 text-white"
                      placeholder="Ej: Expanda seu aprendizado"
                    />
                  </div>

                  {/* Descripción */}
                  <div>
                    <Label htmlFor="description" className="text-white">
                      Descripción
                    </Label>
                    <Textarea
                      id="description"
                      {...form.register("description")}
                      className="mt-2 bg-slate-800 border-slate-700 text-white"
                      placeholder="Descripción del banner..."
                      rows={4}
                    />
                  </div>

                  {/* Imagen de fondo */}
                  <div>
                    <Label htmlFor="backgroundImageUrl" className="text-white">
                      Imagen de Fondo
                    </Label>
                    <div className="mt-2 space-y-2">
                      <Input
                        id="backgroundImageUrl"
                        {...form.register("backgroundImageUrl")}
                        className="bg-slate-800 border-slate-700 text-white"
                        placeholder="https://ejemplo.com/imagen.jpg o sube una imagen"
                      />
                      <div className="flex gap-2">
                        <ObjectUploader
                          maxNumberOfFiles={1}
                          maxFileSize={5242880} // 5MB
                          accept="image/*"
                          onGetUploadParameters={async () => {
                            const response = await apiRequest('POST', '/api/admin/media/upload-url', { fileType: 'image/jpeg' });
                            const { uploadURL } = await response.json();
                            return { method: 'PUT' as const, url: uploadURL };
                          }}
                          onComplete={async (result: Array<{ uploadURL: string; name: string }>) => {
                            if (result?.[0]) {
                              const uploadUrl = result[0].uploadURL;
                              const imageUrl = uploadUrl?.split('?')[0]; // Remove query params
                              
                              try {
                                const response = await apiRequest('POST', '/api/admin/media/normalize-path', { url: imageUrl });
                                const { normalizedPath } = await response.json();
                                form.setValue("backgroundImageUrl", normalizedPath || "");
                              } catch (error) {
                                console.error('Error normalizing path:', error);
                                form.setValue("backgroundImageUrl", imageUrl || "");
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
                        {form.watch("backgroundImageUrl") && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => form.setValue("backgroundImageUrl", "")}
                            className="text-red-400 hover:text-red-300"
                          >
                            Limpiar
                          </Button>
                        )}
                      </div>
                      {form.watch("backgroundImageUrl") && (
                        <div className="mt-2">
                          <img 
                            src={form.watch("backgroundImageUrl")} 
                            alt="Preview" 
                            className="max-w-full h-32 object-cover rounded-lg border border-slate-700"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      <p className="text-gray-400 text-xs">
                        Si no se proporciona, se usará el color de fondo
                      </p>
                    </div>
                  </div>

                  {/* Color de fondo */}
                  <div>
                    <Label htmlFor="backgroundColor" className="text-white">
                      Color de Fondo (Gradiente Tailwind)
                    </Label>
                    <Input
                      id="backgroundColor"
                      {...form.register("backgroundColor")}
                      className="mt-2 bg-slate-800 border-slate-700 text-white"
                      placeholder="from-orange-600 to-red-600"
                    />
                    <p className="text-gray-400 text-xs mt-1">
                      Ejemplos: from-orange-600 to-red-600, from-blue-500 to-purple-600
                    </p>
                  </div>

                  {/* CTA Text */}
                  <div>
                    <Label htmlFor="ctaText" className="text-white">
                      Texto del Botón CTA
                    </Label>
                    <Input
                      id="ctaText"
                      {...form.register("ctaText")}
                      className="mt-2 bg-slate-800 border-slate-700 text-white"
                      placeholder="Ej: Explorar ahora"
                    />
                  </div>

                  {/* CTA Link */}
                  <div>
                    <Label htmlFor="ctaLink" className="text-white">
                      Enlace del Botón CTA
                    </Label>
                    <Input
                      id="ctaLink"
                      {...form.register("ctaLink")}
                      className="mt-2 bg-slate-800 border-slate-700 text-white"
                      placeholder="/ruta-o-url"
                    />
                  </div>

                  {/* Display After Phase Order */}
                  <div>
                    <Label htmlFor="displayAfterPhaseOrder" className="text-white">
                      Mostrar después de la Fase <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="displayAfterPhaseOrder"
                      type="number"
                      {...form.register("displayAfterPhaseOrder", { valueAsNumber: true })}
                      className="mt-2 bg-slate-800 border-slate-700 text-white"
                      min={1}
                    />
                    {form.formState.errors.displayAfterPhaseOrder && (
                      <p className="text-red-400 text-sm mt-1">{form.formState.errors.displayAfterPhaseOrder.message}</p>
                    )}
                    <p className="text-gray-400 text-xs mt-1">
                      El banner se mostrará después de esta fase (ej: 3 = después de la Fase 3)
                    </p>
                  </div>

                  {/* Order */}
                  <div>
                    <Label htmlFor="order" className="text-white">
                      Orden
                    </Label>
                    <Input
                      id="order"
                      type="number"
                      {...form.register("order", { valueAsNumber: true })}
                      className="mt-2 bg-slate-800 border-slate-700 text-white"
                      min={0}
                    />
                    <p className="text-gray-400 text-xs mt-1">
                      Orden de visualización (menor número = primero)
                    </p>
                  </div>

                  {/* Is Active */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      {...form.register("isActive")}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-purple-600 focus:ring-purple-500"
                    />
                    <Label htmlFor="isActive" className="text-white cursor-pointer">
                      Banner activo
                    </Label>
                  </div>

                  {/* Submit Button */}
                  <div className="flex gap-4 pt-4">
                    <Button
                      type="submit"
                      disabled={saveMutation.isPending}
                      className="flex-1"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {saveMutation.isPending 
                        ? (isEditing ? "Guardando..." : "Creando...") 
                        : (isEditing ? "Guardar Cambios" : "Crear Banner")}
                    </Button>
                    <Link href="/admin/promo-banners">
                      <Button type="button" variant="outline">
                        Cancelar
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </form>
          </div>
        </main>
      </div>

      <MobileNav />
    </div>
  );
}

