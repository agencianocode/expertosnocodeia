import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import MobileHeader from "@/components/layout/mobile-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Camera,
  Settings,
  Lock,
  CreditCard,
  Shield,
  Bell,
  Edit,
  Check,
  X
} from "lucide-react";

export default function Profile() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const queryClient = useQueryClient();
  
  // Form states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Focus preferences states
  const [experienceLevel, setExperienceLevel] = useState("");
  const [preferredSkillType, setPreferredSkillType] = useState("");
  const [preferredContentTypes, setPreferredContentTypes] = useState<string[]>([]);
  const [showFocusEdit, setShowFocusEdit] = useState(false);

  // Fetch subscription info
  const { data: subscriptionInfo } = useQuery({
    queryKey: ['/api/subscription/info'],
    enabled: isAuthenticated,
  });


  // Initialize form values
  useEffect(() => {
    if (user) {
      setFirstName((user as any)?.firstName || "");
      setLastName((user as any)?.lastName || "");
      setEmail((user as any)?.email || "");
      // Initialize focus preferences
      setExperienceLevel((user as any)?.experienceLevel || "Principiante");
      setPreferredSkillType((user as any)?.preferredSkillType || "Consultoría");
      setPreferredContentTypes((user as any)?.preferredContentTypes || ["Cursos", "Guías"]);
    }
  }, [user]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "No autorizado",
        description: "Debes iniciar sesión para acceder a esta página.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/users/profile', 'PATCH', data);
    },
    onSuccess: () => {
      toast({
        title: "Perfil actualizado",
        description: "Tu información personal ha sido actualizada correctamente.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar tu perfil. Intenta nuevamente.",
        variant: "destructive",
      });
    },
  });

  // Update password mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/users/change-password', 'PATCH', data);
    },
    onSuccess: () => {
      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido cambiada correctamente.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo cambiar tu contraseña. Verifica tus datos.",
        variant: "destructive",
      });
    },
  });

  // Update focus preferences mutation
  const updateFocusMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/users/focus', 'PATCH', data);
    },
    onSuccess: () => {
      toast({
        title: "Enfoque actualizado",
        description: "Tus preferencias de contenido han sido actualizadas correctamente.",
      });
      setShowFocusEdit(false);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudieron actualizar tus preferencias. Intenta nuevamente.",
        variant: "destructive",
      });
    },
  });

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({
      firstName,
      lastName,
      email,
    });
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden.",
        variant: "destructive",
      });
      return;
    }

    updatePasswordMutation.mutate({
      currentPassword,
      newPassword,
    });
  };

  const handleUpdateFocus = (e: React.FormEvent) => {
    e.preventDefault();
    updateFocusMutation.mutate({
      experienceLevel,
      preferredSkillType,
      preferredContentTypes,
    });
  };

  const handleContentTypeToggle = (contentType: string) => {
    setPreferredContentTypes(prev => 
      prev.includes(contentType) 
        ? prev.filter(type => type !== contentType)
        : [...prev, contentType]
    );
  };

  const getUserInitials = () => {
    if ((user as any)?.firstName && (user as any)?.lastName) {
      return `${(user as any).firstName[0]}${(user as any).lastName[0]}`.toUpperCase();
    }
    if ((user as any)?.email) {
      return (user as any).email.substring(0, 2).toUpperCase();
    }
    return "U";
  };

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
    <div className="min-h-screen bg-dark-bg text-white">
      {/* Mobile Header */}
      <MobileHeader />
      
      <div className="flex">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main Content */}
        <main className="flex-1 overflow-auto pb-20 lg:pb-0 md:ml-16 lg:ml-[250px]">
          {/* Header */}
          <header className="bg-dark-card border-b border-dark-border p-6">
            <h1 className="text-2xl font-bold text-white">Perfil</h1>
          </header>

          <div className="container mx-auto px-6 py-8 max-w-4xl">
            <div className="space-y-8">
              
              {/* Foto de perfil */}
              <section>
                <h2 className="text-lg font-semibold text-white mb-4">Foto de perfil</h2>
                <Card className="bg-dark-card border-dark-border">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-6">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={(user as any)?.profileImageUrl} />
                        <AvatarFallback className="bg-purple-600 text-white text-xl">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-white mb-2">Sube una imagen de perfil cuadrada con un mínimo de 200x200 píxeles</p>
                        <Button variant="outline" className="border-dark-border text-gray-300 hover:bg-dark-bg">
                          <Camera className="h-4 w-4 mr-2" />
                          Cambiar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>


              {/* Detalles del perfil */}
              <section>
                <h2 className="text-lg font-semibold text-white mb-4">Detalles del perfil</h2>
                <Card className="bg-dark-card border-dark-border">
                  <CardContent className="p-6">
                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">Nombre</label>
                          <Input
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="bg-[#2a2a2a] border-dark-border text-white"
                            placeholder="Tu nombre"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">Apellido</label>
                          <Input
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="bg-[#2a2a2a] border-dark-border text-white"
                            placeholder="Tu apellido"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Correo electrónico</label>
                        <Input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="bg-[#2a2a2a] border-dark-border text-white"
                          placeholder="tu@ejemplo.com"
                        />
                      </div>

                      <Button 
                        type="submit" 
                        disabled={updateProfileMutation.isPending}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        {updateProfileMutation.isPending ? "Guardando..." : "Guardar cambios"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </section>

              {/* Datos */}
              <section>
                <h2 className="text-lg font-semibold text-white mb-4">Datos</h2>
                <Card className="bg-dark-card border-dark-border">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">ID de usuario</span>
                        <span className="text-white">{(user as any)?.id}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Miembro desde</span>
                        <span className="text-white">Enero 2025</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Última conexión</span>
                        <span className="text-white">Ahora</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Cambiar mi contraseña */}
              <section>
                <h2 className="text-lg font-semibold text-white mb-4">Cambiar mi contraseña</h2>
                <Card className="bg-dark-card border-dark-border">
                  <CardContent className="p-6">
                    <form onSubmit={handleUpdatePassword} className="space-y-4">
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Contraseña actual</label>
                        <Input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="bg-[#2a2a2a] border-dark-border text-white"
                          placeholder="Tu contraseña actual"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Nueva contraseña</label>
                        <Input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="bg-[#2a2a2a] border-dark-border text-white"
                          placeholder="Tu nueva contraseña"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Confirmar nueva contraseña</label>
                        <Input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="bg-[#2a2a2a] border-dark-border text-white"
                          placeholder="Confirma tu nueva contraseña"
                        />
                      </div>

                      <Button 
                        type="submit" 
                        disabled={updatePasswordMutation.isPending}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        {updatePasswordMutation.isPending ? "Actualizando..." : "Actualizar contraseña"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </section>

              {/* Zona de membresía */}
              <section>
                <h2 className="text-lg font-semibold text-white mb-4">Zona de membresía</h2>
                <Card className="bg-dark-card border-dark-border">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-white font-medium">Plan actual</h3>
                        <p className="text-gray-400 text-sm">
                          {(subscriptionInfo as any)?.plan === 'FREE' ? 'Plan gratuito' : 
                           (subscriptionInfo as any)?.plan === 'MENSUAL' ? 'Plan mensual' : 
                           (subscriptionInfo as any)?.plan === 'ANUAL' ? 'Plan anual' : 'Plan gratuito'}
                        </p>
                      </div>
                      <Badge 
                        className={
                          (subscriptionInfo as any)?.plan === 'FREE' ? 'bg-gray-500/20 text-gray-400' :
                          (subscriptionInfo as any)?.plan === 'MENSUAL' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-green-500/20 text-green-400'
                        }
                      >
                        {(subscriptionInfo as any)?.plan === 'FREE' ? 'Gratuito' : 
                         (subscriptionInfo as any)?.plan === 'MENSUAL' ? 'Mensual' : 
                         (subscriptionInfo as any)?.plan === 'ANUAL' ? 'Anual' : 'Gratuito'}
                      </Badge>
                    </div>
                    {(subscriptionInfo as any)?.plan === 'FREE' && (
                      <p className="text-gray-400 text-sm mt-2">
                        Acceso limitado a 5-10 casos de uso de IA. Actualiza para acceso completo.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </section>

              {/* Cambiar mi suscripción */}
              <section>
                <h2 className="text-lg font-semibold text-white mb-4">Cambiar mi suscripción</h2>
                <Card className="bg-dark-card border-dark-border">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-white font-medium">Gestiona tu plan</h3>
                        <p className="text-gray-400 text-sm">Cambia, actualiza o cancela tu suscripción</p>
                      </div>
                      <Button 
                        variant="outline" 
                        className="border-dark-border text-gray-300 hover:bg-dark-bg"
                        onClick={() => window.location.href = '/planes'}
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Ver planes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Tu enfoque */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-white">Tu enfoque</h2>
                    <p className="text-gray-400 text-sm">Recomendamos contenido en su panel según tu nivel de experiencia, habilidades y tipo de contenido.</p>
                  </div>
                </div>
                <Card className="bg-dark-card border-dark-border">
                  <CardContent className="p-6">
                    {!showFocusEdit ? (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="text-white font-medium">Nivel de experiencia:</h3>
                            <p className="text-gray-300">{experienceLevel}</p>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="text-white font-medium">Tipo de habilidad preferida:</h3>
                            <p className="text-gray-300">{preferredSkillType}</p>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="text-white font-medium">Tipo de contenido preferido:</h3>
                            <p className="text-gray-300">{preferredContentTypes.join(", ")}</p>
                          </div>
                        </div>
                        
                        <Button 
                          onClick={() => setShowFocusEdit(true)}
                          className="bg-white text-black hover:bg-gray-100"
                          size="sm"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Editar el enfoque
                        </Button>
                      </div>
                    ) : (
                      <form onSubmit={handleUpdateFocus} className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-white font-medium">Nivel de experiencia:</label>
                          <select 
                            value={experienceLevel}
                            onChange={(e) => setExperienceLevel(e.target.value)}
                            className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white"
                          >
                            <option value="Principiante">Principiante</option>
                            <option value="Intermedio">Intermedio</option>
                            <option value="Avanzado">Avanzado</option>
                          </select>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-white font-medium">Tipo de habilidad preferida:</label>
                          <select 
                            value={preferredSkillType}
                            onChange={(e) => setPreferredSkillType(e.target.value)}
                            className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white"
                          >
                            <option value="Consultoría">Consultoría</option>
                            <option value="Desarrollo">Desarrollo</option>
                            <option value="Marketing">Marketing</option>
                            <option value="Ventas">Ventas</option>
                            <option value="Gestión">Gestión</option>
                          </select>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-white font-medium">Tipo de contenido preferido:</label>
                          <div className="flex gap-2 flex-wrap">
                            {["Cursos", "Guías", "Workshops"].map((type) => (
                              <button
                                key={type}
                                type="button"
                                onClick={() => handleContentTypeToggle(type)}
                                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                                  preferredContentTypes.includes(type)
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                }`}
                              >
                                {type}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button 
                            type="submit"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            size="sm"
                            disabled={updateFocusMutation.isPending}
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Guardar
                          </Button>
                          <Button 
                            type="button"
                            onClick={() => setShowFocusEdit(false)}
                            variant="outline"
                            className="border-dark-border text-gray-300 hover:bg-dark-bg"
                            size="sm"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancelar
                          </Button>
                        </div>
                      </form>
                    )}
                  </CardContent>
                </Card>
              </section>

              {/* Configuración */}
              <section>
                <h2 className="text-lg font-semibold text-white mb-4">Configuración</h2>
                <Card className="bg-dark-card border-dark-border">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-white font-medium">Notificaciones por email</h3>
                          <p className="text-gray-400 text-sm">Recibe actualizaciones sobre nuevos cursos</p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="border-dark-border text-gray-300 hover:bg-dark-bg"
                        >
                          <Bell className="h-4 w-4 mr-2" />
                          Configurar
                        </Button>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-white font-medium">Privacidad</h3>
                          <p className="text-gray-400 text-sm">Gestiona tu privacidad y datos</p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="border-dark-border text-gray-300 hover:bg-dark-bg"
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          Configurar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>

            </div>
          </div>
        </main>
      </div>

      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
}