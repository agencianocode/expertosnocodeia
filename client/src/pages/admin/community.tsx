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
import { Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { useAdmin } from "@/hooks/useAdmin";
import { useToast } from "@/hooks/use-toast";

interface Post {
  post: any;
  user?: any;
  channel?: any;
}

export default function AdminCommunity() {
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [formData, setFormData] = useState({ title: "", content: "", videoUrl: "", channelId: "" });
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
      const res = await fetch("/api/admin/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error al crear anuncio");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/community/posts"] });
      setFormData({ title: "", content: "", videoUrl: "", channelId: "" });
      setShowCreateModal(false);
      toast({ title: "Éxito", description: "Anuncio creado" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/admin/community/posts/${editingPost?.post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error al actualizar anuncio");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/community/posts"] });
      setFormData({ title: "", content: "", videoUrl: "", channelId: "" });
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
    if (!formData.title.trim() || !formData.content.trim() || !formData.channelId) {
      toast({ title: "Error", description: "Completa todos los campos", variant: "destructive" });
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
    setFormData({
      title: post.post.title,
      content: post.post.content,
      videoUrl: post.post.videoUrl || "",
      channelId: post.post.channelId,
    });
    setShowCreateModal(true);
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
    <div className="min-h-screen bg-dark-bg text-white">
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
                  setFormData({ title: "", content: "", videoUrl: "", channelId: "" });
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
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <Card className="w-full max-w-md bg-[#1a1a1a] border-[#333333]">
                  <CardHeader>
                    <CardTitle>{editingPost ? "Editar Anuncio" : "Nuevo Anuncio"}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Título</label>
                      <Input
                        placeholder="Título del anuncio"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="bg-[#2a2a2a] border-[#444444]"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Contenido</label>
                      <textarea
                        placeholder="Contenido del anuncio"
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        className="w-full bg-[#2a2a2a] border border-[#444444] rounded p-2 text-white resize-none"
                        rows={6}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">URL del Video (YouTube, Vimeo, etc.)</label>
                      <Input
                        placeholder="https://youtu.be/... o https://vimeo.com/..."
                        value={formData.videoUrl}
                        onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                        className="bg-[#2a2a2a] border-[#444444]"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Canal</label>
                      <select
                        value={formData.channelId}
                        onChange={(e) => setFormData({ ...formData, channelId: e.target.value })}
                        className="w-full bg-[#2a2a2a] border border-[#444444] rounded p-2 text-white"
                      >
                        <option value="">Selecciona un canal</option>
                        <option value="289c4446-6628-4775-a18b-3d24b3ba8938">Anuncios</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowCreateModal(false)}
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleSubmit}
                        disabled={createMutation.isPending || updateMutation.isPending}
                        className="flex-1 bg-cyan-500 hover:bg-cyan-600"
                      >
                        {createMutation.isPending || updateMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : editingPost ? (
                          "Actualizar"
                        ) : (
                          "Crear"
                        )}
                      </Button>
                    </div>
                  </CardContent>
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
                {posts.map((post: Post) => (
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
                          </div>
                        </div>
                        <div className="flex gap-2">
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
                            <AlertDialogContent className="bg-[#1a1a1a] border-[#333333]">
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
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
