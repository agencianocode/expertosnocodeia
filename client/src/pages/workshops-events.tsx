import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useSimpleAuth } from "@/hooks/use-simple-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import MobileHeader from "@/components/layout/mobile-header";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
  Calendar,
  Clock,
  User,
  Monitor,
  Users,
  Radio,
  Check,
  Phone,
  Mail,
} from "lucide-react";
import { format, isPast, isFuture, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

interface Event {
  id: string;
  title: string;
  description?: string;
  hostName: string;
  hostAvatar?: string;
  hostRole?: string;
  startTime: string;
  endTime: string;
  eventType: string;
  isLive: boolean;
  joinUrl: string;
  registrationsCount?: number;
}

export default function WorkshopsEvents() {
  const { user } = useSimpleAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerFirstName, setRegisterFirstName] = useState("");
  const [registerLastName, setRegisterLastName] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");

  // Fetch events from API
  const { data: events = [], isLoading } = useQuery<Event[]>({
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

  // Separate upcoming and past events
  const now = new Date();
  const upcomingEvents = events
    .filter((event) => {
      const eventDate = new Date(event.startTime);
      return eventDate >= startOfDay(now);
    })
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const pastEvents = events
    .filter((event) => {
      const eventDate = new Date(event.startTime);
      return eventDate < startOfDay(now);
    })
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  // Get next event (first upcoming event)
  const nextEvent = upcomingEvents[0] || null;

  // Group events by month
  const groupEventsByMonth = (eventsList: Event[]) => {
    const grouped: { [key: string]: Event[] } = {};
    eventsList.forEach((event) => {
      const monthKey = format(new Date(event.startTime), "MMMM yyyy", { locale: es });
      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }
      grouped[monthKey].push(event);
    });
    return grouped;
  };

  const upcomingByMonth = groupEventsByMonth(upcomingEvents);
  const pastByMonth = groupEventsByMonth(pastEvents);

  // Check registration status
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
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
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

  useEffect(() => {
    if (user?.email) {
      setRegisterEmail(user.email);
    }
    if (user?.firstName) {
      setRegisterFirstName(user.firstName);
    }
    if (user?.lastName) {
      setRegisterLastName(user.lastName);
    }
  }, [user]);

  const handleRSVP = (event: Event) => {
    setSelectedEvent(event);
    setShowRegisterDialog(true);
  };

  const getTimeUntilEvent = (eventDate: Date) => {
    const now = new Date();
    const diff = eventDate.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `Starts in ${hours} hour${hours !== 1 ? 's' : ''}`;
    } else if (minutes > 0) {
      return `Starts in ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else {
      return "Starting now";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
        <div className="text-white">Cargando eventos...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white">
      <MobileHeader />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 overflow-auto pb-20 lg:pb-0 md:ml-16 lg:ml-[250px] min-h-screen">
          <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
            {/* Header with Tabs */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-6">Eventos</h1>
              
              {/* Tabs */}
              <div className="flex gap-2 border-b border-[#333]">
                <button
                  onClick={() => setActiveTab("upcoming")}
                  className={cn(
                    "px-4 py-2 font-medium transition-colors",
                    activeTab === "upcoming"
                      ? "text-white border-b-2 border-white"
                      : "text-gray-400 hover:text-white"
                  )}
                >
                  Upcoming
                </button>
                <button
                  onClick={() => setActiveTab("past")}
                  className={cn(
                    "px-4 py-2 font-medium transition-colors",
                    activeTab === "past"
                      ? "text-white border-b-2 border-white"
                      : "text-gray-400 hover:text-white"
                  )}
                >
                  Past
                </button>
              </div>
            </div>

            {activeTab === "upcoming" && (
              <div className="space-y-8">
                {/* Next Event Section */}
                {nextEvent && (
                  <div>
                    <h2 className="text-xl font-semibold text-white mb-4">Next event</h2>
                    <Card className="bg-[#1a1a1a] border-[#333] overflow-hidden">
                      {/* Event Image/Thumbnail */}
                      <div className="relative h-48 bg-gradient-to-br from-[#2a2a4a] to-[#1a1a2e] flex items-center justify-center">
                        {nextEvent.hostAvatar ? (
                          <Avatar className="h-32 w-32">
                            <AvatarImage src={nextEvent.hostAvatar} />
                            <AvatarFallback className="bg-[#4a4a6a] text-white text-2xl">
                              {nextEvent.hostName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="text-6xl">📅</div>
                        )}
                      </div>
                      
                      <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="text-2xl font-bold text-white mb-3">{nextEvent.title}</h3>
                            
                            <div className="space-y-2 text-gray-400 mb-4">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>
                                  {format(new Date(nextEvent.startTime), "EEEE, MMM d, h:mm a", { locale: es })} - {format(new Date(nextEvent.endTime), "h:mm a", { locale: es })}
                                </span>
                              </div>
                              
                              {nextEvent.description && (
                                <div className="flex items-start gap-2">
                                  <span className="text-yellow-400">⭐</span>
                                  <span className="text-sm">{nextEvent.description.split('\n')[0]}</span>
                                </div>
                              )}
                              
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span className="text-sm">
                                  {format(new Date(nextEvent.startTime), "EEEE, MMM d", { locale: es })}, {format(new Date(nextEvent.startTime), "h:mm a", { locale: es })}, {nextEvent.hostName} va a...
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <Button
                            onClick={() => handleRSVP(nextEvent)}
                            className="bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-2 h-auto"
                          >
                            RSVP
                          </Button>
                        </div>
                        
                        {/* Status Bar */}
                        <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-[#333] text-sm text-gray-400">
                          <Badge variant="outline" className="border-[#444] text-gray-300">
                            {getTimeUntilEvent(new Date(nextEvent.startTime))}
                          </Badge>
                          <div className="flex items-center gap-2">
                            <Monitor className="h-4 w-4" />
                            <span>Virtual event</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>{nextEvent.hostName}</span>
                          </div>
                          {nextEvent.registrationsCount !== undefined && (
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              <span>{nextEvent.registrationsCount} Attendees</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Upcoming Events by Month */}
                {Object.entries(upcomingByMonth).map(([month, monthEvents]) => (
                  <div key={month}>
                    <h2 className="text-xl font-semibold text-white mb-4 capitalize">{month}</h2>
                    <div className="space-y-3">
                      {monthEvents.map((event) => (
                        <Card key={event.id} className="bg-[#1a1a1a] border-[#333] hover:border-[#444] transition-colors">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                              {/* Avatar */}
                              <Avatar className="h-12 w-12 flex-shrink-0">
                                <AvatarImage src={event.hostAvatar} />
                                <AvatarFallback className="bg-[#333] text-white">
                                  {event.hostName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              
                              {/* Event Info */}
                              <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-semibold text-white mb-1">{event.title}</h3>
                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>
                                      {format(new Date(event.startTime), "EEEE, MMM d, h:mm a", { locale: es })} - {format(new Date(event.endTime), "h:mm a", { locale: es })}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Monitor className="h-3 w-3" />
                                    <span>Live room</span>
                                  </div>
                                </div>
                              </div>
                              
                              {/* RSVP Button */}
                              <Button
                                onClick={() => handleRSVP(event)}
                                className="bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 h-auto flex-shrink-0"
                              >
                                RSVP
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}

                {upcomingEvents.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <p>No hay eventos próximos programados.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "past" && (
              <div className="space-y-8">
                {Object.entries(pastByMonth).map(([month, monthEvents]) => (
                  <div key={month}>
                    <h2 className="text-xl font-semibold text-white mb-4 capitalize">{month}</h2>
                    <div className="space-y-3">
                      {monthEvents.map((event) => (
                        <Card key={event.id} className="bg-[#1a1a1a] border-[#333] hover:border-[#444] transition-colors opacity-75">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                              {/* Avatar */}
                              <Avatar className="h-12 w-12 flex-shrink-0">
                                <AvatarImage src={event.hostAvatar} />
                                <AvatarFallback className="bg-[#333] text-white">
                                  {event.hostName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              
                              {/* Event Info */}
                              <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-semibold text-white mb-1">{event.title}</h3>
                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>
                                      {format(new Date(event.startTime), "EEEE, MMM d, h:mm a", { locale: es })} - {format(new Date(event.endTime), "h:mm a", { locale: es })}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Monitor className="h-3 w-3" />
                                    <span>Live room</span>
                                  </div>
                                </div>
                              </div>
                              
                              {/* View Button */}
                              <Link href={`/events/${event.id}`}>
                                <Button
                                  variant="outline"
                                  className="border-[#444] text-gray-400 hover:text-white font-semibold px-4 py-2 h-auto flex-shrink-0"
                                >
                                  Ver detalles
                                </Button>
                              </Link>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}

                {pastEvents.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <p>No hay eventos pasados.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
      
      <MobileNav />

      {/* Registration Dialog */}
      <Dialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog}>
        <DialogContent className="bg-[#1a1a1a] border-[#333] text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-white">{selectedEvent.title}</DialogTitle>
                <DialogDescription className="text-gray-400">
                  {selectedEvent.startTime && (
                    <div className="mt-2 space-y-1">
                      <p>📅 {format(new Date(selectedEvent.startTime), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}</p>
                      <p>🕐 {format(new Date(selectedEvent.startTime), "h:mm a", { locale: es })} - {selectedEvent.endTime && format(new Date(selectedEvent.endTime), "h:mm a", { locale: es })}</p>
                      {selectedEvent.hostName && (
                        <p>👤 Anfitrión: {selectedEvent.hostName}{selectedEvent.hostRole && ` - ${selectedEvent.hostRole}`}</p>
                      )}
                      {selectedEvent.registrationsCount !== undefined && (
                        <p className="text-cyan-400">👥 {selectedEvent.registrationsCount} persona{selectedEvent.registrationsCount !== 1 ? 's' : ''} registrada{selectedEvent.registrationsCount !== 1 ? 's' : ''}</p>
                      )}
                    </div>
                  )}
                </DialogDescription>
              </DialogHeader>

              {selectedEvent.description && (
                <div className="mt-4 p-4 bg-[#262626] rounded-lg">
                  <p className="text-gray-300 text-sm whitespace-pre-wrap">{selectedEvent.description}</p>
                </div>
              )}

              <div className="mt-6 space-y-4">
                {registrationStatus?.registered ? (
                  <div className="bg-green-500/20 border border-green-500 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-green-400 mb-2">
                      <Check className="h-5 w-5" />
                      <span className="font-semibold">¡Ya estás registrado!</span>
                    </div>
                    <p className="text-sm text-gray-300 mb-4">
                      Te enviaremos recordatorios por email 24 horas antes y 1 hora antes del evento.
                    </p>
                    {selectedEvent.isLive ? (
                      <Link href={selectedEvent.joinUrl}>
                        <Button className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-semibold">
                          <Radio className="h-4 w-4 mr-2" />
                          Unirse al Evento en Vivo
                        </Button>
                      </Link>
                    ) : (
                      <Link href={`/events/${selectedEvent.id}`}>
                        <Button className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-semibold">
                          Ver Detalles
                        </Button>
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="bg-[#262626] rounded-lg p-4">
                    <h3 className="font-semibold text-white mb-3">Regístrate para este evento</h3>
                    <p className="text-sm text-gray-400 mb-4">
                      Recibirás un email de confirmación y recordatorios antes del evento.
                    </p>
                    
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="register-email" className="text-white">Email *</Label>
                        <Input
                          id="register-email"
                          type="email"
                          value={registerEmail || user?.email || ""}
                          onChange={(e) => setRegisterEmail(e.target.value)}
                          placeholder="tu@email.com"
                          className="bg-[#1a1a1a] border-[#444] text-white mt-1"
                          disabled={!!user?.email}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="register-firstname" className="text-white">Nombre</Label>
                          <Input
                            id="register-firstname"
                            value={registerFirstName || user?.firstName || ""}
                            onChange={(e) => setRegisterFirstName(e.target.value)}
                            placeholder="Tu nombre"
                            className="bg-[#1a1a1a] border-[#444] text-white mt-1"
                            disabled={!!user?.firstName}
                          />
                        </div>
                        <div>
                          <Label htmlFor="register-lastname" className="text-white">Apellido</Label>
                          <Input
                            id="register-lastname"
                            value={registerLastName || user?.lastName || ""}
                            onChange={(e) => setRegisterLastName(e.target.value)}
                            placeholder="Tu apellido"
                            className="bg-[#1a1a1a] border-[#444] text-white mt-1"
                            disabled={!!user?.lastName}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="register-phone" className="text-white">
                          <Phone className="h-3 w-3 inline mr-1" />
                          Teléfono (opcional, para WhatsApp)
                        </Label>
                        <Input
                          id="register-phone"
                          type="tel"
                          value={registerPhone}
                          onChange={(e) => setRegisterPhone(e.target.value)}
                          placeholder="+57 300 123 4567"
                          className="bg-[#1a1a1a] border-[#444] text-white mt-1"
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
                        className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold mt-4"
                      >
                        {registerMutation.isPending ? "Registrando..." : "RSVP"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

