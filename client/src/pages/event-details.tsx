import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useSimpleAuth } from "@/hooks/use-simple-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import MobileHeader from "@/components/layout/mobile-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Calendar, 
  Clock, 
  User, 
  Check, 
  X, 
  ArrowLeft,
  Radio,
  Users,
  Mail,
  Phone
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface EventDetails {
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

export default function EventDetails() {
  const [, params] = useRoute("/events/:eventId");
  const eventId = params?.eventId;
  const { user } = useSimpleAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerFirstName, setRegisterFirstName] = useState("");
  const [registerLastName, setRegisterLastName] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");

  // Fetch event details
  const { data: event, isLoading } = useQuery<EventDetails>({
    queryKey: ["/api/events", eventId],
    queryFn: async () => {
      const res = await fetch(`/api/community/live-event/${eventId}`);
      if (!res.ok) throw new Error("Event not found");
      return res.json();
    },
    enabled: !!eventId,
  });

  // Check registration status
  const { data: registrationStatus } = useQuery({
    queryKey: ["/api/events", eventId, "registration-status", user?.id],
    queryFn: async () => {
      if (!eventId) return { registered: false };
      const params = new URLSearchParams();
      if (user?.email) params.append("email", user.email);
      const res = await fetch(`/api/events/${eventId}/registration-status?${params}`, {
        credentials: "include",
      });
      if (!res.ok) return { registered: false };
      return res.json();
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
        throw new Error(error.message || "Failed to register");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "registration-status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId] });
      setShowRegisterDialog(false);
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

  // Cancel registration mutation
  const cancelMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/events/${eventId}/cancel-registration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: user?.email || registerEmail }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to cancel registration");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "registration-status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId] });
      toast({
        title: "Registro cancelado",
        description: "Tu registro ha sido cancelado exitosamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo cancelar el registro",
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
        <div className="text-white">Cargando evento...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Evento no encontrado</h1>
          <Button onClick={() => setLocation("/events")} className="bg-cyan-500 hover:bg-cyan-600 text-black">
            Volver al Calendario
          </Button>
        </div>
      </div>
    );
  }

  const eventDate = new Date(event.startTime);
  const eventEndDate = new Date(event.endTime);
  const isPast = eventEndDate < new Date();
  const isUpcoming = eventDate > new Date();

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white">
      <MobileHeader />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 overflow-auto pb-20 lg:pb-0 md:ml-16 lg:ml-[250px] min-h-screen">
          <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
            {/* Back button */}
            <Button
              variant="ghost"
              onClick={() => setLocation("/events")}
              className="mb-6 text-gray-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Calendario
            </Button>

            {/* Event Header */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                {event.isLive && (
                  <Badge className="bg-red-500 text-white animate-pulse">
                    <Radio className="h-3 w-3 mr-1" />
                    EN VIVO
                  </Badge>
                )}
                <Badge variant="outline" className="border-[#444] text-gray-400">
                  {event.eventType === "live" && "Live"}
                  {event.eventType === "workshop" && "Taller"}
                  {event.eventType === "webinar" && "Webinar"}
                  {event.eventType === "qa" && "Q&A"}
                </Badge>
              </div>
              
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">{event.title}</h1>
              
              <div className="flex flex-wrap items-center gap-4 text-gray-400 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{format(eventDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>
                    {format(eventDate, "h:mm a", { locale: es })} - {format(eventEndDate, "h:mm a", { locale: es })}
                  </span>
                </div>
                {event.registrationsCount !== undefined && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{event.registrationsCount} registrado{event.registrationsCount !== 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Host Info */}
            <Card className="bg-[#1a1a1a] border-[#333] mb-6">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={event.hostAvatar} />
                    <AvatarFallback className="bg-[#333] text-white text-xl">
                      {event.hostName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <User className="h-4 w-4 text-gray-400" />
                      <h3 className="text-lg font-semibold text-white">Anfitrión</h3>
                    </div>
                    <p className="text-white font-medium">{event.hostName}</p>
                    {event.hostRole && (
                      <p className="text-sm text-gray-400">{event.hostRole}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            {event.description && (
              <Card className="bg-[#1a1a1a] border-[#333] mb-6">
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold text-white mb-3">Acerca de este evento</h3>
                  <p className="text-gray-300 whitespace-pre-wrap">{event.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Registration Section */}
            {isUpcoming && (
              <Card className="bg-[#1a1a1a] border-[#333]">
                <CardContent className="p-6">
                  {registrationStatus?.registered ? (
                    <div className="space-y-4">
                      <div className="bg-green-500/20 border border-green-500 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-green-400 mb-2">
                          <Check className="h-5 w-5" />
                          <span className="font-semibold">¡Ya estás registrado!</span>
                        </div>
                        <p className="text-sm text-gray-300 mb-4">
                          Te enviaremos recordatorios por email 24 horas antes y 1 hora antes del evento.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3">
                          {event.isLive ? (
                            <Button
                              onClick={() => setLocation(event.joinUrl)}
                              className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold"
                            >
                              <Radio className="h-4 w-4 mr-2" />
                              Unirse al Evento en Vivo
                            </Button>
                          ) : (
                            <Button
                              onClick={() => setLocation(event.joinUrl)}
                              className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold"
                            >
                              Ver Detalles
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            onClick={() => {
                              if (confirm("¿Estás seguro de que quieres cancelar tu registro?")) {
                                cancelMutation.mutate();
                              }
                            }}
                            disabled={cancelMutation.isPending}
                            className="border-[#444] text-gray-400 hover:text-white"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancelar Registro
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-2">Regístrate para este evento</h3>
                        <p className="text-gray-400 text-sm mb-4">
                          Recibirás un email de confirmación y recordatorios antes del evento.
                        </p>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="register-email" className="text-white">Email *</Label>
                          <Input
                            id="register-email"
                            type="email"
                            value={registerEmail}
                            onChange={(e) => setRegisterEmail(e.target.value)}
                            placeholder="tu@email.com"
                            className="bg-[#262626] border-[#444] text-white mt-1"
                            disabled={!!user?.email}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="register-firstname" className="text-white">Nombre</Label>
                            <Input
                              id="register-firstname"
                              value={registerFirstName}
                              onChange={(e) => setRegisterFirstName(e.target.value)}
                              placeholder="Tu nombre"
                              className="bg-[#262626] border-[#444] text-white mt-1"
                              disabled={!!user?.firstName}
                            />
                          </div>
                          <div>
                            <Label htmlFor="register-lastname" className="text-white">Apellido</Label>
                            <Input
                              id="register-lastname"
                              value={registerLastName}
                              onChange={(e) => setRegisterLastName(e.target.value)}
                              placeholder="Tu apellido"
                              className="bg-[#262626] border-[#444] text-white mt-1"
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
                            className="bg-[#262626] border-[#444] text-white mt-1"
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
                          className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-semibold mt-4"
                        >
                          {registerMutation.isPending ? "Registrando..." : "Registrarse en el Evento"}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {isPast && (
              <Card className="bg-[#1a1a1a] border-[#333]">
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-gray-400 mb-4">Este evento ya ha finalizado.</p>
                    <Button
                      variant="outline"
                      onClick={() => setLocation("/events")}
                      className="border-[#444] text-gray-400 hover:text-white"
                    >
                      Ver Otros Eventos
                    </Button>
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

