import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import MobileHeader from "@/components/layout/mobile-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  Plus, 
  Search, 
  Edit,
  Trash2,
  Image as ImageIcon,
  Eye
} from "lucide-react";
import { useAdmin } from "@/hooks/useAdmin";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function PromoBannersManagement() {
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const [searchTerm, setSearchTerm] = useState("");
  const [location] = useLocation();
  const [selectedRoomId, setSelectedRoomId] = useState<string | undefined>(undefined);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Get roomId from URL query params
  useEffect(() => {
    const params = new URLSearchParams(location.split('?')[1]);
    const roomIdParam = params.get('roomId');
    if (roomIdParam) {
      setSelectedRoomId(roomIdParam);
    }
  }, [location]);

  const { data: rooms } = useQuery({
    queryKey: ["/api/rooms"],
  });

  const { data: banners, isLoading: bannersLoading, error: bannersError } = useQuery({
    queryKey: ["/api/admin/promo-banners", selectedRoomId],
    queryFn: async () => {
      const url = selectedRoomId 
        ? `/api/admin/promo-banners?roomId=${selectedRoomId}`
        : "/api/admin/promo-banners";
      const response = await apiRequest('GET', url);
      if (!response.ok) {
        throw new Error(`Error al obtener banners: ${response.statusText}`);
      }
      const data = await response.json();
      console.log('Banners obtenidos:', data);
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (bannerId: string) => {
      return await apiRequest('DELETE', `/api/admin/promo-banners/${bannerId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promo-banners"] });
      toast({
        title: "Banner eliminado",
        description: "El banner ha sido eliminado exitosamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error al eliminar",
        description: error.message || "No se pudo eliminar el banner",
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

  const filteredBanners = (banners as any)?.filter((banner: any) => {
    const matchesSearch = banner.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      banner.subtitle?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  }) || [];

  const getRoomName = (roomId: string) => {
    const room = (rooms as any)?.find((r: any) => r.id === roomId);
    return room?.title || "Sala desconocida";
  };

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
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                  <ImageIcon className="h-8 w-8" />
                  Gestión de Banners Promocionales
                </h1>
                <p className="text-gray-400 mt-2">
                  Administra los banners que se muestran entre fases en las salas
                </p>
              </div>
              <div className="flex gap-2">
                <Link href="/admin/rooms">
                  <Button variant="outline">Volver a Salas</Button>
                </Link>
                <Button onClick={() => setLocation("/admin/promo-banners/new")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Banner
                </Button>
              </div>
            </div>

            <Card className="bg-slate-900/50 border-slate-700 mb-6">
              <CardHeader>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar banners..."
                      className="pl-9 bg-slate-800 border-slate-700 text-white"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="sm:w-64">
                    <select
                      value={selectedRoomId || ""}
                      onChange={(e) => setSelectedRoomId(e.target.value || undefined)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Todas las salas</option>
                      {(rooms as any)?.map((room: any) => (
                        <option key={room.id} value={room.id}>
                          {room.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {bannersLoading && (
              <Card className="bg-slate-900/50 border-slate-700">
                <CardContent className="pt-6">
                  <div className="text-center py-12 text-gray-400">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p>Cargando banners...</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {bannersError && (
              <Card className="bg-slate-900/50 border-slate-700">
                <CardContent className="pt-6">
                  <div className="text-center py-12 text-red-400">
                    <p className="text-lg font-medium mb-2">Error al cargar banners</p>
                    <p className="text-sm">{(bannersError as Error).message}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {!bannersLoading && !bannersError && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBanners.map((banner: any) => (
                <Card key={banner.id} className="bg-slate-900/50 border-slate-700 hover:border-slate-600 transition-colors">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-white mb-2 line-clamp-2">{banner.title}</CardTitle>
                        {banner.subtitle && (
                          <p className="text-sm text-gray-400 mb-2">{banner.subtitle}</p>
                        )}
                        <p className="text-xs text-gray-500">{getRoomName(banner.roomId)}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {banner.backgroundImageUrl && (
                        <div className="aspect-video rounded-lg overflow-hidden bg-slate-800">
                          <img 
                            src={banner.backgroundImageUrl} 
                            alt={banner.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      {!banner.backgroundImageUrl && (
                        <div className="aspect-video rounded-lg overflow-hidden bg-gradient-to-r from-orange-600 to-red-600 flex items-center justify-center">
                          <p className="text-white text-sm font-medium">Sin imagen</p>
                        </div>
                      )}
                      
                      <div className="flex gap-2 flex-wrap">
                        <Badge className={banner.isActive ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}>
                          {banner.isActive ? "Activo" : "Inactivo"}
                        </Badge>
                        <Badge className="bg-purple-500/20 text-purple-400">
                          Después de Fase {banner.displayAfterPhaseOrder}
                        </Badge>
                        {banner.ctaText && (
                          <Badge className="bg-blue-500/20 text-blue-400">
                            CTA: {banner.ctaText}
                          </Badge>
                        )}
                      </div>

                      {banner.description && (
                        <p className="text-sm text-gray-400 line-clamp-2">{banner.description}</p>
                      )}

                      <div className="flex gap-2 mt-4">
                        <Link href={`/admin/promo-banners/${banner.id}/edit`} className="flex-1">
                          <Button size="sm" variant="outline" className="w-full">
                            <Edit className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                        </Link>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-900/20">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-slate-900 border-slate-700">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-white">¿Eliminar banner?</AlertDialogTitle>
                              <AlertDialogDescription className="text-gray-400">
                                Esta acción no se puede deshacer. Se eliminará permanentemente el banner "{banner.title}".
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="bg-slate-800 text-white border-slate-600 hover:bg-slate-700">
                                Cancelar
                              </AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => deleteMutation.mutate(banner.id)}
                                disabled={deleteMutation.isPending}
                                className="bg-red-600 text-white hover:bg-red-700"
                              >
                                {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
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

            {!bannersLoading && !bannersError && filteredBanners.length === 0 && (
              <Card className="bg-slate-900/50 border-slate-700">
                <CardContent className="pt-6">
                  <div className="text-center py-12 text-gray-400">
                    <ImageIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No se encontraron banners</p>
                    <p className="text-sm mb-4">
                      {searchTerm || selectedRoomId 
                        ? "Intenta con otro término de búsqueda o filtro"
                        : "Crea tu primer banner promocional"}
                    </p>
                    {!searchTerm && !selectedRoomId && (
                      <Button onClick={() => setLocation("/admin/promo-banners/new")}>
                        <Plus className="h-4 w-4 mr-2" />
                        Crear Banner
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>

      <MobileNav />
    </div>
  );
}

