import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, Send, CheckCircle2, XCircle, Sparkles, Settings } from "lucide-react";

export default function AdminEmails() {
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [segment, setSegment] = useState<"all" | "trial" | "active" | "cancelled" | "none">("all");
  const [testEmailSent, setTestEmailSent] = useState(false);

  // Check Resend configuration
  const { data: configStatus, refetch: refetchConfig, isLoading: isLoadingConfig } = useQuery({
    queryKey: ["email-config"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/emails/check-config");
      return res.json();
    },
    retry: 1,
  });

  // Send bulk email mutation
  const sendBulkEmailMutation = useMutation({
    mutationFn: async (data: {
      subject: string;
      content: string;
      segment: string;
    }) => {
      const res = await apiRequest("POST", "/api/admin/emails/send", data);
      return res.json();
    },
    onSuccess: () => {
      alert("✅ Emails enviados exitosamente");
      setSubject("");
      setContent("");
    },
    onError: (error: any) => {
      alert(`❌ Error: ${error.message || "Error al enviar emails"}`);
    },
  });

  // Test email mutation
  const testEmailMutation = useMutation({
    mutationFn: async (data: { subject: string; content: string }) => {
      const res = await apiRequest("POST", "/api/admin/emails/test", data);
      return res.json();
    },
    onSuccess: () => {
      setTestEmailSent(true);
      setTimeout(() => setTestEmailSent(false), 5000);
    },
    onError: (error: any) => {
      alert(`❌ Error: ${error.message || "Error al enviar email de prueba"}`);
    },
  });

  // Trigger automated email mutation
  const triggerEmailMutation = useMutation({
    mutationFn: async (data: {
      type: string;
      userEmail: string;
      userName?: string;
      daysRemaining?: number;
      emailNumber?: number;
      daysInactive?: number;
    }) => {
      const { type, ...body } = data;
      const res = await apiRequest("POST", `/api/admin/emails/trigger/${type}`, body);
      return res.json();
    },
    onSuccess: () => {
      alert("✅ Email de prueba enviado exitosamente");
    },
    onError: (error: any) => {
      alert(`❌ Error: ${error.message || "Error al enviar email"}`);
    },
  });

  const handleSendBulkEmail = () => {
    if (!subject.trim() || !content.trim()) {
      alert("Por favor completa el asunto y el contenido");
      return;
    }

    if (!confirm(`¿Estás seguro de enviar este email a ${segment === "all" ? "todos los usuarios" : `usuarios con estado: ${segment}`}?`)) {
      return;
    }

    sendBulkEmailMutation.mutate({
      subject,
      content,
      segment,
    });
  };

  const handleTestEmail = () => {
    if (!subject.trim() || !content.trim()) {
      alert("Por favor completa el asunto y el contenido");
      return;
    }

    testEmailMutation.mutate({ subject, content });
  };

  const handleTriggerEmail = (type: string, params: any) => {
    triggerEmailMutation.mutate({ type, ...params });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Email Marketing</h1>
        <p className="text-muted-foreground mt-2">
          Gestiona y envía emails a tus usuarios
        </p>
      </div>

      {/* Configuration Status */}
      {isLoadingConfig ? (
        <Alert className="border-blue-500">
          <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
          <AlertDescription>
            Verificando configuración de Resend...
          </AlertDescription>
        </Alert>
      ) : configStatus ? (
        <Alert className={configStatus.clientWorks ? "border-green-500 bg-green-500/10" : "border-yellow-500 bg-yellow-500/10"}>
          {configStatus.clientWorks ? (
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
                <div>From Email: <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{configStatus.fromEmail}</code></div>
                {configStatus.hasApiKey && <div>✅ API Key configurada</div>}
                {configStatus.hasFromEmail && <div>✅ From Email configurado</div>}
                {configStatus.hasReplitConnector && <div>✅ Replit Connector detectado</div>}
                {configStatus.error && (
                  <div className="text-red-400 mt-1">⚠️ Error: {configStatus.error}</div>
                )}
              </div>
            )}
          </AlertDescription>
        </Alert>
      ) : null}

      <Tabs defaultValue="manual" className="space-y-4">
        <TabsList>
          <TabsTrigger value="manual">
            <Mail className="w-4 h-4 mr-2" />
            Emails Manuales
          </TabsTrigger>
          <TabsTrigger value="automated">
            <Sparkles className="w-4 h-4 mr-2" />
            Secuencias Automatizadas
          </TabsTrigger>
        </TabsList>

        {/* Manual Emails Tab */}
        <TabsContent value="manual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Enviar Email Manual</CardTitle>
              <CardDescription>
                Envía un email a todos los usuarios o a un segmento específico
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="segment">Segmento</Label>
                <Select value={segment} onValueChange={(value: any) => setSegment(value)}>
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

              <div className="space-y-2">
                <Label htmlFor="subject">Asunto</Label>
                <Input
                  id="subject"
                  placeholder="Ej: Nueva actualización importante"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Contenido (HTML)</Label>
                <Textarea
                  id="content"
                  placeholder="Escribe el contenido del email en HTML. Usa {{name}} para personalizar con el nombre del usuario."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={10}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Tip: Usa <code className="bg-muted px-1 rounded">{`{{name}}`}</code> para personalizar con el nombre del usuario
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleTestEmail}
                  variant="outline"
                  disabled={testEmailMutation.isPending}
                >
                  {testEmailMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Enviar Prueba
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleSendBulkEmail}
                  disabled={sendBulkEmailMutation.isPending}
                >
                  {sendBulkEmailMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Enviar a Segmento
                    </>
                  )}
                </Button>
              </div>

              {testEmailSent && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    Email de prueba enviado exitosamente a tu dirección
                  </AlertDescription>
                </Alert>
              )}

              {sendBulkEmailMutation.isSuccess && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    ✅ Emails enviados: {sendBulkEmailMutation.data?.sent || 0}
                    {sendBulkEmailMutation.data?.failed > 0 && (
                      <span className="ml-2 text-destructive">
                        ❌ Fallidos: {sendBulkEmailMutation.data.failed}
                      </span>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Automated Sequences Tab */}
        <TabsContent value="automated" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Secuencias Automatizadas</CardTitle>
              <CardDescription>
                Prueba las secuencias de email automatizadas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Welcome Email */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Email de Bienvenida</CardTitle>
                    <CardDescription>
                      Se envía automáticamente al registrarse
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TriggerEmailForm
                      type="welcome"
                      fields={[
                        { name: "userEmail", label: "Email", type: "email", required: true },
                        { name: "userName", label: "Nombre", type: "text", required: true },
                      ]}
                      onTrigger={handleTriggerEmail}
                      isLoading={triggerEmailMutation.isPending}
                    />
                  </CardContent>
                </Card>

                {/* Trial Reminder */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Recordatorio de Trial</CardTitle>
                    <CardDescription>
                      Se envía en días 7, 12 y 14 del trial
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TriggerEmailForm
                      type="trial-reminder"
                      fields={[
                        { name: "userEmail", label: "Email", type: "email", required: true },
                        { name: "userName", label: "Nombre", type: "text", required: true },
                        { name: "daysRemaining", label: "Días Restantes", type: "number", required: true },
                      ]}
                      onTrigger={handleTriggerEmail}
                      isLoading={triggerEmailMutation.isPending}
                    />
                  </CardContent>
                </Card>

                {/* Onboarding */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Serie de Onboarding</CardTitle>
                    <CardDescription>
                      Serie de 5 emails de onboarding
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TriggerEmailForm
                      type="onboarding"
                      fields={[
                        { name: "userEmail", label: "Email", type: "email", required: true },
                        { name: "userName", label: "Nombre", type: "text", required: true },
                        { name: "emailNumber", label: "Número de Email (1-5)", type: "number", required: true },
                      ]}
                      onTrigger={handleTriggerEmail}
                      isLoading={triggerEmailMutation.isPending}
                    />
                  </CardContent>
                </Card>

                {/* Cancellation Recovery */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Recuperación de Cancelación</CardTitle>
                    <CardDescription>
                      Se envía cuando un usuario cancela
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TriggerEmailForm
                      type="cancellation-recovery"
                      fields={[
                        { name: "userEmail", label: "Email", type: "email", required: true },
                        { name: "userName", label: "Nombre", type: "text", required: true },
                      ]}
                      onTrigger={handleTriggerEmail}
                      isLoading={triggerEmailMutation.isPending}
                    />
                  </CardContent>
                </Card>

                {/* Re-engagement */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Re-engagement</CardTitle>
                    <CardDescription>
                      Para usuarios inactivos
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TriggerEmailForm
                      type="re-engagement"
                      fields={[
                        { name: "userEmail", label: "Email", type: "email", required: true },
                        { name: "userName", label: "Nombre", type: "text", required: true },
                        { name: "daysInactive", label: "Días Inactivo", type: "number", required: true },
                      ]}
                      onTrigger={handleTriggerEmail}
                      isLoading={triggerEmailMutation.isPending}
                    />
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper component for trigger email forms
function TriggerEmailForm({
  type,
  fields,
  onTrigger,
  isLoading,
}: {
  type: string;
  fields: Array<{ name: string; label: string; type: string; required?: boolean }>;
  onTrigger: (type: string, params: any) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params: any = {};
    
    fields.forEach((field) => {
      const value = formData[field.name];
      if (field.type === "number") {
        params[field.name] = value ? parseInt(value, 10) : undefined;
      } else {
        params[field.name] = value;
      }
    });

    onTrigger(type, params);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {fields.map((field) => (
        <div key={field.name} className="space-y-1">
          <Label htmlFor={field.name}>{field.label}</Label>
          <Input
            id={field.name}
            type={field.type}
            value={formData[field.name] || ""}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, [field.name]: e.target.value }))
            }
            required={field.required}
            placeholder={field.label}
          />
        </div>
      ))}
      <Button type="submit" size="sm" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="w-3 h-3 mr-2 animate-spin" />
            Enviando...
          </>
        ) : (
          <>
            <Send className="w-3 h-3 mr-2" />
            Enviar Prueba
          </>
        )}
      </Button>
    </form>
  );
}

