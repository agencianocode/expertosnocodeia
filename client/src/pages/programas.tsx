import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import MobileHeader from "@/components/layout/mobile-header";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function Programas() {
  const { isAuthenticated, isLoading } = useAuth();
  const { isPaidPlan, isLoading: subscriptionLoading } = useSubscription();
  const [, setLocation] = useLocation();

  const { data: roomsData, isLoading: roomsLoading } = useQuery({
    queryKey: ["/api/rooms"],
    enabled: isAuthenticated, // Solo cargar si está autenticado
  });

  // Redirigir a /planes si no tiene membresía activa
  useEffect(() => {
    if (!isLoading && !subscriptionLoading && isAuthenticated && !isPaidPlan) {
      setLocation("/planes");
    }
  }, [isLoading, subscriptionLoading, isAuthenticated, isPaidPlan, setLocation]);

  if (isLoading || roomsLoading || subscriptionLoading) {
    return (
      <div className="min-h-screen bg-background flex">
        <div className="w-[250px] bg-card border-r border-border"></div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-foreground">Cargando...</div>
        </div>
      </div>
    );
  }

  const rooms = (roomsData as any) || [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Mobile Header */}
      <MobileHeader />
      
      <div className="flex">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main Content */}
        <main className="flex-1 overflow-auto pb-20 lg:pb-0 md:ml-16 lg:ml-[250px]">
          {/* Mobile Header */}
          <div className="lg:hidden px-4 py-4">
            <h1 className="text-2xl font-bold text-foreground">Programas</h1>
            <p className="text-muted-foreground text-sm mt-1">Rutas de aprendizaje completas con contenido que se desbloquea semanalmente</p>
          </div>

          {/* Desktop/Tablet Content */}
          <div className="hidden lg:block px-8 py-6">
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-2">Programas</h1>
              <p className="text-muted-foreground">Rutas de aprendizaje completas con contenido que se desbloquea semanalmente</p>
            </div>

            {/* Rooms Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              {rooms.map((room: any) => (
                <Link key={room.id} href={`/sala/${room.slug}`}>
                  <div className="group relative bg-card rounded-xl border border-border overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer h-full min-h-[280px] lg:min-h-[320px]">
                    {/* Background Image/Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-background opacity-50 group-hover:opacity-70 transition-opacity" />
                    
                    {room.coverImageUrl && (
                      <div 
                        className="absolute inset-0 bg-cover bg-center opacity-30 lg:opacity-20 group-hover:opacity-40 lg:group-hover:opacity-30 transition-opacity"
                        style={{ backgroundImage: `url(${room.coverImageUrl})` }}
                      />
                    )}
                    
                    {/* Content */}
                    <div className="relative p-4 lg:p-6 h-full flex flex-col">
                      <div className="flex-1">
                        <h3 className="text-lg lg:text-xl font-bold mb-2 lg:mb-3 group-hover:text-primary transition-colors">
                          {room.title}
                        </h3>
                        
                        <p className="text-muted-foreground text-xs lg:text-sm mb-3 lg:mb-4 line-clamp-2">
                          {room.shortDescription || room.description}
                        </p>
                        
                        {room.metadata?.features && room.metadata.features.length > 0 && (
                          <div className="space-y-1.5 lg:space-y-2 mb-3 lg:mb-4">
                            {room.metadata.features.slice(0, 2).map((feature: string, idx: number) => (
                              <div key={idx} className="flex items-center gap-2 text-xs lg:text-sm text-muted-foreground">
                                <CheckCircle className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-primary flex-shrink-0" />
                                <span className="line-clamp-1">{feature}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between pt-3 lg:pt-4 border-t border-border/50">
                        {!isPaidPlan && (
                          <div className="text-xs lg:text-sm font-medium">
                            {room.price ? (
                              <span className="text-primary">
                                ${(room.price / 100).toFixed(0)} USD
                              </span>
                            ) : (
                              <span className="text-muted-foreground">Gratis</span>
                            )}
                          </div>
                        )}
                        <Button variant="ghost" size="sm" className="text-xs lg:text-sm h-8 lg:h-9 px-3 lg:px-4 group-hover:bg-primary group-hover:text-primary-foreground ml-auto">
                          Ver programa →
                        </Button>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {rooms.length === 0 && (
              <div className="text-center py-16">
                <p className="text-muted-foreground text-lg">No hay programas disponibles en este momento.</p>
              </div>
            )}
          </div>

          {/* Mobile Content */}
          <div className="lg:hidden px-4 pb-6">
            <div className="space-y-4">
              {rooms.map((room: any) => (
                <Link key={room.id} href={`/sala/${room.slug}`}>
                  <div className="group relative bg-card rounded-xl border border-border overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer">
                    {/* Background Image/Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-background opacity-50 group-hover:opacity-70 transition-opacity" />
                    
                    {room.coverImageUrl && (
                      <div 
                        className="absolute inset-0 bg-cover bg-center opacity-30 group-hover:opacity-40 transition-opacity"
                        style={{ backgroundImage: `url(${room.coverImageUrl})` }}
                      />
                    )}
                    
                    {/* Content */}
                    <div className="relative p-4 flex flex-col min-h-[200px]">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors">
                          {room.title}
                        </h3>
                        
                        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                          {room.shortDescription || room.description}
                        </p>
                        
                        {room.metadata?.features && room.metadata.features.length > 0 && (
                          <div className="space-y-1.5 mb-3">
                            {room.metadata.features.slice(0, 2).map((feature: string, idx: number) => (
                              <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CheckCircle className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                                <span className="line-clamp-1">{feature}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between pt-3 border-t border-border/50">
                        {!isPaidPlan && (
                          <div className="text-sm font-medium">
                            {room.price ? (
                              <span className="text-primary">
                                ${(room.price / 100).toFixed(0)} USD
                              </span>
                            ) : (
                              <span className="text-muted-foreground">Gratis</span>
                            )}
                          </div>
                        )}
                        <Button variant="ghost" size="sm" className="text-sm h-8 px-3 group-hover:bg-primary group-hover:text-primary-foreground ml-auto">
                          Ver programa →
                        </Button>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {rooms.length === 0 && (
              <div className="text-center py-16">
                <p className="text-muted-foreground">No hay programas disponibles en este momento.</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
}
