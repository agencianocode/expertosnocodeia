import { useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
import { ObjectUploader } from "@/components/ObjectUploader";
import { ArrowLeft, Save, Eye, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAdmin } from "@/hooks/useAdmin";
import { apiRequest } from "@/lib/queryClient";

const roomFormSchema = z.object({
  title: z.string().min(1, "El título es requerido").optional().or(z.literal("")),
  slug: z.string().optional().or(z.literal("")).refine((val) => !val || /^[a-z0-9-]+$/.test(val), {
    message: "El slug solo puede contener letras minúsculas, números y guiones"
  }),
  description: z.string().optional().or(z.literal("")),
  shortDescription: z.string().optional().or(z.literal("")).refine((val) => !val || val.length <= 500, {
    message: "La descripción corta no puede exceder 500 caracteres"
  }),
  coverImageUrl: z.string().optional().or(z.literal("")),
  heroImageUrl: z.string().optional().or(z.literal("")),
  order: z.number().min(0).optional(),
  isPublished: z.boolean().optional(),
  price: z.number().min(0).optional(),
  currency: z.string().optional().or(z.literal("")),
}).refine((data) => Object.values(data).some(v => v !== undefined && v !== ""), {
  message: "Al menos un campo debe ser actualizado"
});

type RoomFormData = z.infer<typeof roomFormSchema>;

export default function RoomForm() {
  const [matchEdit, paramsEdit] = useRoute<{ id: string }>("/admin/rooms/:id/edit");
  
  if (!matchEdit) {
    return null;
  }
  
  const roomId = paramsEdit?.id;
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  const { data: room, isLoading: roomLoading } = useQuery({
    queryKey: ["/api/rooms", roomId],
    queryFn: async () => {
      if (!roomId) return null;
      const response = await apiRequest('GET', `/api/rooms`);
      const rooms = await response.json();
      return rooms.find((r: any) => r.id === roomId);
    },
    enabled: !!roomId,
  });

  const form = useForm<RoomFormData>({
    resolver: zodResolver(roomFormSchema),
    defaultValues: {
      title: "",
      slug: "",
      description: "",
      shortDescription: "",
      coverImageUrl: "",
      heroImageUrl: "",
      order: 0,
      isPublished: true,
      price: 0,
      currency: "usd",
    },
  });

  useEffect(() => {
    if (room) {
      form.reset({
        title: room.title,
        slug: room.slug,
        description: room.description || "",
        shortDescription: room.shortDescription || "",
        coverImageUrl: room.coverImageUrl || "",
        heroImageUrl: room.heroImageUrl || "",
        order: room.order || 0,
        isPublished: room.isPublished ?? true,
        price: room.price || 0,
        currency: room.currency || "usd",
      });
    }
  }, [room, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: RoomFormData) => {
      // Filter out empty/undefined values to send only changed fields
      const updateData = Object.entries(data).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== "") {
          acc[key] = value;
        }
        return acc;
      }, {} as any);
      
      const response = await apiRequest('PATCH', `/api/admin/rooms/${roomId}`, updateData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "¡Éxito!",
        description: "Sala actualizada correctamente",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rooms", roomId] });
      
      navigate("/admin/rooms");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la sala",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RoomFormData) => {
    saveMutation.mutate(data);
  };

  if (adminLoading || roomLoading) {
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

  if (!room) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <h1 className="text-2xl font-bold text-red-500">Sala no encontrada</h1>
        <Link href="/admin/rooms">
          <Button>Volver a Salas</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <MobileHeader />
      
      <div className="flex">
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        
        <main className="flex-1 overflow-auto pb-20 lg:pb-0 lg:ml-[250px]">
          <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-white">Editar Sala</h1>
                <p className="text-gray-400 mt-2">
                  Actualiza la información y banner de la sala
                </p>
              </div>
              <div className="flex gap-2">
                <Link href={`/sala/${room.slug}`}>
                  <Button variant="outline" size="sm" data-testid="button-preview-room">
                    <Eye className="h-4 w-4 mr-1" />
                    Vista previa
                  </Button>
                </Link>
                <Link href="/admin/rooms">
                  <Button variant="ghost" size="sm" data-testid="button-back-to-rooms">
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Volver
                  </Button>
                </Link>
              </div>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-6">
                  <Card className="bg-slate-900/50 border-slate-700">
                    <CardHeader>
                      <CardTitle>Información Básica</CardTitle>
                      <CardDescription>Datos principales de la sala</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="title" className="text-white">Título *</Label>
                        <Input
                          id="title"
                          {...form.register("title")}
                          className="bg-slate-800 border-slate-700 text-white mt-1"
                          data-testid="input-room-title"
                        />
                        {form.formState.errors.title && (
                          <p className="text-sm text-red-400 mt-1">{form.formState.errors.title.message}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="slug" className="text-white">Slug (URL) *</Label>
                        <Input
                          id="slug"
                          {...form.register("slug")}
                          className="bg-slate-800 border-slate-700 text-white mt-1"
                          placeholder="agentes-ia"
                          data-testid="input-room-slug"
                        />
                        {form.formState.errors.slug && (
                          <p className="text-sm text-red-400 mt-1">{form.formState.errors.slug.message}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="shortDescription" className="text-white">Descripción Corta</Label>
                        <Textarea
                          id="shortDescription"
                          {...form.register("shortDescription")}
                          className="bg-slate-800 border-slate-700 text-white mt-1"
                          rows={2}
                          maxLength={500}
                          data-testid="input-room-short-description"
                        />
                      </div>

                      <div>
                        <Label htmlFor="description" className="text-white">Descripción Completa</Label>
                        <Textarea
                          id="description"
                          {...form.register("description")}
                          className="bg-slate-800 border-slate-700 text-white mt-1"
                          rows={4}
                          data-testid="input-room-description"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-900/50 border-slate-700">
                    <CardHeader>
                      <CardTitle>Configuración</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="order" className="text-white">Orden</Label>
                          <Input
                            id="order"
                            type="number"
                            {...form.register("order", { valueAsNumber: true })}
                            className="bg-slate-800 border-slate-700 text-white mt-1"
                            data-testid="input-room-order"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="currency" className="text-white">Moneda</Label>
                          <Input
                            id="currency"
                            {...form.register("currency")}
                            className="bg-slate-800 border-slate-700 text-white mt-1"
                            maxLength={3}
                            placeholder="usd"
                            data-testid="input-room-currency"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="price" className="text-white">Precio (centavos)</Label>
                        <Input
                          id="price"
                          type="number"
                          {...form.register("price", { valueAsNumber: true })}
                          className="bg-slate-800 border-slate-700 text-white mt-1"
                          placeholder="0"
                          data-testid="input-room-price"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          Ejemplo: 2999 = $29.99
                        </p>
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="isPublished" className="text-white">Publicado</Label>
                        <Switch
                          id="isPublished"
                          checked={form.watch("isPublished")}
                          onCheckedChange={(checked) => form.setValue("isPublished", checked)}
                          data-testid="switch-room-published"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  <Card className="bg-slate-900/50 border-slate-700">
                    <CardHeader>
                      <CardTitle>Banner Hero</CardTitle>
                      <CardDescription>Imagen principal de la sala (recomendado 1920x800px)</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="heroImageUrl" className="text-white">URL del Banner Hero</Label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            id="heroImageUrl"
                            {...form.register("heroImageUrl")}
                            className="bg-slate-800 border-slate-700 text-white flex-1"
                            placeholder="/uploads/hero-banner.jpg"
                            data-testid="input-room-hero-url"
                          />
                          <ObjectUploader
                            maxNumberOfFiles={1}
                            maxFileSize={5242880}
                            accept="image/*"
                            onGetUploadParameters={async () => {
                              const response = await apiRequest('POST', '/api/admin/media/upload-url', { fileType: 'image/jpeg' });
                              const { uploadURL } = await response.json();
                              return { method: 'PUT' as const, url: uploadURL };
                            }}
                            onComplete={async (result: Array<{ uploadURL: string; name: string }>) => {
                              if (result?.[0]) {
                                const uploadUrl = result[0].uploadURL;
                                const imageUrl = uploadUrl?.split('?')[0];
                                
                                try {
                                  const response = await apiRequest('POST', '/api/admin/media/normalize-path', { url: imageUrl });
                                  const { normalizedPath } = await response.json();
                                  form.setValue("heroImageUrl", normalizedPath || "");
                                } catch (error) {
                                  console.error('Error normalizing path:', error);
                                  form.setValue("heroImageUrl", imageUrl || "");
                                }
                                
                                toast({
                                  title: "¡Éxito!",
                                  description: "Banner subido correctamente",
                                });
                              }
                            }}
                            buttonClassName="bg-purple-600 hover:bg-purple-700 text-white text-sm px-3 py-2"
                          >
                            Subir
                          </ObjectUploader>
                        </div>
                        {form.watch("heroImageUrl") && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="mt-2 text-red-400 hover:text-red-300"
                            onClick={() => form.setValue("heroImageUrl", "")}
                            data-testid="button-clear-hero"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Eliminar banner
                          </Button>
                        )}
                      </div>

                      {form.watch("heroImageUrl") && (
                        <div className="mt-4">
                          <Label className="text-white mb-2 block">Vista Previa</Label>
                          <div className="rounded-lg overflow-hidden border border-slate-700">
                            <img
                              src={form.watch("heroImageUrl")?.startsWith('/objects/') 
                                ? `/api/object-proxy${form.watch("heroImageUrl")}` 
                                : form.watch("heroImageUrl")
                              }
                              alt="Hero banner preview"
                              className="w-full h-48 object-cover"
                            />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-900/50 border-slate-700">
                    <CardHeader>
                      <CardTitle>Imagen de Portada (Opcional)</CardTitle>
                      <CardDescription>Imagen para cards y listados</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="coverImageUrl" className="text-white">URL de Portada</Label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            id="coverImageUrl"
                            {...form.register("coverImageUrl")}
                            className="bg-slate-800 border-slate-700 text-white flex-1"
                            placeholder="/uploads/cover.jpg"
                            data-testid="input-room-cover-url"
                          />
                          <ObjectUploader
                            maxNumberOfFiles={1}
                            maxFileSize={5242880}
                            accept="image/*"
                            onGetUploadParameters={async () => {
                              const response = await apiRequest('POST', '/api/admin/media/upload-url', { fileType: 'image/jpeg' });
                              const { uploadURL } = await response.json();
                              return { method: 'PUT' as const, url: uploadURL };
                            }}
                            onComplete={async (result: Array<{ uploadURL: string; name: string }>) => {
                              if (result?.[0]) {
                                const uploadUrl = result[0].uploadURL;
                                const imageUrl = uploadUrl?.split('?')[0];
                                
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
                                  description: "Portada subida correctamente",
                                });
                              }
                            }}
                            buttonClassName="bg-purple-600 hover:bg-purple-700 text-white text-sm px-3 py-2"
                          >
                            Subir
                          </ObjectUploader>
                        </div>
                      </div>

                      {form.watch("coverImageUrl") && (
                        <div className="mt-4">
                          <div className="rounded-lg overflow-hidden border border-slate-700">
                            <img
                              src={form.watch("coverImageUrl")?.startsWith('/objects/') 
                                ? `/api/object-proxy${form.watch("coverImageUrl")}` 
                                : form.watch("coverImageUrl")
                              }
                              alt="Cover preview"
                              className="w-full h-32 object-cover"
                            />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <Link href="/admin/rooms">
                  <Button type="button" variant="ghost" data-testid="button-cancel">
                    Cancelar
                  </Button>
                </Link>
                <Button 
                  type="submit" 
                  disabled={saveMutation.isPending}
                  className="bg-purple-600 hover:bg-purple-700"
                  data-testid="button-save-room"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saveMutation.isPending ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </div>
            </form>
          </div>
        </main>
      </div>

      <MobileNav />
    </div>
  );
}
