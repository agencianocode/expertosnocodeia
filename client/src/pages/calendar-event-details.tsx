import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useSimpleAuth } from "@/hooks/use-simple-auth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import MobileHeader from "@/components/layout/mobile-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ArrowLeft, 
  Calendar as CalendarIcon, 
  Clock, 
  Globe, 
  Check, 
  ExternalLink,
  Users,
  User,
  GraduationCap
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { queryClient } from "@/lib/queryClient";
import universidadLogo from "@/assets/universidad-logo.png";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface EventDetails {
  id: string;
  title: string;
  description: string;
  type?: string;
  category?: string;
  startTime: string;
  endTime: string;
  timeZone?: string;
  hostName?: string;
  hostAvatar?: string;
  hostRole?: string;
  eventImage?: string;
  joinUrl?: string;
  registrationsCount?: number;
  maxCapacity?: number;
  learningPoints?: string[];
  targetAudience?: string[];
}

export default function CalendarEventDetails() {
  const [, params] = useRoute("/calendar-events/:eventId");
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useSimpleAuth();
  const { toast } = useToast();
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerFirstName, setRegisterFirstName] = useState("");
  const [registerLastName, setRegisterLastName] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");

  const eventId = params?.eventId;

  // Fetch event details
  const { data: event, isLoading } = useQuery<EventDetails>({
    queryKey: ["/api/events", eventId],
    enabled: !!eventId,
  });

  // Check registration status
  const { data: registrationStatus, refetch: refetchRegistration } = useQuery({
    queryKey: ["/api/events", eventId, "registration-status"],
    queryFn: async () => {
      if (!eventId) return { registered: false };
      try {
        const params = new URLSearchParams();
        if (user?.email) params.append("email", user.email);
        const res = await fetch(`/api/events/${eventId}/registration-status?${params}`, {
          credentials: "include",
        });
        if (!res.ok) return { registered: false };
        return res.json();
      } catch {
        return { registered: false };
      }
    },
    enabled: !!eventId,
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (data: { email: string; firstName?: string; lastName?: string; phone?: string }) => {
      const res = await fetch(`/api/events/${eventId}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error al registrarse");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "¡Registro exitoso!",
        description: "Te hemos enviado un email de confirmación con los detalles del evento.",
      });
      setShowRegisterDialog(false);
      refetchRegistration();
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo completar el registro",
        variant: "destructive",
      });
    },
  });

  const handleRegister = () => {
    if (!isAuthenticated) {
      toast({
        title: "Inicia sesión",
        description: "Debes iniciar sesión para registrarte en eventos.",
        variant: "destructive",
      });
      setLocation("/login");
      return;
    }
    setShowRegisterDialog(true);
  };

  const handleAddToCalendar = () => {
    if (!event) return;
    
    // Crear archivo .ics para agregar al calendario
    const startDate = new Date(event.startTime);
    const endDate = new Date(event.endTime);
    
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Expertos NoCode IA//Event//ES',
      'BEGIN:VEVENT',
      `UID:${event.id}@expertosnocodeia.com`,
      `DTSTAMP:${formatDateForICS(new Date())}`,
      `DTSTART:${formatDateForICS(startDate)}`,
      `DTEND:${formatDateForICS(endDate)}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description?.replace(/\n/g, '\\n') || ''}`,
      `ORGANIZER;CN=${event.hostName || 'Expertos NoCode IA'}:noreply@expertosnocodeia.com`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Calendario descargado",
      description: "Abre el archivo para agregar el evento a tu calendario.",
    });
  };

  const handleDownloadICS = () => {
    if (!event) return;
    
    // Crear archivo .ics para agregar al calendario
    const startDate = new Date(event.startTime);
    const endDate = new Date(event.endTime);
    
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Expertos NoCode IA//Event//ES',
      'BEGIN:VEVENT',
      `UID:${event.id}@expertosnocodeia.com`,
      `DTSTAMP:${formatDateForICS(new Date())}`,
      `DTSTART:${formatDateForICS(startDate)}`,
      `DTEND:${formatDateForICS(endDate)}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description?.replace(/<[^>]*>/g, '').replace(/\n/g, '\\n') || ''}`,
      `ORGANIZER;CN=${event.hostName || 'Expertos NoCode IA'}:noreply@expertosnocodeia.com`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Calendario descargado",
      description: "Abre el archivo para agregar el evento a tu calendario.",
    });
  };

  const handleGoogleCalendar = () => {
    if (!event) return;
    
    const startDate = new Date(event.startTime);
    const endDate = new Date(event.endTime);
    
    // Format dates for Google Calendar URL (YYYYMMDDTHHMMSSZ)
    const formatGoogleDate = (date: Date) => {
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      const hours = String(date.getUTCHours()).padStart(2, '0');
      const minutes = String(date.getUTCMinutes()).padStart(2, '0');
      const seconds = String(date.getUTCSeconds()).padStart(2, '0');
      return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
    };
    
    const details = event.description?.replace(/<[^>]*>/g, '').substring(0, 500) || '';
    const location = event.joinUrl ? `${window.location.origin}${event.joinUrl}` : '';
    
    const googleCalendarUrl = new URL('https://calendar.google.com/calendar/render');
    googleCalendarUrl.searchParams.set('action', 'TEMPLATE');
    googleCalendarUrl.searchParams.set('text', event.title);
    googleCalendarUrl.searchParams.set('dates', `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`);
    googleCalendarUrl.searchParams.set('details', details);
    if (location) {
      googleCalendarUrl.searchParams.set('location', location);
    }
    
    window.open(googleCalendarUrl.toString(), '_blank');
  };

  const formatDateForICS = (date: Date): string => {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');
    return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Cargando evento...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Evento no encontrado</h2>
          <Button onClick={() => setLocation("/events")} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a eventos
          </Button>
        </div>
      </div>
    );
  }

  const isUpcoming = new Date(event.startTime) > new Date();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Mobile Header */}
      <MobileHeader />

      <div className="flex">
        {/* Sidebar - Hidden on mobile */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        {/* Main Content */}
        <main className="flex-1 lg:ml-[250px] min-h-screen bg-[#1a1a1a] pb-20 lg:pb-0">
          <div className="px-4 py-6 max-w-7xl ml-4 lg:ml-16">
            {/* Back Button */}
            <Button
              variant="ghost"
              onClick={() => setLocation("/events")}
              className="mb-4 text-gray-400 hover:text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al calendario de talleres
            </Button>

            {/* Hero Banner - Black Background with Large Photo */}
            <div className="bg-black rounded-lg overflow-hidden mb-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 md:p-8">
                {/* Left: Event Info */}
                <div className="flex-1 space-y-3">
                  {/* Category Badge and Logo */}
                  <div className="flex items-center gap-2">
                    {event.category && (
                      <div className="inline-flex items-center px-3 py-1.5 bg-white text-black rounded-md text-xs font-medium border border-red-500">
                        {event.category}
                      </div>
                    )}
                    {/* Logo - NoCode IA */}
                    <div className="text-[20px] font-bold text-white">
                      NoCode IA
                    </div>
                  </div>
                  
                  {/* Title */}
                  <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                    {event.title}
                  </h1>
                  
                  {/* Host Name */}
                  {event.hostName && (
                    <p className="text-base text-gray-300">
                      Presentado por {event.hostName}
                    </p>
                  )}
                </div>

                {/* Right: Large Host Avatar */}
                {event.hostAvatar && (
                  <div className="mt-4 md:mt-0 md:ml-6 flex-shrink-0">
                    <img
                      src={event.hostAvatar}
                      alt={event.hostName || "Host"}
                      className="w-32 h-32 md:w-40 md:h-40 rounded-lg object-cover border-2 border-[#333] shadow-xl"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="grid lg:grid-cols-5 gap-8">
              {/* Left Column: Main Content */}
              <div className="lg:col-span-3 space-y-8">
                {/* Header with Title and Host */}
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                    {event.title}
                  </h2>
                  {event.hostName && (
                    <div className="flex items-center gap-2 mb-6">
                      {event.hostAvatar && (
                        <img
                          src={event.hostAvatar}
                          alt={event.hostName}
                          className="w-8 h-8 rounded-full object-cover border border-[#444]"
                        />
                      )}
                      <span className="text-sm text-gray-400">
                        Presentado por <span className="text-primary">{event.hostName}</span>
                      </span>
                    </div>
                  )}
                </div>

                {/* About This Workshop */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Acerca de este taller
                  </h3>
                  <div 
                    className="text-gray-300 leading-relaxed [&_p]:mb-4 [&_p]:text-gray-300 [&_strong]:text-white [&_strong]:font-semibold [&_em]:text-gray-200 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_li]:mb-2 [&_li]:text-gray-300 [&_h1]:text-white [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h2]:text-white [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-3 [&_h3]:text-white [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mb-2 [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-400 [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-primary [&_pre]:bg-muted [&_pre]:p-4 [&_pre]:rounded [&_pre]:overflow-x-auto [&_a]:text-primary [&_a]:underline [&_a]:hover:text-primary/80"
                    dangerouslySetInnerHTML={{ __html: event.description || '' }}
                  />
                </div>

                {/* Learning Points */}
                {event.learningPoints && event.learningPoints.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Aprenderás a:
                    </h3>
                    <ul className="space-y-4">
                      {event.learningPoints.map((point, idx) => {
                        // Split point if it contains sub-points (separated by newline or special chars)
                        const parts = point.split('\n').filter(p => p.trim());
                        return (
                          <li key={idx} className="space-y-2">
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                                <span className="text-primary text-xs font-bold">{idx + 1}</span>
                              </div>
                              <span className="text-white font-medium">{parts[0]}</span>
                            </div>
                            {parts.length > 1 && (
                              <div className="pl-9">
                                {parts.slice(1).map((subPoint, subIdx) => (
                                  <p key={subIdx} className="text-gray-400 text-sm mb-1">
                                    {subPoint.trim()}
                                  </p>
                                ))}
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {/* Target Audience */}
                {event.targetAudience && event.targetAudience.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Este taller es para ti si...
                    </h3>
                    <ul className="space-y-3">
                      {event.targetAudience.map((audience, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                            <Check className="h-3 w-3 text-primary" />
                          </div>
                          <span className="text-gray-300">{audience}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              </div>

              {/* Right Column: Event Details & Actions */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="bg-[#282828] border-[#333] sticky top-6">
                  <CardContent className="p-6 space-y-6">
                    {/* Upcoming Badge */}
                    {isUpcoming && (
                      <div className="flex justify-end mb-2">
                        <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                          Próximamente
                        </Badge>
                      </div>
                    )}

                    {/* Date */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CalendarIcon className="h-4 w-4 text-primary" />
                        <p className="text-sm font-medium text-white">Fecha</p>
                      </div>
                      <p className="text-sm text-gray-400 pl-6">
                        {format(new Date(event.startTime), "d 'de' MMMM 'de' yyyy", { locale: es })}
                      </p>
                    </div>

                    {/* Time */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="h-4 w-4 text-primary" />
                        <p className="text-sm font-medium text-white">Tiempo</p>
                      </div>
                      <p className="text-sm text-gray-400 pl-6">
                        {format(new Date(event.startTime), "hh:mm a", { locale: es }).toUpperCase()} - {format(new Date(event.endTime), "hh:mm a", { locale: es }).toUpperCase()}
                      </p>
                    </div>

                    {/* Time Zone */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Globe className="h-4 w-4 text-primary" />
                        <p className="text-sm font-medium text-white">Zona horaria</p>
                      </div>
                      <p className="text-sm text-gray-400 pl-6">
                        {event.timeZone || "Hora estándar de Colombia"}
                      </p>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-[#333]"></div>

                    {/* Registration Status & Actions */}
                    {registrationStatus?.registered ? (
                      <div className="space-y-3">
                        {/* Confirmed Badge */}
                        <Button
                          disabled
                          className="w-full bg-green-600 hover:bg-green-600 text-white cursor-default"
                          size="lg"
                        >
                          <Check className="mr-2 h-4 w-4" />
                          RSVP confirmada
                        </Button>

                        {/* Add to Calendar - Dropdown Menu */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full border-border text-foreground hover:bg-muted"
                              size="lg"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              Añadir al calendario
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-[#282828] border-[#333] text-foreground w-56">
                            <DropdownMenuItem
                              onClick={handleGoogleCalendar}
                              className="cursor-pointer hover:bg-[#333] text-white"
                            >
                              <div className="flex items-center justify-between w-full">
                                <span>Calendario de Google</span>
                                <ExternalLink className="h-3 w-3 ml-2" />
                              </div>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={handleDownloadICS}
                              className="cursor-pointer hover:bg-[#333] text-white"
                            >
                              Apple / Outlook / iCal
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Join Live Stream */}
                        <Button
                          onClick={() => {
                            window.location.href = `/live/${eventId}`;
                          }}
                          variant="outline"
                          className="w-full border-border text-foreground hover:bg-muted text-sm"
                          size="lg"
                        >
                          <ExternalLink className="mr-2 h-4 w-4 flex-shrink-0" />
                          <span className="text-left">Únase a la transmisión en vivo</span>
                        </Button>

                        {/* Attendees Count */}
                        {event.registrationsCount !== undefined && (
                          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-2">
                            <Users className="h-4 w-4" />
                            <span>{event.registrationsCount} en marcha</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* RSVP Button */}
                        <Button
                          onClick={handleRegister}
                          className="w-full bg-[#8B5CF6] hover:bg-[#7C3AED] text-white"
                          size="lg"
                        >
                          RSVP para este evento
                        </Button>

                        {/* Attendees Count */}
                        {event.registrationsCount !== undefined && (
                          <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                            <Users className="h-4 w-4" />
                            <span>{event.registrationsCount} en marcha</span>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Navigation */}
      <MobileNav />

      {/* Registration Dialog */}
      <Dialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog}>
        <DialogContent className="bg-background border-border text-foreground max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">
              Registrarse en el evento
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {event.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="email" className="text-foreground">Email *</Label>
              <Input
                id="email"
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
                <Label htmlFor="firstname" className="text-foreground">Nombre</Label>
                <Input
                  id="firstname"
                  value={registerFirstName || user?.firstName || ""}
                  onChange={(e) => setRegisterFirstName(e.target.value)}
                  placeholder="Tu nombre"
                  className="bg-card border-border text-foreground mt-1"
                  disabled={!!user?.firstName}
                />
              </div>
              <div>
                <Label htmlFor="lastname" className="text-foreground">Apellido</Label>
                <Input
                  id="lastname"
                  value={registerLastName || user?.lastName || ""}
                  onChange={(e) => setRegisterLastName(e.target.value)}
                  placeholder="Tu apellido"
                  className="bg-card border-border text-foreground mt-1"
                  disabled={!!user?.lastName}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="phone" className="text-foreground">Teléfono (opcional)</Label>
              <Input
                id="phone"
                type="tel"
                value={registerPhone}
                onChange={(e) => setRegisterPhone(e.target.value)}
                placeholder="+57 300 123 4567"
                className="bg-card border-border text-foreground mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Para recordatorios por WhatsApp
              </p>
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
    </div>
  );
}

