import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useSimpleAuth } from "@/hooks/use-simple-auth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import MobileHeader from "@/components/layout/mobile-header";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Check } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isSameDay, isToday, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Link, useRoute, useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type?: string;
  category?: string;
  startTime?: string;
  endTime?: string;
  hostName?: string;
  hostAvatar?: string;
  hostRole?: string;
  isLive?: boolean;
  joinUrl?: string;
  description?: string;
  registrationsCount?: number;
  eventImage?: string;
}

export default function Events() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useSimpleAuth();
  const [, setLocation] = useLocation();
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerFirstName, setRegisterFirstName] = useState("");
  const [registerLastName, setRegisterLastName] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");

  // Fetch events from API
  const { data: events = [] } = useQuery<CalendarEvent[]>({
    queryKey: ["/api/events"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/events", { credentials: "include" });
        if (!res.ok) return [];
        return res.json();
      } catch {
        return [];
      }
    },
  });

  // Check registration status for selected event
  const { data: registrationStatus } = useQuery({
    queryKey: ["/api/events", selectedEvent?.id, "registration-status", user?.id],
    queryFn: async () => {
      if (!selectedEvent?.id) return { registered: false };
      try {
        const params = new URLSearchParams();
        if (user?.email) params.append("email", user.email);
        const res = await fetch(`/api/events/${selectedEvent.id}/registration-status?${params}`, {
          credentials: "include",
        });
        if (!res.ok) return { registered: false };
        return res.json();
      } catch {
        return { registered: false };
      }
    },
    enabled: !!selectedEvent?.id,
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (data: { email: string; firstName?: string; lastName?: string; phone?: string }) => {
      const res = await fetch(`/api/events/${selectedEvent?.id}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to register");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", selectedEvent?.id, "registration-status"] });
      setShowRegisterDialog(false);
      setRegisterEmail("");
      setRegisterFirstName("");
      setRegisterLastName("");
      setRegisterPhone("");
      toast({
        title: "¡Registro exitoso!",
        description: "Te hemos enviado un email de confirmación. Revisa tu bandeja de entrada.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo completar el registro",
        variant: "destructive",
      });
    },
  });

  // Use events from API, fallback to empty array (no mock data)
  const calendarEvents: CalendarEvent[] = events;

  // Generate calendar days including days from previous/next month to fill the grid
  const generateCalendarDays = () => {
    const startDate = startOfMonth(currentMonth);
    const endDate = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    // Add days from previous month to fill the first week
    const startDay = getDay(startDate);
    const prevMonthDays: Date[] = [];
    if (startDay > 0) {
      const prevMonth = subMonths(startDate, 1);
      const prevMonthEnd = endOfMonth(prevMonth);
      for (let i = startDay - 1; i >= 0; i--) {
        const day = new Date(prevMonthEnd);
        day.setDate(prevMonthEnd.getDate() - i);
        prevMonthDays.push(day);
      }
    }
    
    // Add days from next month to complete the grid (6 rows = 42 cells)
    const allDays = [...prevMonthDays, ...days];
    const remainingDays = 42 - allDays.length;
    const nextMonthDays: Date[] = [];
    if (remainingDays > 0) {
      const nextMonth = addMonths(startDate, 1);
      for (let i = 1; i <= remainingDays; i++) {
        const day = new Date(nextMonth);
        day.setDate(i);
        nextMonthDays.push(day);
      }
    }
    
    return [...allDays, ...nextMonthDays];
  };

  const calendarDays = generateCalendarDays();

  // Get event for a specific day
  const getEventForDay = (day: Date) => {
    return calendarEvents.find(event => {
      const eventDate = parseISO(event.date);
      return isSameDay(eventDate, day);
    });
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Acceso requerido",
        description: "Debes iniciar sesión para ver los eventos",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/simple-login";
      }, 500);
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex">
        <div className="w-[250px] bg-card border-r border-border"></div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white">Cargando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white">
      {/* Mobile Header */}
      <MobileHeader />
      
      <div className="flex">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main Content */}
        <main className="flex-1 overflow-auto pb-20 lg:pb-0 md:ml-16 lg:ml-[250px] min-h-screen">
          <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8 h-full">
            {/* Header Section */}
                <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">Próximos talleres</h1>
              <p className="text-gray-400 text-sm sm:text-base">
                Consulta nuestro calendario de eventos en vivo y regístrate para participar en sesiones de talleres en tiempo real
              </p>
              </div>

            {/* Todos los eventos section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <CalendarIcon className="h-5 w-5 text-white" />
                <h2 className="text-base sm:text-lg font-semibold text-white">Todos los eventos</h2>
              </div>
              <Link href="/workshops">
                <Button 
                  variant="outline" 
                  className="border-border bg-transparent text-foreground hover:bg-muted hover:text-foreground text-sm w-full sm:w-auto"
                >
                  Ver todos los eventos
                </Button>
              </Link>
              </div>

            {/* Calendar - Full width */}
            <div className="bg-card rounded-xl border border-border overflow-hidden flex-1">
              {/* Month navigation header */}
              <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
                <h3 className="text-base sm:text-lg font-semibold text-white capitalize">
                  {format(currentMonth, "MMMM 'de' yyyy", { locale: es })}
                </h3>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    className="h-8 w-8 text-gray-400 hover:text-white hover:bg-muted"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    className="h-8 w-8 text-gray-400 hover:text-white hover:bg-muted"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Calendar grid */}
              <div className="border-t border-border">
                {/* Days of week header */}
                <div className="grid grid-cols-7 border-b border-border">
                  {['Domingo', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day, idx) => (
                    <div 
                      key={day} 
                      className={`text-center text-xs sm:text-sm font-medium text-gray-400 py-2 sm:py-3 ${
                        idx < 6 ? 'border-r border-border' : ''
                      }`}
                    >
                      <span className="hidden sm:inline">{day}</span>
                      <span className="sm:hidden">{day.slice(0, 3)}</span>
                    </div>
                  ))}
                </div>

                {/* Calendar days - 6 rows */}
                <div className="grid grid-cols-7">
                  {calendarDays.map((day, index) => {
                    const isCurrentMonth = isSameMonth(day, currentMonth);
                    const isCurrentDay = isToday(day);
                    const event = getEventForDay(day);
                    const dayNumber = day.getDate();
                    
                    // Calculate border classes
                    const isLastColumn = (index + 1) % 7 === 0;
                    const isLastRow = index >= 35;
                    
                    return (
                      <div
                        key={index}
                        className={`min-h-[60px] sm:min-h-[80px] md:min-h-[100px] lg:min-h-[110px] xl:min-h-[120px] p-1 sm:p-2 relative ${
                          !isLastColumn ? 'border-r border-border' : ''
                        } ${!isLastRow ? 'border-b border-border' : ''}`}
                      >
                        {/* Day number */}
                        <div className="flex items-start justify-start">
                          {isCurrentDay ? (
                            <span className="flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white text-black text-xs sm:text-sm font-medium">
                              {dayNumber}
                            </span>
                          ) : (
                            <span className={`text-xs sm:text-sm ${
                              isCurrentMonth 
                                ? 'text-white' 
                                : 'text-yellow-500'
                            }`}>
                          {dayNumber}
                        </span>
                          )}
                        </div>
                        
                        {/* Event */}
                        {event && (
                          <div className="mt-1 sm:mt-2">
                            <div 
                              onClick={() => setSelectedEvent(event)}
                              className="bg-muted border border-border rounded px-1 sm:px-2 py-1 sm:py-1.5 text-[10px] sm:text-xs text-muted-foreground line-clamp-2 sm:line-clamp-3 hover:bg-background hover:border-cyan-500 cursor-pointer transition-colors"
                            >
                              <span className="hidden sm:inline">{event.title}</span>
                              <span className="sm:hidden">{event.title.slice(0, 20)}...</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      
      {/* Mobile Navigation */}
      <MobileNav />

      {/* Registration Form Dialog */}
      <Dialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog}>
        <DialogContent className="bg-background border-border text-foreground max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">
              Registrarse en el evento
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {selectedEvent?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="register-email" className="text-foreground">Email *</Label>
              <Input
                id="register-email"
                type="email"
                value={registerEmail || user?.email || ""}
                onChange={(e) => setRegisterEmail(e.target.value)}
                placeholder="tu@email.com"
                className="bg-card border-border text-foreground mt-1"
                disabled={!!user?.email}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="register-firstname" className="text-foreground">Nombre</Label>
                <Input
                  id="register-firstname"
                  value={registerFirstName || user?.firstName || ""}
                  onChange={(e) => setRegisterFirstName(e.target.value)}
                  placeholder="Tu nombre"
                  className="bg-card border-border text-foreground mt-1"
                  disabled={!!user?.firstName}
                />
              </div>
              <div>
                <Label htmlFor="register-lastname" className="text-foreground">Apellido</Label>
                <Input
                  id="register-lastname"
                  value={registerLastName || user?.lastName || ""}
                  onChange={(e) => setRegisterLastName(e.target.value)}
                  placeholder="Tu apellido"
                  className="bg-card border-border text-foreground mt-1"
                  disabled={!!user?.lastName}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="register-phone" className="text-foreground">Teléfono (opcional)</Label>
              <Input
                id="register-phone"
                type="tel"
                value={registerPhone}
                onChange={(e) => setRegisterPhone(e.target.value)}
                placeholder="+57 300 123 4567"
                className="bg-card border-border text-foreground mt-1"
              />
            </div>
            <Button
              onClick={() => {
                if (!registerEmail && !user?.email) {
                  toast({
                    title: "Error",
                    description: "El email es requerido",
                    variant: "destructive",
                  });
                  return;
                }
                registerMutation.mutate({
                  email: registerEmail || user?.email || "",
                  firstName: registerFirstName || user?.firstName || undefined,
                  lastName: registerLastName || user?.lastName || undefined,
                  phone: registerPhone || undefined,
                });
              }}
              disabled={registerMutation.isPending}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {registerMutation.isPending ? "Registrando..." : "Confirmar Registro"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Event Details Dialog - Rediseñado como imagen 1 */}
      <Dialog open={!!selectedEvent && !showRegisterDialog} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent className="bg-[#1a1a1a] border-border text-foreground max-w-3xl p-0 gap-0 overflow-hidden">
          {selectedEvent && (
            <div className="bg-muted rounded-lg border border-border">
              {/* Main Content Card */}
              <div className="flex flex-col md:flex-row">
                {/* Left Section - Text Content */}
                <div className="flex-1 p-6 md:p-8 space-y-4">
                  {/* Category Badge and Logo */}
                  <div className="flex items-center gap-2 mb-2">
                    {selectedEvent.category && (
                      <div className="inline-flex items-center px-3 py-1.5 bg-white text-black rounded-md text-xs font-medium border border-red-500">
                        {selectedEvent.category}
                      </div>
                    )}
                    {/* Logo - NoCode IA */}
                    <div className="text-[20px] font-bold text-white">
                      NoCode IA
                    </div>
                  </div>

                  {/* Title */}
                  <DialogTitle className="text-2xl md:text-3xl font-bold text-white leading-tight">
                    {selectedEvent.title}
                  </DialogTitle>

                  {/* Host Info */}
                  {selectedEvent.hostName && (
                    <div className="flex items-center gap-2 text-gray-400">
                      <div className="w-4 h-4 rounded-full bg-gray-600 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                      </div>
                      <span className="text-sm">Presentado por {selectedEvent.hostName}</span>
                    </div>
                  )}

                  {/* Date and Time */}
                  {selectedEvent.startTime && (
                    <div className="text-sm text-gray-400 pt-2">
                      {format(new Date(selectedEvent.startTime), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es }).replace(/^\w/, c => c.toUpperCase())} • {format(new Date(selectedEvent.startTime), "hh:mm a", { locale: es }).toUpperCase()} - {selectedEvent.endTime && format(new Date(selectedEvent.endTime), "hh:mm a", { locale: es }).toUpperCase()}
                    </div>
                  )}

                  {/* Description - Preview only (plain text, truncated) */}
                  {selectedEvent.description && (
                    <div className="text-sm text-muted-foreground leading-relaxed pt-2 line-clamp-4">
                      {/* Strip HTML tags for preview */}
                      {selectedEvent.description.replace(/<[^>]*>/g, '').substring(0, 200)}
                      {selectedEvent.description.replace(/<[^>]*>/g, '').length > 200 && '...'}
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="pt-4">
                    <Button
                      onClick={() => {
                        setLocation(`/calendar-events/${selectedEvent.id}`);
                      }}
                      className="w-full md:w-auto bg-primary text-primary-foreground hover:bg-primary/90"
                      size="lg"
                    >
                      Ver detalles del evento
                    </Button>
                  </div>
                </div>

                {/* Right Section - Host Avatar (Cuadrado y Grande) */}
                {selectedEvent.hostAvatar && (
                  <div className="md:w-64 md:flex-shrink-0 p-6 md:p-8 flex items-center justify-center md:items-start md:justify-end">
                    <img
                      src={selectedEvent.hostAvatar}
                      alt={selectedEvent.hostName || "Host"}
                      className="w-48 h-48 md:w-56 md:h-56 rounded-lg object-cover border border-[#444] shadow-xl"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
