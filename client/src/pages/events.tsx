import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import MobileHeader from "@/components/layout/mobile-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Clock, MapPin, Users, ExternalLink, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isSameDay, isToday } from "date-fns";
import { es } from "date-fns/locale";

export default function Events() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Mock data for upcoming workshops
  const upcomingWorkshops = [
    {
      id: "workshop-1",
      title: "Consejos esenciales de ChatGPT: últimas funciones y casos prácticos",
      instructor: "Juan García",
      date: new Date("2025-08-29T15:00:00"),
      imageUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=300&fit=crop",
      type: "General",
      registrationUrl: "#"
    },
    {
      id: "workshop-2", 
      title: "Introducción al desarrollo agente con Warp",
      instructor: "Ana Martínez",
      date: new Date("2025-09-05T15:00:00"),
      imageUrl: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=300&fit=crop",
      type: "Codificación",
      registrationUrl: "#"
    },
    {
      id: "workshop-3",
      title: "Crea tu propio agente de IA: automatiza las tareas diarias con flujos de trabajo personalizados",
      instructor: "Carlos Rodríguez",
      date: new Date("2025-09-20T15:00:00"),
      imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop",
      type: "Agentes de IA",
      registrationUrl: "#"
    }
  ];

  // Calendar events data
  const calendarEvents = [
    { date: 1, title: "Dominando la iniciación: Técnicas avanzadas..." },
    { date: 8, title: "Cómo ejecutar los modelos de próxima generación..." },
    { date: 13, title: "Dominando los agentes de IA para automatización..." },
    { date: 22, title: "Taller de la Fundación de IA: nueva temática para principiantes..." },
    { date: 28, title: "Consejos esenciales de ChatGPT..." }
  ];

  // Generate calendar days
  const generateCalendarDays = () => {
    const startDate = startOfMonth(currentMonth);
    const endDate = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    // Add empty cells for days before the first day of the month
    const startDay = getDay(startDate);
    const emptyDays = Array(startDay).fill(null);
    
    return [...emptyDays, ...days];
  };

  const calendarDays = generateCalendarDays();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-bg flex">
        <div className="w-[250px] bg-dark-card border-r border-dark-border"></div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white">Loading...</div>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-[#171717] text-white">
      {/* Mobile Header */}
      <MobileHeader />
      
      <div className="flex">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main Content */}
        <main className="flex-1 overflow-auto pb-20 lg:pb-0 md:ml-16 lg:ml-[250px]">
          <div className="p-6 space-y-6">
            {/* Próximos talleres section */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-white">Próximos talleres</h1>
                  <p className="text-gray-400 text-sm">
                    Ve nuestro calendario de eventos en vivo y regístrate para participar en sesiones de talleres en tiempo real.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingWorkshops.map((workshop) => (
                  <Card key={workshop.id} className="bg-[#262626] border-[#333] overflow-hidden hover:border-[#444] transition-colors">
                    <div className="relative">
                      <img 
                        src={workshop.imageUrl} 
                        alt={workshop.title}
                        className="w-full h-32 object-cover"
                      />
                      <div className="absolute top-2 left-2">
                        <Badge className="bg-gray-800/80 text-white text-xs">
                          {workshop.type}
                        </Badge>
                      </div>
                      <div className="absolute top-2 right-2">
                        <div className="flex gap-1">
                          <div className="w-6 h-6 bg-gray-800/80 rounded flex items-center justify-center">
                            <CalendarIcon className="h-3 w-3 text-white" />
                          </div>
                          <div className="w-6 h-6 bg-gray-800/80 rounded flex items-center justify-center">
                            <Users className="h-3 w-3 text-white" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-white text-sm mb-2 line-clamp-2">
                        {workshop.title}
                      </h3>
                      <p className="text-xs text-gray-400 mb-3">
                        Presentado por {workshop.instructor}
                      </p>
                      <p className="text-xs text-gray-400 mb-3">
                        {format(workshop.date, "d 'de' MMMM 'formato a las' HH:mm", { locale: es })}
                      </p>
                      <Button className="w-full bg-gray-700 hover:bg-gray-600 text-white text-xs h-8">
                        Detalles del evento y confirmación de asistencia
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* A continuación section */}
            <section className="bg-[#1a1a1a] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <CalendarIcon className="h-5 w-5 text-white" />
                <h2 className="text-lg font-semibold text-white">A continuación</h2>
              </div>
              <p className="text-gray-400 text-sm">
                ¡Mantente atento! Más contenido próximamente.
              </p>
            </section>

            {/* Todos los eventos section */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Todos los eventos</h2>
                <p className="text-sm text-gray-400">Ver todos los talleres a demanda</p>
              </div>

              {/* Month navigation */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    className="text-gray-400 hover:text-white"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <h3 className="text-lg font-semibold text-white">
                    {format(currentMonth, "MMMM 'de' yyyy", { locale: es })}
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    className="text-gray-400 hover:text-white"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Calendar grid */}
              <div className="bg-[#262626] rounded-lg p-4">
                {/* Days of week header */}
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
                    <div key={day} className="text-center text-xs font-medium text-gray-400 p-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar days */}
                <div className="grid grid-cols-7 gap-2">
                  {calendarDays.map((day, index) => {
                    if (!day) {
                      return <div key={index} className="aspect-square" />;
                    }
                    
                    const dayNumber = day.getDate();
                    const isCurrentMonth = isSameMonth(day, currentMonth);
                    const isCurrentDay = isToday(day);
                    const hasEvent = calendarEvents.find(event => event.date === dayNumber);
                    
                    return (
                      <div
                        key={index}
                        className={`aspect-square border border-[#333] rounded p-2 relative ${
                          isCurrentDay ? 'bg-[#333]' : 'bg-[#1a1a1a]'
                        } ${!isCurrentMonth ? 'opacity-30' : ''}`}
                      >
                        <span className={`text-sm ${isCurrentDay ? 'text-white font-bold' : 'text-gray-300'}`}>
                          {dayNumber}
                        </span>
                        {hasEvent && (
                          <div className="absolute bottom-1 left-1 right-1">
                            <div className="text-xs text-gray-300 truncate">
                              {hasEvent.title}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
      
      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
}