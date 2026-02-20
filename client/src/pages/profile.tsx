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
  X,
  Eye,
  EyeOff,
  Mail,
  MailCheck,
  AlertCircle
} from "lucide-react";

export default function Profile() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const queryClient = useQueryClient();
  
  // Form states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [bio, setBio] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  
  // Focus preferences states
  const [experienceLevel, setExperienceLevel] = useState("");
  const [preferredSkillType, setPreferredSkillType] = useState("");
  const [preferredContentTypes, setPreferredContentTypes] = useState<string[]>([]);
  const [showFocusEdit, setShowFocusEdit] = useState(false);
  
  // Profile image upload state
  const [uploadingImage, setUploadingImage] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);

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
      setShortDescription((user as any)?.shortDescription || "");
      setBio((user as any)?.bio || "");
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
      return apiRequest('PATCH', '/api/users/profile', data);
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
      const response = await apiRequest('PATCH', '/api/users/change-password', data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al cambiar la contraseña');
      }
      return response.json();
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
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo cambiar tu contraseña. Verifica tus datos.",
        variant: "destructive",
      });
    },
  });

  // Resend verification email mutation
  const resendVerificationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/auth/resend-verification', {});
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al reenviar el email');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Email enviado",
        description: "Se ha enviado un nuevo email de verificación. Por favor revisa tu bandeja de entrada.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo reenviar el email de verificación",
        variant: "destructive",
      });
    },
  });

  const handleResendVerification = () => {
    setIsResendingVerification(true);
    resendVerificationMutation.mutate();
    setTimeout(() => setIsResendingVerification(false), 2000);
  };

  // Update focus preferences mutation
  const updateFocusMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('PATCH', '/api/users/focus', data);
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
      shortDescription,
      bio,
    });
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Error",
        description: "Todos los campos son requeridos.",
        variant: "destructive",
      });
      return;
    }

    // Validate password strength
    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "La nueva contraseña debe tener al menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }
    
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

  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Por favor selecciona un archivo de imagen.",
        variant: "destructive",
      });
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/users/upload-profile-image", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error al subir la imagen");
      }

      const data = await res.json();
      
      // Update local state with the new image URL immediately
      if (data.profileImageUrl) {
        setProfileImageUrl(data.profileImageUrl);
      }
      
      toast({
        title: "Éxito",
        description: "Tu foto de perfil ha sido actualizada.",
      });

      // Invalidate cache to refresh user data
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo subir la imagen. Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
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
      <div className="min-h-screen bg-background flex">
        <div className="w-[250px] bg-card border-r border-border"></div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white">
      {/* Mobile Header */}
      <MobileHeader />
      
      <div className="flex">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main Content */}
        <main className="flex-1 overflow-auto pb-20 lg:pb-0 md:ml-16 lg:ml-[250px]">
          {/* Header */}
          <header className="bg-card border-b border-border p-6">
            <h1 className="text-2xl font-bold text-white">Perfil</h1>
          </header>

          <div className="container mx-auto px-6 py-8 max-w-4xl">
            <div className="space-y-8">
              
              {/* Foto de perfil */}
              <section>
                <h2 className="text-lg font-semibold text-white mb-4">Foto de perfil</h2>
                <Card className="bg-card border-border">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-6">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={profileImageUrl || (user as any)?.profileImageUrl} />
                        <AvatarFallback className="bg-purple-600 text-white text-xl">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-white mb-2">Sube una imagen de perfil cuadrada con un mínimo de 200x200 píxeles</p>
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleProfileImageUpload}
                            disabled={uploadingImage}
                            className="hidden"
                            id="profile-image-input"
                          />
                          <Button
                            variant="outline"
                            className="border-border text-muted-foreground hover:bg-background"
                            onClick={() => document.getElementById("profile-image-input")?.click()}
                            disabled={uploadingImage}
                          >
                            <Camera className="h-4 w-4 mr-2" />
                            {uploadingImage ? "Subiendo..." : "Cambiar"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>


              {/* Detalles del perfil */}
              <section>
                <h2 className="text-lg font-semibold text-white mb-4">Detalles del perfil</h2>
                <Card className="bg-card border-border">
                  <CardContent className="p-6">
                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">Nombre</label>
                          <Input
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="bg-input border-border text-white"
                            placeholder="Tu nombre"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">Apellido</label>
                          <Input
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="bg-input border-border text-white"
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
                          className="bg-input border-border text-white"
                          placeholder="tu@ejemplo.com"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Descripción corta</label>
                        <Input
                          value={shortDescription}
                          onChange={(e) => setShortDescription(e.target.value)}
                          className="bg-input border-border text-white"
                          placeholder="Una breve descripción sobre ti..."
                          maxLength={150}
                        />
                        <p className="text-xs text-gray-500 mt-1">{shortDescription.length}/150</p>
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Biografía</label>
                        <textarea
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          className="w-full bg-input border border-border text-white rounded px-3 py-2 min-h-[120px] resize-y"
                          placeholder="Cuéntanos más sobre ti..."
                          maxLength={1000}
                        />
                        <p className="text-xs text-gray-500 mt-1">{bio.length}/1000</p>
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

              {/* Verificación de email */}
              {!(user as any)?.isEmailVerified && (
                <section>
                  <Card className="bg-yellow-500/10 border-yellow-500/20">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <AlertCircle className="w-5 h-5 text-yellow-500" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-white font-semibold mb-1">Email no verificado</h3>
                          <p className="text-gray-400 text-sm mb-4">
                            Por favor verifica tu email para acceder a todas las funcionalidades. Revisa tu bandeja de entrada o carpeta de spam.
                          </p>
                          <Button
                            onClick={handleResendVerification}
                            disabled={isResendingVerification}
                            size="sm"
                            className="bg-yellow-500 hover:bg-yellow-600 text-white"
                          >
                            {isResendingVerification ? (
                              <>
                                <Mail className="w-4 h-4 mr-2 animate-spin" />
                                Enviando...
                              </>
                            ) : (
                              <>
                                <Mail className="w-4 h-4 mr-2" />
                                Reenviar email de verificación
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </section>
              )}

              {/* Datos */}
              <section>
                <h2 className="text-lg font-semibold text-white mb-4">Datos</h2>
                <Card className="bg-card border-border">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">ID de usuario</span>
                        <span className="text-white">{(user as any)?.id}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Email</span>
                        <div className="flex items-center gap-2">
                          <span className="text-white">{(user as any)?.email}</span>
                          {(user as any)?.isEmailVerified ? (
                            <MailCheck className="w-4 h-4 text-green-500" />
                          ) : (
                            <Mail className="w-4 h-4 text-yellow-500" />
                          )}
                        </div>
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
                <Card className="bg-card border-border">
                  <CardContent className="p-6">
                    <form onSubmit={handleUpdatePassword} className="space-y-4">
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Contraseña actual</label>
                        <div className="relative">
                          <Input
                            type={showCurrentPassword ? "text" : "password"}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="bg-input border-border text-white pr-10"
                            placeholder="Tu contraseña actual"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                          >
                            {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Nueva contraseña</label>
                        <div className="relative">
                          <Input
                            type={showNewPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="bg-input border-border text-white pr-10"
                            placeholder="Tu nueva contraseña"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                          >
                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Confirmar nueva contraseña</label>
                        <div className="relative">
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="bg-input border-border text-white pr-10"
                            placeholder="Confirma tu nueva contraseña"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
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
                <Card className="bg-card border-border">
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
                <Card className="bg-card border-border">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-white font-medium">Gestiona tu plan</h3>
                        <p className="text-gray-400 text-sm">Cambia, actualiza o cancela tu suscripción</p>
                      </div>
                      <Button 
                        variant="outline" 
                        className="border-border text-muted-foreground hover:bg-background"
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
                <Card className="bg-card border-border">
                  <CardContent className="p-6">
                    {!showFocusEdit ? (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="text-white font-medium">Nivel de experiencia:</h3>
                            <p className="text-muted-foreground">{experienceLevel}</p>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="text-white font-medium">Tipo de habilidad preferida:</h3>
                            <p className="text-muted-foreground">{preferredSkillType}</p>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="text-white font-medium">Tipo de contenido preferido:</h3>
                            <p className="text-muted-foreground">{preferredContentTypes.join(", ")}</p>
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
                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white"
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
                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white"
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
                                    : "bg-gray-700 text-muted-foreground hover:bg-gray-600"
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
                            className="border-border text-muted-foreground hover:bg-background"
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
                <Card className="bg-card border-border">
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
                          className="border-border text-muted-foreground hover:bg-background"
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
                          className="border-border text-muted-foreground hover:bg-background"
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