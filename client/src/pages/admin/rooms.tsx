import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import MobileHeader from "@/components/layout/mobile-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Search, 
  Edit,
  Eye,
  DoorOpen,
  Image as ImageIcon
} from "lucide-react";
import { useAdmin } from "@/hooks/useAdmin";

export default function RoomsManagement() {
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: rooms } = useQuery({
    queryKey: ["/api/rooms"],
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

  const filteredRooms = (rooms as any)?.filter((room: any) =>
    room.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

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
                  <DoorOpen className="h-8 w-8" />
                  Gestión de Salas
                </h1>
                <p className="text-gray-400 mt-2">
                  Administra las salas temáticas y sus banners
                </p>
              </div>
              <Link href="/admin">
                <Button variant="outline">Volver al Panel</Button>
              </Link>
            </div>

            <Card className="bg-slate-900/50 border-slate-700 mb-6">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar salas..."
                      className="pl-9 bg-slate-800 border-slate-700 text-white"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      data-testid="input-search-rooms"
                    />
                  </div>
                </div>
              </CardHeader>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRooms.map((room: any) => (
                <Card key={room.id} className="bg-slate-900/50 border-slate-700 hover:border-slate-600 transition-colors">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-white mb-2">{room.title}</CardTitle>
                        <p className="text-sm text-gray-400 line-clamp-2">{room.shortDescription}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {room.heroImageUrl && (
                        <div className="aspect-video rounded-lg overflow-hidden bg-slate-800">
                          <img 
                            src={room.heroImageUrl} 
                            alt={room.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      {!room.heroImageUrl && (
                        <div className="aspect-video rounded-lg overflow-hidden bg-slate-800 flex items-center justify-center">
                          <p className="text-gray-500 text-sm">Sin banner</p>
                        </div>
                      )}
                      
                      <div className="flex gap-2 flex-wrap">
                        <Badge className={room.isPublished ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}>
                          {room.isPublished ? "Publicado" : "Borrador"}
                        </Badge>
                        {room.price && (
                          <Badge className="bg-purple-500/20 text-purple-400">
                            ${(room.price / 100).toFixed(2)}
                          </Badge>
                        )}
                      </div>

                      <div className="flex gap-2 mt-4">
                        <Link href={`/admin/rooms/${room.id}/edit`} className="flex-1">
                          <Button size="sm" variant="outline" className="w-full" data-testid={`button-edit-room-${room.id}`}>
                            <Edit className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                        </Link>
                        <Link href={`/admin/promo-banners?roomId=${room.id}`} className="flex-1">
                          <Button size="sm" variant="ghost" className="w-full">
                            <ImageIcon className="h-4 w-4 mr-1" />
                            Banners
                          </Button>
                        </Link>
                        <Link href={`/sala/${room.slug}`} className="flex-1">
                          <Button size="sm" variant="ghost" className="w-full" data-testid={`button-view-room-${room.id}`}>
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredRooms.length === 0 && (
              <Card className="bg-slate-900/50 border-slate-700">
                <CardContent className="pt-6">
                  <div className="text-center py-12 text-gray-400">
                    <DoorOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No se encontraron salas</p>
                    <p className="text-sm">
                      Intenta con otro término de búsqueda
                    </p>
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
