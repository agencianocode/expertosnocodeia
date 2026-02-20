import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useSimpleAuth } from "@/hooks/use-simple-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import { 
  Plus, 
  Calendar, 
  Radio, 
  Edit, 
  Trash2, 
  Play, 
  Square,
  Clock,
  User,
  Video,
  Upload,
  Image as ImageIcon,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface LiveEvent {
  id: string;
  title: string;
  description?: string;
  hostName: string;
  hostAvatar?: string;
  hostRole?: string;
  startTime: string;
  endTime: string;
  timezone?: string;
  isActive: boolean;
  isLive: boolean;
  joinUrl?: string;
  roomName?: string;
  eventType: string;
  category?: string;
  eventImage?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminLiveEvents() {
  const { toast } = useToast();
  const { user } = useSimpleAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<LiveEvent | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingEventImage, setUploadingEventImage] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    hostName: string;
    hostRole: string;
    hostAvatar: string;
    eventImage: string;
    startTime: string;
    endTime: string;
    eventType: string;
    category: string | null;
  }>({
    title: "",
    description: "",
    hostName: "",
    hostRole: "",
    hostAvatar: "",
    eventImage: "",
    startTime: "",
    endTime: "",
    eventType: "live",
    category: null,
  });

  // Fetch events
  const { data: events = [], isLoading } = useQuery<LiveEvent[]>({
    queryKey: ["/api/admin/live-events"],
    queryFn: async () => {
      const token = localStorage.getItem("simpleAuthToken");
      const res = await fetch("/api/admin/live-events", {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch events");
      return res.json();
    },
  });

  // Fetch categories
  interface Category {
    id: string;
    name: string;
    description?: string;
    icon?: string;
    color?: string;
  }

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
  });

  // Create event mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const token = localStorage.getItem("simpleAuthToken");
      // Clean data: convert empty category to null
      const cleanData = {
        ...data,
        category: (data.category && typeof data.category === 'string' && data.category.trim() !== "") ? data.category.trim() : null,
      };
      console.log("📝 Creating event with category:", { original: data.category, cleaned: cleanData.category });
      const res = await fetch("/api/admin/live-events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify(cleanData),
      });
      
      // Check content type first
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        console.error("Server returned non-JSON response:", text.substring(0, 200));
        throw new Error(`Server returned ${contentType || "unknown"} instead of JSON. Status: ${res.status}`);
      }
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Error desconocido" }));
        throw new Error(errorData.message || "Failed to create event");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/live-events"] });
      setIsCreateOpen(false);
      resetForm();
      toast({ title: "Éxito", description: "Evento creado correctamente" });
    },
    onError: (error: any) => {
      console.error("Error creating event:", error);
      toast({ 
        title: "Error", 
        description: error.message || "No se pudo crear el evento", 
        variant: "destructive" 
      });
    },
  });

  // Update event mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      const token = localStorage.getItem("simpleAuthToken");
      // Clean data: convert empty category to null
      const cleanData = {
        ...data,
        category: (data.category && typeof data.category === 'string' && data.category.trim() !== "") ? data.category.trim() : null,
      };
      console.log("📝 Updating category:", { original: data.category, cleaned: cleanData.category });
      const res = await fetch(`/api/admin/live-events/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify(cleanData),
      });
      if (!res.ok) throw new Error("Failed to update event");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/live-events"] });
      setIsEditOpen(false);
      setSelectedEvent(null);
      resetForm();
      toast({ title: "Éxito", description: "Evento actualizado" });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo actualizar el evento", variant: "destructive" });
    },
  });

  // Toggle live status mutation
  const toggleLiveMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const token = localStorage.getItem("simpleAuthToken");
      const res = await fetch(`/api/admin/live-events/${eventId}/toggle-live`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to toggle live");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/live-events"] });
      toast({
        title: data.isLive ? "🔴 Evento EN VIVO" : "Evento finalizado",
        description: data.isLive 
          ? "El evento ahora aparece en la comunidad" 
          : "El evento ya no está en vivo",
      });
    },
  });

  // Delete event mutation
  const deleteMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const token = localStorage.getItem("simpleAuthToken");
      const res = await fetch(`/api/admin/live-events/${eventId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete event");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/live-events"] });
      toast({ title: "Éxito", description: "Evento eliminado" });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      hostName: user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "",
      hostRole: "",
      hostAvatar: "",
      eventImage: "",
      startTime: "",
      endTime: "",
      eventType: "live",
      category: null,
    });
  };

  const openEditDialog = (event: LiveEvent) => {
    setSelectedEvent(event);
    setFormData({
      title: event.title,
      description: event.description || "",
      hostName: event.hostName,
      hostRole: event.hostRole || "",
      hostAvatar: event.hostAvatar || "",
      eventImage: (event as any).eventImage || "",
      startTime: event.startTime ? new Date(event.startTime).toISOString().slice(0, 16) : "",
      endTime: event.endTime ? new Date(event.endTime).toISOString().slice(0, 16) : "",
      eventType: event.eventType || "live",
      category: event.category || null,
    });
    setIsEditOpen(true);
  };

  const handleCreate = () => {
    if (!formData.title || !formData.hostName || !formData.startTime || !formData.endTime) {
      toast({ title: "Error", description: "Completa todos los campos requeridos", variant: "destructive" });
      return;
    }
    createMutation.mutate(formData);
  };

  const handleUpdate = () => {
    if (!selectedEvent) return;
    updateMutation.mutate({ id: selectedEvent.id, data: formData });
  };

  // Handle avatar upload
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Solo se permiten archivos de imagen",
        variant: "destructive",
      });
      return;
    }

    // Validar tamaño (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "La imagen no puede superar los 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploadingAvatar(true);
    try {
      const token = localStorage.getItem("simpleAuthToken");
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/events/upload-image', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) throw new Error('Error subiendo imagen');

      const data = await res.json();
      setFormData(prev => ({ ...prev, hostAvatar: data.url }));
      
      toast({
        title: "Éxito",
        description: "Avatar subido correctamente",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error subiendo avatar",
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Handle event image upload
  const handleEventImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Solo se permiten archivos de imagen",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "La imagen no puede superar los 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploadingEventImage(true);
    try {
      const token = localStorage.getItem("simpleAuthToken");
      const formDataToUpload = new FormData();
      formDataToUpload.append('file', file);

      const res = await fetch('/api/admin/events/upload-image', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToUpload,
      });

      if (!res.ok) throw new Error('Error subiendo imagen');

      const data = await res.json();
      setFormData(prev => ({ ...prev, eventImage: data.url }));
      
      toast({
        title: "Éxito",
        description: "Imagen del evento subida correctamente",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error subiendo imagen",
        variant: "destructive",
      });
    } finally {
      setUploadingEventImage(false);
    }
  };

  const getEventStatus = (event: LiveEvent) => {
    if (event.isLive) return "live";
    const now = new Date();
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);
    if (now < start) return "upcoming";
    if (now > end) return "ended";
    return "active";
  };

  const getStatusBadge = (status: string, isLive: boolean) => {
    if (isLive) {
      return <Badge className="bg-red-500 text-white animate-pulse">🔴 EN VIVO</Badge>;
    }
    switch (status) {
      case "upcoming":
        return <Badge variant="secondary">Próximo</Badge>;
      case "active":
        return <Badge className="bg-green-500 text-white">En horario</Badge>;
      case "ended":
        return <Badge variant="outline">Finalizado</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white">
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 overflow-auto pb-20 lg:pb-0 md:ml-16 lg:ml-[250px] min-h-screen">
          <div className="p-6 lg:p-8 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
                  <Video className="h-7 w-7 text-cyan-500" />
                  Eventos en Vivo
                </h1>
                <p className="text-gray-400 mt-1">
                  Gestiona los eventos y lives de la comunidad
                </p>
              </div>
              
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button 
                    className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold"
                    onClick={() => {
                      resetForm();
                      setIsCreateOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Evento
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#1a1a1a] border-[#333] text-white max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Crear Nuevo Evento</DialogTitle>
                    <DialogDescription className="text-gray-400">
                      Programa un evento en vivo para la comunidad
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label>Título del evento *</Label>
                      <Input
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Ej: Live de Bienvenida"
                        className="bg-input border-border mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label>Descripción</Label>
                      <div className="mt-1 border border-border rounded-md bg-input max-h-[300px] overflow-y-auto">
                        <RichTextEditor
                          content={formData.description}
                          onChange={(content) => setFormData({ ...formData, description: content })}
                          placeholder="Describe el evento... Puedes usar negritas, viñetas, listas, etc."
                          className="min-h-[200px] max-h-[280px]"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Anfitrión *</Label>
                        <Input
                          value={formData.hostName}
                          onChange={(e) => setFormData({ ...formData, hostName: e.target.value })}
                          placeholder="Nombre del host"
                          className="bg-input border-border mt-1"
                        />
                      </div>
                      <div>
                        <Label>Rol del anfitrión</Label>
                        <Input
                          value={formData.hostRole}
                          onChange={(e) => setFormData({ ...formData, hostRole: e.target.value })}
                          placeholder="Ej: Community Manager"
                          className="bg-input border-border mt-1"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label>Avatar del anfitrión</Label>
                      <div className="mt-1 space-y-2">
                        {formData.hostAvatar && (
                          <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-primary">
                            <img src={formData.hostAvatar} alt="Avatar" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={uploadingAvatar}
                            onClick={() => document.getElementById('avatar-upload-create')?.click()}
                            className="border-border text-white"
                          >
                            {uploadingAvatar ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Subiendo...
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4 mr-2" />
                                Subir avatar
                              </>
                            )}
                          </Button>
                          {formData.hostAvatar && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setFormData({ ...formData, hostAvatar: "" })}
                              className="text-red-400 hover:text-red-300"
                            >
                              Quitar
                            </Button>
                          )}
                        </div>
                        <input
                          id="avatar-upload-create"
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          className="hidden"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label>Imagen del evento</Label>
                      <div className="mt-1 space-y-2">
                        {formData.eventImage && (
                          <div className="relative w-full h-32 rounded-lg overflow-hidden border-2 border-primary">
                            <img src={formData.eventImage} alt="Evento" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={uploadingEventImage}
                            onClick={() => document.getElementById('event-image-upload-create')?.click()}
                            className="border-border text-white"
                          >
                            {uploadingEventImage ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Subiendo...
                              </>
                            ) : (
                              <>
                                <ImageIcon className="h-4 w-4 mr-2" />
                                Subir imagen
                              </>
                            )}
                          </Button>
                          {formData.eventImage && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setFormData({ ...formData, eventImage: "" })}
                              className="text-red-400 hover:text-red-300"
                            >
                              Quitar
                            </Button>
                          )}
                        </div>
                        <input
                          id="event-image-upload-create"
                          type="file"
                          accept="image/*"
                          onChange={handleEventImageUpload}
                          className="hidden"
                        />
                        <p className="text-xs text-gray-500">Banner o imagen principal del evento (recomendado: 1200x600px)</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Fecha y hora inicio *</Label>
                        <Input
                          type="datetime-local"
                          value={formData.startTime}
                          onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                          className="bg-input border-border mt-1"
                        />
                      </div>
                      <div>
                        <Label>Fecha y hora fin *</Label>
                        <Input
                          type="datetime-local"
                          value={formData.endTime}
                          onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                          className="bg-input border-border mt-1"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label>Tipo de evento</Label>
                      <Select
                        value={formData.eventType}
                        onValueChange={(value) => setFormData({ ...formData, eventType: value })}
                      >
                        <SelectTrigger className="bg-input border-border mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-input border-border">
                          <SelectItem value="live">Live / Transmisión</SelectItem>
                          <SelectItem value="workshop">Taller / Workshop</SelectItem>
                          <SelectItem value="webinar">Webinar</SelectItem>
                          <SelectItem value="qa">Q&A / Preguntas</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Categoría</Label>
                      <Select
                        value={formData.category || undefined}
                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                      >
                        <SelectTrigger className="bg-input border-border mt-1">
                          <SelectValue placeholder="Selecciona una categoría" />
                        </SelectTrigger>
                        <SelectContent className="bg-input border-border">
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.name}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-400 mt-1">
                        Categoría del evento que se mostrará como badge en el modal
                      </p>
                    </div>
                    
                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setIsCreateOpen(false)}
                        className="border-border"
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleCreate}
                        disabled={createMutation.isPending}
                        className="bg-cyan-500 hover:bg-cyan-600 text-black"
                      >
                        {createMutation.isPending ? "Creando..." : "Crear Evento"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Events List */}
            {isLoading ? (
              <div className="text-center py-12 text-gray-400">
                Cargando eventos...
              </div>
            ) : events.length === 0 ? (
              <Card className="bg-[#1a1a1a] border-[#333]">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Calendar className="h-12 w-12 text-gray-500 mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">No hay eventos</h3>
                  <p className="text-gray-400 text-center mb-4">
                    Crea tu primer evento para que aparezca en la comunidad
                  </p>
                  <Button
                    onClick={() => {
                      resetForm();
                      setIsCreateOpen(true);
                    }}
                    className="bg-cyan-500 hover:bg-cyan-600 text-black"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Evento
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {events.map((event) => {
                  const status = getEventStatus(event);
                  return (
                    <Card key={event.id} className="bg-[#1a1a1a] border-[#333] hover:border-border transition-colors">
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          {/* Event Info */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {getStatusBadge(status, event.isLive)}
                              <Badge variant="outline" className="text-gray-400">
                                {event.eventType === "live" && "Live"}
                                {event.eventType === "workshop" && "Taller"}
                                {event.eventType === "webinar" && "Webinar"}
                                {event.eventType === "qa" && "Q&A"}
                              </Badge>
                            </div>
                            
                            <h3 className="text-lg font-semibold text-white mb-1">
                              {event.title}
                            </h3>
                            
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                              <span className="flex items-center gap-1">
                                <User className="h-3.5 w-3.5" />
                                {event.hostName}
                                {event.hostRole && ` - ${event.hostRole}`}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                {event.startTime && format(new Date(event.startTime), "PPp", { locale: es })}
                              </span>
                            </div>
                          </div>
                          
                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            {/* Toggle Live Button */}
                            <Button
                              size="sm"
                              onClick={() => toggleLiveMutation.mutate(event.id)}
                              disabled={toggleLiveMutation.isPending}
                              className={cn(
                                "gap-1",
                                event.isLive 
                                  ? "bg-red-500 hover:bg-red-600 text-white" 
                                  : "bg-green-600 hover:bg-green-700 text-white"
                              )}
                            >
                              {event.isLive ? (
                                <>
                                  <Square className="h-3.5 w-3.5" />
                                  Finalizar
                                </>
                              ) : (
                                <>
                                  <Play className="h-3.5 w-3.5" />
                                  Iniciar Live
                                </>
                              )}
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditDialog(event)}
                              className="border-border"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                if (confirm("¿Eliminar este evento?")) {
                                  deleteMutation.mutate(event.id);
                                }
                              }}
                              className="border-border text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Info Card */}
            <Card className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border-cyan-500/30">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Radio className="h-5 w-5 text-cyan-500" />
                  ¿Cómo funciona?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-gray-300">
                <p>
                  <strong>1. Crea el evento:</strong> Define título, anfitrión y horario del evento.
                </p>
                <p>
                  <strong>2. Aparece automáticamente:</strong> Cuando llegue la hora de inicio, el evento aparecerá en la comunidad.
                </p>
                <p>
                  <strong>3. Inicia manualmente:</strong> También puedes hacer clic en "Iniciar Live" para activarlo inmediatamente.
                </p>
                <p>
                  <strong>4. Los usuarios se unen:</strong> El widget "Join" aparece en la barra lateral de la comunidad.
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
      
      <MobileNav />
      
      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="bg-[#1a1a1a] border-[#333] text-white max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Evento</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div>
              <Label>Título del evento *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="bg-input border-border mt-1"
              />
            </div>
            
            <div>
              <Label>Descripción</Label>
              <div className="mt-1 border border-border rounded-md bg-input max-h-[300px] overflow-y-auto">
                <RichTextEditor
                  content={formData.description}
                  onChange={(content) => setFormData({ ...formData, description: content })}
                  placeholder="Describe el evento... Puedes usar negritas, viñetas, listas, etc."
                  className="min-h-[200px] max-h-[280px]"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Anfitrión *</Label>
                <Input
                  value={formData.hostName}
                  onChange={(e) => setFormData({ ...formData, hostName: e.target.value })}
                  className="bg-input border-border mt-1"
                />
              </div>
              <div>
                <Label>Rol</Label>
                <Input
                  value={formData.hostRole}
                  onChange={(e) => setFormData({ ...formData, hostRole: e.target.value })}
                  className="bg-input border-border mt-1"
                />
              </div>
            </div>
            
            <div>
              <Label>Avatar del anfitrión</Label>
              <div className="mt-1 space-y-2">
                {formData.hostAvatar && (
                  <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-primary">
                    <img src={formData.hostAvatar} alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploadingAvatar}
                    onClick={() => document.getElementById('avatar-upload-edit')?.click()}
                    className="border-border text-white"
                  >
                    {uploadingAvatar ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Subiendo...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Subir avatar
                      </>
                    )}
                  </Button>
                  {formData.hostAvatar && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFormData({ ...formData, hostAvatar: "" })}
                      className="text-red-400 hover:text-red-300"
                    >
                      Quitar
                    </Button>
                  )}
                </div>
                <input
                  id="avatar-upload-edit"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>
            </div>
            
            <div>
              <Label>Imagen del evento</Label>
              <div className="mt-1 space-y-2">
                {formData.eventImage && (
                  <div className="relative w-full h-32 rounded-lg overflow-hidden border-2 border-primary">
                    <img src={formData.eventImage} alt="Evento" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploadingEventImage}
                    onClick={() => document.getElementById('event-image-upload-edit')?.click()}
                    className="border-border text-white"
                  >
                    {uploadingEventImage ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Subiendo...
                      </>
                    ) : (
                      <>
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Subir imagen
                      </>
                    )}
                  </Button>
                  {formData.eventImage && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFormData({ ...formData, eventImage: "" })}
                      className="text-red-400 hover:text-red-300"
                    >
                      Quitar
                    </Button>
                  )}
                </div>
                <input
                  id="event-image-upload-edit"
                  type="file"
                  accept="image/*"
                  onChange={handleEventImageUpload}
                  className="hidden"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Fecha/hora inicio *</Label>
                <Input
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="bg-input border-border mt-1"
                />
              </div>
              <div>
                <Label>Fecha/hora fin *</Label>
                <Input
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="bg-input border-border mt-1"
                />
              </div>
            </div>
            
            <div>
              <Label>Tipo de evento</Label>
              <Select
                value={formData.eventType}
                onValueChange={(value) => setFormData({ ...formData, eventType: value })}
              >
                <SelectTrigger className="bg-input border-border mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-input border-border">
                  <SelectItem value="live">Live / Transmisión</SelectItem>
                  <SelectItem value="workshop">Taller / Workshop</SelectItem>
                  <SelectItem value="webinar">Webinar</SelectItem>
                  <SelectItem value="qa">Q&A / Preguntas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Categoría</Label>
              <Select
                value={formData.category || undefined}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger className="bg-input border-border mt-1">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent className="bg-input border-border">
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-400 mt-1">
                Categoría del evento que se mostrará como badge en el modal
              </p>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsEditOpen(false)}
                className="border-border"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUpdate}
                disabled={updateMutation.isPending}
                className="bg-cyan-500 hover:bg-cyan-600 text-black"
              >
                {updateMutation.isPending ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

