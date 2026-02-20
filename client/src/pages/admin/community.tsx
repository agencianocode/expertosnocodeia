import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import MobileHeader from "@/components/layout/mobile-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, Loader2, ChevronUp, ChevronDown, Pin } from "lucide-react";
import { useAdmin } from "@/hooks/useAdmin";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

interface Post {
  post: any;
  user?: any;
  channel?: any;
}

interface ContentBlock {
  type: "text" | "video" | "image";
  content?: string;
  url?: string;
}

export default function AdminCommunity() {
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [formData, setFormData] = useState({ title: "", channelId: "", imageUrl: "", contentBlocks: [] as ContentBlock[] });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: channels = [], isLoading: channelsLoading } = useQuery({
    queryKey: ["/api/community/channels"],
    queryFn: async () => {
      const res = await fetch("/api/community/channels", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Error al cargar canales");
      return res.json();
    },
  });

  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: ["/api/admin/community/posts"],
    queryFn: async () => {
      const res = await fetch("/api/admin/community/posts", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Error al cargar posts");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { title, channelId, contentBlocks } = data;
      const content = contentBlocks.filter((b: ContentBlock) => b.type === "text").map((b: ContentBlock) => b.content).join("\n") || "Post de comunidad";
      const videoUrl = contentBlocks.find((b: ContentBlock) => b.type === "video")?.url || "";
      
      const res = await fetch("/api/admin/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title, channelId, content, videoUrl, contentBlocks }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error al crear anuncio");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/community/posts"] });
      setFormData({ title: "", channelId: "", imageUrl: "", contentBlocks: [] });
      setSelectedImageFile(null);
      setImagePreviewUrl("");
      setShowCreateModal(false);
      setEditingPost(null);
      toast({ title: "Éxito", description: "Anuncio creado exitosamente" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const { title, channelId, contentBlocks, displayOrder } = data;
      const content = contentBlocks.filter((b: ContentBlock) => b.type === "text").map((b: ContentBlock) => b.content).join("\n") || "Post de comunidad";
      const videoUrl = contentBlocks.find((b: ContentBlock) => b.type === "video")?.url || "";
      
      const res = await fetch(`/api/admin/community/posts/${editingPost?.post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title, channelId, content, videoUrl, contentBlocks, displayOrder }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error al actualizar anuncio");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/community/posts"] });
      setFormData({ title: "", channelId: "", imageUrl: "", contentBlocks: [] });
      setEditingPost(null);
      toast({ title: "Éxito", description: "Anuncio actualizado" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (postId: string) => {
      const res = await fetch(`/api/admin/community/posts/${postId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error al eliminar anuncio");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/community/posts"] });
      toast({ title: "Éxito", description: "Anuncio eliminado" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (!formData.title.trim() || !formData.channelId || formData.contentBlocks.length === 0) {
      toast({ title: "Error", description: "Completa el título, canal y agrega bloques de contenido", variant: "destructive" });
      return;
    }

    if (editingPost) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (post: Post) => {
    setEditingPost(post);
    
    // Si hay contentBlocks, usar esos; si no, construir desde campos legacy
    let blocks = [];
    if (post.post.contentBlocks && post.post.contentBlocks.length > 0) {
      blocks = post.post.contentBlocks;
    } else {
      // Convertir campos legacy a bloques
      if (post.post.content) {
        blocks.push({ type: "text" as const, content: post.post.content });
      }
      if (post.post.videoUrl) {
        blocks.push({ type: "video" as const, url: post.post.videoUrl });
      }
      if (post.post.imageUrl) {
        blocks.push({ type: "image" as const, url: post.post.imageUrl });
      }
    }
    
    setFormData({
      title: post.post.title,
      channelId: post.post.channelId,
      imageUrl: post.post.imageUrl || "",
      contentBlocks: blocks,
    });
    setShowCreateModal(true);
  };

  const addBlock = (type: "text" | "video" | "image") => {
    setFormData({
      ...formData,
      contentBlocks: [...formData.contentBlocks, { type }],
    });
  };

  const updateBlock = (index: number, data: Partial<ContentBlock>) => {
    const newBlocks = [...formData.contentBlocks];
    newBlocks[index] = { ...newBlocks[index], ...data };
    setFormData({ ...formData, contentBlocks: newBlocks });
  };

  const removeBlock = (index: number) => {
    const newBlocks = formData.contentBlocks.filter((_, i) => i !== index);
    setFormData({ ...formData, contentBlocks: newBlocks });
  };

  const moveBlock = (index: number, direction: "up" | "down") => {
    const newBlocks = [...formData.contentBlocks];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < newBlocks.length) {
      [newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]];
      setFormData({ ...formData, contentBlocks: newBlocks });
    }
  };

  const handleBlockImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, blockIndex: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const token = localStorage.getItem('simpleAuthToken');
      const formDataToUpload = new FormData();
      formDataToUpload.append("file", file);
      
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      const uploadRes = await fetch("/api/upload-image", {
        method: "POST",
        headers,
        credentials: "include",
        body: formDataToUpload,
      });
      
      if (uploadRes.ok) {
        const uploadData = await uploadRes.json();
        updateBlock(blockIndex, { url: uploadData.url });
        toast({ title: "Éxito", description: "Imagen subida correctamente" });
      } else {
        const errorData = await uploadRes.json().catch(() => ({ message: "Error al subir la imagen" }));
        toast({ 
          title: "Error", 
          description: errorData.message || "Error al subir la imagen", 
          variant: "destructive" 
        });
      }
    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast({ 
        title: "Error", 
        description: error.message || "Error al subir la imagen", 
        variant: "destructive" 
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Por favor selecciona un archivo de imagen.",
        variant: "destructive",
      });
      return;
    }

    // Si estamos creando un nuevo post (sin editingPost), mostrar preview localmente
    if (!editingPost?.user) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImageFile(file);
        setImagePreviewUrl(event.target?.result as string);
        toast({
          title: "Éxito",
          description: "Imagen seleccionada. Se subirá cuando hagas click en Crear.",
        });
      };
      reader.readAsDataURL(file);
      return;
    }

    // Si estamos editando un anuncio existente, subir directamente al servidor
    setUploadingImage(true);
    try {
      const formDataToUpload = new FormData();
      formDataToUpload.append("file", file);

      const res = await fetch(`/api/admin/community/posts/${editingPost.post.id}/upload-image`, {
        method: "POST",
        credentials: "include",
        body: formDataToUpload,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error al subir la imagen");
      }

      const data = await res.json();
      setFormData({ ...formData, imageUrl: data.imageUrl });
      toast({
        title: "Éxito",
        description: "Imagen subida correctamente",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo subir la imagen",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };


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
        <Link href="/admin">
          <Button>Volver a Admin</Button>
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
                <h1 className="text-3xl font-bold text-white">Gestión de Comunidad</h1>
                <p className="text-gray-400 mt-2">Crea y gestiona anuncios para los canales de comunidad</p>
              </div>
              <Button
                onClick={() => {
                  setEditingPost(null);
                  setFormData({ title: "", channelId: "", imageUrl: "", contentBlocks: [] });
                  setSelectedImageFile(null);
                  setImagePreviewUrl("");
                  setShowCreateModal(true);
                }}
                className="bg-cyan-500 hover:bg-cyan-600 gap-2"
              >
                <Plus className="h-4 w-4" />
                Nuevo Anuncio
              </Button>
            </div>

            {/* Create/Edit Modal */}
            {showCreateModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
                <Card className="w-full max-w-2xl bg-card border-border my-8">
                  <CardHeader>
                    <CardTitle>{editingPost ? "Editar Anuncio" : "Nuevo Anuncio"}</CardTitle>
                    <CardDescription>Crea bloques de contenido: texto → video → más texto</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 max-h-96 overflow-y-auto">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Título</label>
                      <Input
                        placeholder="Título del anuncio (ej: ¡Bienvenido a la Comunidad!)"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="bg-muted border-border"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-3 block">Bloques de Contenido</label>
                      <div className="space-y-3">
                        {formData.contentBlocks.map((block, index) => (
                          <div key={index} className="bg-muted border border-border rounded p-3 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-medium text-cyan-400">
                                Bloque {index + 1}: {block.type === "text" ? "📝 Texto" : block.type === "video" ? "🎬 Video" : "🖼️ Imagen"}
                              </span>
                              <div className="flex gap-1">
                                <button onClick={() => moveBlock(index, "up")} disabled={index === 0} className="p-1 hover:bg-muted disabled:opacity-30 rounded">
                                  <ChevronUp className="h-4 w-4" />
                                </button>
                                <button onClick={() => moveBlock(index, "down")} disabled={index === formData.contentBlocks.length - 1} className="p-1 hover:bg-muted disabled:opacity-30 rounded">
                                  <ChevronDown className="h-4 w-4" />
                                </button>
                                <button onClick={() => removeBlock(index)} className="p-1 hover:bg-red-500/20 rounded">
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </button>
                              </div>
                            </div>
                            {block.type === "text" ? (
                              <RichTextEditor
                                content={block.content || ""}
                                onChange={(content) => updateBlock(index, { content })}
                                placeholder="Escribe tu texto aquí..."
                                className="min-h-[200px]"
                              />
                            ) : block.type === "video" ? (
                              <Input
                                placeholder="URL del video (YouTube, Vimeo, etc.)"
                                value={block.url || ""}
                                onChange={(e) => updateBlock(index, { url: e.target.value })}
                                className="bg-card border-border text-sm"
                              />
                            ) : (
                              <div className="space-y-2">
                                {block.url && (
                                  <div className="relative w-full h-32 rounded overflow-hidden">
                                    <img src={block.url} alt="Preview" className="w-full h-full object-cover" />
                                  </div>
                                )}
                                <div>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleBlockImageUpload(e, index)}
                                    className="hidden"
                                    id={`block-image-${index}`}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => document.getElementById(`block-image-${index}`)?.click()}
                                    className="w-full bg-card border border-border rounded p-2 text-foreground hover:bg-muted text-sm"
                                  >
                                    Seleccionar imagen
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-3">
                        <Button onClick={() => addBlock("text")} size="sm" variant="outline">
                          <Plus className="h-4 w-4 mr-1" /> Texto
                        </Button>
                        <Button onClick={() => addBlock("video")} size="sm" variant="outline">
                          <Plus className="h-4 w-4 mr-1" /> Video
                        </Button>
                        <Button onClick={() => addBlock("image")} size="sm" variant="outline">
                          <Plus className="h-4 w-4 mr-1" /> Imagen
                        </Button>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Canal</label>
                      <select
                        value={formData.channelId}
                        onChange={(e) => setFormData({ ...formData, channelId: e.target.value })}
                        className="w-full bg-muted border border-border rounded p-2 text-foreground"
                      >
                        <option value="">Selecciona un canal</option>
                        {channels.map((channel: any) => (
                          <option key={channel.id} value={channel.id}>
                            {channel.icon} {channel.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </CardContent>
                  <div className="px-6 py-4 border-t border-border flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowCreateModal(false);
                        setEditingPost(null);
                        setFormData({ title: "", channelId: "", imageUrl: "", contentBlocks: [] });
                      }}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={createMutation.isPending || updateMutation.isPending || !formData.title || !formData.channelId || formData.contentBlocks.length === 0}
                      className="flex-1 bg-cyan-500 hover:bg-cyan-600"
                    >
                      {createMutation.isPending || updateMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : null}
                      {editingPost?.user ? "Actualizar" : "Crear"}
                    </Button>
                  </div>
                </Card>
              </div>
            )}

            {/* Posts Table */}
            {postsLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : posts.length === 0 ? (
              <Card className="bg-slate-900/50 border-slate-700">
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No hay anuncios. Crea uno nuevo para empezar.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {posts.map((post: Post, index: number) => {
                  const isReadOnlyChannel = post.channel?.isReadOnly;
                  return (
                    <Card key={post.post.id} className="bg-slate-900/50 border-slate-700">
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-bold text-lg mb-2">{post.post.title}</h3>
                            <p className="text-sm text-gray-400 mb-2 line-clamp-2">{post.post.content}</p>
                            <div className="flex gap-4 text-xs text-gray-500">
                              <span>📢 {post.channel?.name}</span>
                              <span>👤 {post.user?.firstName} {post.user?.lastName}</span>
                              <span>📅 {new Date(post.post.createdAt).toLocaleDateString("es-ES")}</span>
                              {isReadOnlyChannel && <span className="text-cyan-500">🔒 Solo lectura</span>}
                            </div>
                          </div>
                          <div className="flex gap-2 flex-wrap justify-end">
                            {isReadOnlyChannel && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={async () => {
                                    const newOrder = (post.post.displayOrder || 0) - 1;
                                    try {
                                      await fetch("/api/admin/community/posts/reorder", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        credentials: "include",
                                        body: JSON.stringify({ updates: [{ postId: post.post.id, displayOrder: newOrder }] }),
                                      });
                                      queryClient.invalidateQueries({ queryKey: ["/api/admin/community/posts"] });
                                    } catch (e) {
                                      toast({ title: "Error", description: "No se pudo reordenar", variant: "destructive" });
                                    }
                                  }}
                                  disabled={index === 0}
                                >
                                  ⬆️
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={async () => {
                                    const newOrder = (post.post.displayOrder || 0) + 1;
                                    try {
                                      await fetch("/api/admin/community/posts/reorder", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        credentials: "include",
                                        body: JSON.stringify({ updates: [{ postId: post.post.id, displayOrder: newOrder }] }),
                                      });
                                      queryClient.invalidateQueries({ queryKey: ["/api/admin/community/posts"] });
                                    } catch (e) {
                                      toast({ title: "Error", description: "No se pudo reordenar", variant: "destructive" });
                                    }
                                  }}
                                  disabled={index === posts.length - 1}
                                >
                                  ⬇️
                                </Button>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                try {
                                  const res = await fetch(`/api/community/posts/${post.post.id}/toggle-pin`, {
                                    method: "POST",
                                    credentials: "include",
                                  });
                                  if (res.ok) {
                                    queryClient.invalidateQueries({ queryKey: ["/api/admin/community/posts"] });
                                    toast({ 
                                      title: "Éxito", 
                                      description: (post.post as any)?.isPinned ? "Publicación desfijada" : "Publicación fijada" 
                                    });
                                  } else {
                                    toast({ title: "Error", description: "No se pudo fijar/desfijar la publicación", variant: "destructive" });
                                  }
                                } catch (e) {
                                  toast({ title: "Error", description: "Error al fijar/desfijar la publicación", variant: "destructive" });
                                }
                              }}
                              title={(post.post as any)?.isPinned ? "Desfijar publicación" : "Fijar publicación"}
                            >
                              <Pin className={cn("h-4 w-4 mr-1", (post.post as any)?.isPinned && "fill-current")} />
                              {(post.post as any)?.isPinned ? "Desfijar" : "Fijar"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(post)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-card border-border">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Eliminar anuncio</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    ¿Estás seguro? Esta acción no se puede deshacer.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteMutation.mutate(post.post.id)}
                                    className="bg-red-500 hover:bg-red-600"
                                  >
                                    Eliminar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
