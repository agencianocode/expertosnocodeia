import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, XCircle, Settings, Users, RefreshCw, Mail, Search } from "lucide-react";

export default function AdminBeehiiv() {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [syncSegment, setSyncSegment] = useState<"all" | "trial" | "active" | "cancelled" | "none">("all");

  // Check Beehiiv configuration
  const { data: configStatus, refetch: refetchConfig, isLoading: isLoadingConfig } = useQuery({
    queryKey: ["beehiiv-config"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/beehiiv/check-config");
      return res.json();
    },
    retry: 1,
  });

  // Subscribe mutation
  const subscribeMutation = useMutation({
    mutationFn: async (data: { email: string; firstName?: string; lastName?: string }) => {
      const res = await apiRequest("POST", "/api/admin/beehiiv/subscribe", data);
      return res.json();
    },
    onSuccess: () => {
      alert("✅ Usuario suscrito exitosamente a Beehiiv");
      setEmail("");
      setFirstName("");
      setLastName("");
    },
    onError: (error: any) => {
      alert(`❌ Error: ${error.message || "Error al suscribir usuario"}`);
    },
  });

  // Unsubscribe mutation
  const unsubscribeMutation = useMutation({
    mutationFn: async (data: { email: string }) => {
      const res = await apiRequest("POST", "/api/admin/beehiiv/unsubscribe", data);
      return res.json();
    },
    onSuccess: () => {
      alert("✅ Usuario desuscrito exitosamente de Beehiiv");
      setEmail("");
    },
    onError: (error: any) => {
      alert(`❌ Error: ${error.message || "Error al desuscribir usuario"}`);
    },
  });

  // Get subscriber mutation
  const getSubscriberMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await apiRequest("GET", `/api/admin/beehiiv/subscriber?email=${encodeURIComponent(email)}`);
      return res.json();
    },
    onError: (error: any) => {
      alert(`❌ Error: ${error.message || "Error al obtener información del suscriptor"}`);
    },
  });

  // Sync all mutation
  const syncAllMutation = useMutation({
    mutationFn: async (data: { segment: string; limit?: number; offset?: number }) => {
      const res = await apiRequest("POST", "/api/admin/beehiiv/sync-all", data);
      return res.json();
    },
    onSuccess: (data) => {
      alert(`✅ Sincronización completada:\n- Suscritos: ${data.synced}\n- Fallidos: ${data.failed}`);
    },
    onError: (error: any) => {
      alert(`❌ Error: ${error.message || "Error al sincronizar usuarios"}`);
    },
  });

  const handleSubscribe = () => {
    if (!email.trim()) {
      alert("Por favor ingresa un email");
      return;
    }

    subscribeMutation.mutate({
      email: email.trim(),
      firstName: firstName.trim() || undefined,
      lastName: lastName.trim() || undefined,
    });
  };

  const handleUnsubscribe = () => {
    if (!email.trim()) {
      alert("Por favor ingresa un email");
      return;
    }

    if (!confirm(`¿Estás seguro de desuscribir a ${email} de Beehiiv?`)) {
      return;
    }

    unsubscribeMutation.mutate({ email: email.trim() });
  };

  const handleGetSubscriber = () => {
    if (!email.trim()) {
      alert("Por favor ingresa un email");
      return;
    }

    getSubscriberMutation.mutate(email.trim());
  };

  const handleSyncAll = () => {
    if (!confirm(`¿Estás seguro de sincronizar todos los usuarios (segmento: ${syncSegment}) a Beehiiv? Esto puede tomar varios minutos.`)) {
      return;
    }

    syncAllMutation.mutate({ segment: syncSegment });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Integración Beehiiv</h1>
        <p className="text-muted-foreground mt-2">
          Gestiona la sincronización de usuarios con tu newsletter de Beehiiv
        </p>
      </div>

      {/* Configuration Status */}
      {isLoadingConfig ? (
        <Alert className="border-blue-500">
          <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
          <AlertDescription>
            Verificando configuración de Beehiiv...
          </AlertDescription>
        </Alert>
      ) : configStatus ? (
        <Alert className={configStatus.configured ? "border-green-500 bg-green-500/10" : "border-yellow-500 bg-yellow-500/10"}>
          {configStatus.configured ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <XCircle className="h-4 w-4 text-yellow-500" />
          )}
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span className="font-medium">{configStatus.message}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refetchConfig()}
                className="ml-2"
                disabled={isLoadingConfig}
              >
                {isLoadingConfig ? (
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <Settings className="w-3 h-3 mr-1" />
                )}
                Verificar
              </Button>
            </div>
            {configStatus.configured && (
              <div className="mt-3 text-xs space-y-1 text-muted-foreground">
                <div className="font-medium text-foreground">Detalles de configuración:</div>
                {configStatus.hasApiKey && <div>✅ API Key configurada</div>}
                {configStatus.hasPublicationId && <div>✅ Publication ID configurado</div>}
              </div>
            )}
          </AlertDescription>
        </Alert>
      ) : null}

      <Tabs defaultValue="individual" className="space-y-4">
        <TabsList>
          <TabsTrigger value="individual">
            <Mail className="w-4 h-4 mr-2" />
            Gestión Individual
          </TabsTrigger>
          <TabsTrigger value="bulk">
            <Users className="w-4 h-4 mr-2" />
            Sincronización Masiva
          </TabsTrigger>
        </TabsList>

        {/* Individual Management Tab */}
        <TabsContent value="individual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestionar Suscriptor Individual</CardTitle>
              <CardDescription>
                Suscribe, desuscribe o consulta información de un usuario específico
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nombre (Opcional)</Label>
                  <Input
                    id="firstName"
                    placeholder="Juan"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Apellido (Opcional)</Label>
                  <Input
                    id="lastName"
                    placeholder="Pérez"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={handleSubscribe}
                  disabled={subscribeMutation.isPending}
                >
                  {subscribeMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Suscribiendo...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Suscribir
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleUnsubscribe}
                  variant="destructive"
                  disabled={unsubscribeMutation.isPending}
                >
                  {unsubscribeMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Desuscribiendo...
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 mr-2" />
                      Desuscribir
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleGetSubscriber}
                  variant="outline"
                  disabled={getSubscriberMutation.isPending}
                >
                  {getSubscriberMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Buscando...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Consultar
                    </>
                  )}
                </Button>
              </div>

              {getSubscriberMutation.isSuccess && getSubscriberMutation.data?.subscriber && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <div className="font-medium">Información del suscriptor:</div>
                      <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                        {JSON.stringify(getSubscriberMutation.data.subscriber, null, 2)}
                      </pre>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bulk Sync Tab */}
        <TabsContent value="bulk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sincronización Masiva</CardTitle>
              <CardDescription>
                Sincroniza todos los usuarios de un segmento a Beehiiv
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="segment">Segmento</Label>
                <Select value={syncSegment} onValueChange={(value: any) => setSyncSegment(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los usuarios</SelectItem>
                    <SelectItem value="trial">Solo usuarios en trial</SelectItem>
                    <SelectItem value="active">Solo usuarios activos (pagados)</SelectItem>
                    <SelectItem value="cancelled">Usuarios cancelados</SelectItem>
                    <SelectItem value="none">Usuarios sin suscripción</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Alert>
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">⚠️ Importante:</p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      <li>Esta operación puede tomar varios minutos dependiendo del número de usuarios</li>
                      <li>Los usuarios existentes en Beehiiv serán reactivados si estaban desuscritos</li>
                      <li>Se agregarán tags automáticamente basados en el estado de suscripción</li>
                      <li>Los errores se mostrarán al finalizar la sincronización</li>
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>

              <Button
                onClick={handleSyncAll}
                disabled={syncAllMutation.isPending}
                size="lg"
                className="w-full"
              >
                {syncAllMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sincronizando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Sincronizar a Beehiiv
                  </>
                )}
              </Button>

              {syncAllMutation.isSuccess && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <div className="font-medium">Resultados de la sincronización:</div>
                      <div className="text-sm space-y-1">
                        <div>✅ Suscritos exitosamente: <strong>{syncAllMutation.data?.synced || 0}</strong></div>
                        <div>❌ Fallidos: <strong>{syncAllMutation.data?.failed || 0}</strong></div>
                        {syncAllMutation.data?.errors && syncAllMutation.data.errors.length > 0 && (
                          <div className="mt-2">
                            <div className="font-medium">Errores:</div>
                            <div className="max-h-40 overflow-auto bg-muted p-2 rounded text-xs">
                              {syncAllMutation.data.errors.map((err: any, idx: number) => (
                                <div key={idx} className="mb-1">
                                  <strong>{err.email}:</strong> {err.error}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

