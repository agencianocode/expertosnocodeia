import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Play, 
  Pause, 
  Activity, 
  Mail, 
  Tag, 
  Webhook,
  TrendingUp,
  Users,
  DollarSign,
  Target,
  CheckCircle2,
  XCircle,
  Clock
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Automation = {
  id: string;
  name: string;
  description?: string;
  triggerType: 'event' | 'schedule' | 'segment';
  triggerConfig: any;
  actionType: 'email' | 'tag' | 'webhook' | 'beehiiv_tag';
  actionConfig: any;
  segmentRules?: any;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type AutomationLog = {
  log: {
    id: string;
    status: 'success' | 'failed' | 'skipped';
    executedAt: string;
    errorMessage?: string;
    result?: any;
  };
  automation?: Automation;
  user?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
};

export default function AdminAutomations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedAutomation, setSelectedAutomation] = useState<Automation | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLogsDialogOpen, setIsLogsDialogOpen] = useState(false);

  // Fetch automations
  const { data: automations = [], isLoading } = useQuery<Automation[]>({
    queryKey: ['/api/admin/automations'],
  });

  // Fetch analytics
  const { data: analytics } = useQuery<any>({
    queryKey: ['/api/admin/analytics/marketing'],
  });

  // Fetch automation logs
  const { data: logs = [] } = useQuery<AutomationLog[]>({
    queryKey: ['/api/admin/automations/logs'],
    enabled: isLogsDialogOpen,
  });

  // Create/Update automation mutation
  const automationMutation = useMutation({
    mutationFn: async (data: Partial<Automation>) => {
      if (selectedAutomation?.id) {
        return apiRequest('PUT', `/api/admin/automations/${selectedAutomation.id}`, data);
      } else {
        return apiRequest('POST', '/api/admin/automations', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/automations'] });
      setIsDialogOpen(false);
      setSelectedAutomation(null);
      toast({
        title: "Éxito",
        description: selectedAutomation?.id 
          ? "Automatización actualizada exitosamente" 
          : "Automatización creada exitosamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al guardar automatización",
        variant: "destructive",
      });
    },
  });

  // Process automations mutation
  const processMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/admin/automations/process', {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/automations/logs'] });
      toast({
        title: "Éxito",
        description: "Automatizaciones procesadas exitosamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al procesar automatizaciones",
        variant: "destructive",
      });
    },
  });

  const handleCreate = () => {
    setSelectedAutomation(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (automation: Automation) => {
    setSelectedAutomation(automation);
    setIsDialogOpen(true);
  };

  const handleToggleActive = async (automation: Automation) => {
    try {
      await apiRequest('PUT', `/api/admin/automations/${automation.id}`, {
        isActive: !automation.isActive,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/automations'] });
      toast({
        title: "Éxito",
        description: automation.isActive 
          ? "Automatización desactivada" 
          : "Automatización activada",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al actualizar automatización",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Automatizaciones Avanzadas</h1>
          <p className="text-muted-foreground mt-2">
            Gestiona automatizaciones basadas en eventos, segmentos y programación
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => processMutation.mutate()} disabled={processMutation.isPending}>
            <Play className="mr-2 h-4 w-4" />
            Procesar Automatizaciones
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Automatización
          </Button>
        </div>
      </div>

      {/* Analytics Cards */}
      {analytics && analytics.conversions && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversión Trial → Pago</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.conversions?.trialToPaidRate?.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {analytics.conversions?.trialToPaid} de {analytics.conversions?.totalTrials} trials
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.engagement?.activeUsers || 0}</div>
              <p className="text-xs text-muted-foreground">Últimos 30 días</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasa de Churn</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.churn?.churnRate?.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {analytics.churn?.cancelledSubscriptions || 0} cancelaciones
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">MRR</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${analytics.revenue?.mrr?.toFixed(2) || '0.00'}
              </div>
              <p className="text-xs text-muted-foreground">
                ARR: ${analytics.revenue?.arr?.toFixed(2) || '0.00'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="automations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="automations">Automatizaciones</TabsTrigger>
          <TabsTrigger value="logs">Logs de Ejecución</TabsTrigger>
          <TabsTrigger value="events">Eventos Recientes</TabsTrigger>
        </TabsList>

        <TabsContent value="automations" className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">Cargando automatizaciones...</div>
          ) : automations.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground mb-4">No hay automatizaciones creadas</p>
                <Button onClick={handleCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Primera Automatización
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {automations.map((automation) => (
                <Card key={automation.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {automation.name}
                          <Badge variant={automation.isActive ? "default" : "secondary"}>
                            {automation.isActive ? "Activa" : "Inactiva"}
                          </Badge>
                        </CardTitle>
                        {automation.description && (
                          <CardDescription className="mt-2">{automation.description}</CardDescription>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(automation)}
                        >
                          {automation.isActive ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(automation)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Trigger:</span>
                        <div className="font-medium capitalize">{automation.triggerType}</div>
                        {automation.triggerType === 'event' && (
                          <div className="text-xs text-muted-foreground">
                            {automation.triggerConfig?.eventType}
                          </div>
                        )}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Acción:</span>
                        <div className="font-medium capitalize flex items-center gap-1">
                          {automation.actionType === 'email' && <Mail className="h-3 w-3" />}
                          {automation.actionType === 'beehiiv_tag' && <Tag className="h-3 w-3" />}
                          {automation.actionType === 'webhook' && <Webhook className="h-3 w-3" />}
                          {automation.actionType}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Creada:</span>
                        <div className="text-xs">
                          {new Date(automation.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedAutomation(automation);
                            setIsLogsDialogOpen(true);
                          }}
                        >
                          <Activity className="h-4 w-4 mr-1" />
                          Ver Logs
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <AutomationLogsView />
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <RecentEventsView />
        </TabsContent>
      </Tabs>

      {/* Create/Edit Automation Dialog */}
      <AutomationDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        automation={selectedAutomation}
        onSave={(data) => automationMutation.mutate(data)}
      />

      {/* Logs Dialog */}
      {isLogsDialogOpen && selectedAutomation && (
        <AutomationLogsDialog
          open={isLogsDialogOpen}
          onOpenChange={setIsLogsDialogOpen}
          automationId={selectedAutomation.id}
        />
      )}
    </div>
  );
}

// Automation Dialog Component
function AutomationDialog({
  open,
  onOpenChange,
  automation,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  automation: Automation | null;
  onSave: (data: Partial<Automation>) => void;
}) {
  const [formData, setFormData] = useState({
    name: automation?.name || '',
    description: automation?.description || '',
    triggerType: automation?.triggerType || 'event' as 'event' | 'schedule' | 'segment',
    triggerConfig: automation?.triggerConfig || { eventType: 'course_completed' },
    actionType: automation?.actionType || 'email' as 'email' | 'tag' | 'webhook' | 'beehiiv_tag',
    actionConfig: automation?.actionConfig || {},
    segmentRules: automation?.segmentRules || {},
    isActive: automation?.isActive !== false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {automation ? 'Editar Automatización' : 'Nueva Automatización'}
          </DialogTitle>
          <DialogDescription>
            Configura el trigger y la acción que se ejecutará automáticamente
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="triggerType">Tipo de Trigger *</Label>
            <Select
              value={formData.triggerType}
              onValueChange={(value: any) => setFormData({ ...formData, triggerType: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="event">Evento</SelectItem>
                <SelectItem value="schedule">Programado</SelectItem>
                <SelectItem value="segment">Segmento</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.triggerType === 'event' && (
            <div className="space-y-2">
              <Label htmlFor="eventType">Tipo de Evento *</Label>
              <Select
                value={formData.triggerConfig?.eventType || 'course_completed'}
                onValueChange={(value) => setFormData({
                  ...formData,
                  triggerConfig: { ...formData.triggerConfig, eventType: value },
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="course_completed">Curso Completado</SelectItem>
                  <SelectItem value="lesson_completed">Lección Completada</SelectItem>
                  <SelectItem value="course_started">Curso Iniciado</SelectItem>
                  <SelectItem value="onboarding_completed">Onboarding Completado</SelectItem>
                  <SelectItem value="subscription_created">Suscripción Creada</SelectItem>
                  <SelectItem value="subscription_cancelled">Suscripción Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {formData.triggerType === 'segment' && (
            <SegmentSelector
              value={formData.triggerConfig?.segmentId || ''}
              onChange={(segmentId) => setFormData({
                ...formData,
                triggerConfig: { ...formData.triggerConfig, segmentId },
              })}
            />
          )}

          {formData.triggerType === 'schedule' && (
            <div className="space-y-2">
              <Label htmlFor="schedule">Expresión Cron *</Label>
              <Input
                id="schedule"
                value={formData.triggerConfig?.schedule || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  triggerConfig: { ...formData.triggerConfig, schedule: e.target.value },
                })}
                placeholder="0 9 * * * (diario a las 9 AM)"
                required
              />
              <p className="text-xs text-gray-400">
                Formato: minuto hora día mes día-semana
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="actionType">Tipo de Acción *</Label>
            <Select
              value={formData.actionType}
              onValueChange={(value: any) => setFormData({ ...formData, actionType: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="beehiiv_tag">Tag en Beehiiv</SelectItem>
                <SelectItem value="webhook">Webhook</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.actionType === 'email' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="emailSubject">Asunto del Email *</Label>
                <Input
                  id="emailSubject"
                  value={formData.actionConfig?.emailSubject || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    actionConfig: { ...formData.actionConfig, emailSubject: e.target.value },
                  })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emailTemplate">Plantilla HTML *</Label>
                <Textarea
                  id="emailTemplate"
                  value={formData.actionConfig?.emailTemplate || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    actionConfig: { ...formData.actionConfig, emailTemplate: e.target.value },
                  })}
                  rows={10}
                  required
                  placeholder="Usa {{firstName}} y {{lastName}} para variables"
                />
              </div>
            </>
          )}

          {formData.actionType === 'beehiiv_tag' && (
            <div className="space-y-2">
              <Label htmlFor="beehiivTag">Nombre del Tag *</Label>
              <Input
                id="beehiivTag"
                value={formData.actionConfig?.beehiivTag || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  actionConfig: { ...formData.actionConfig, beehiivTag: e.target.value },
                })}
                required
              />
            </div>
          )}

          {formData.actionType === 'webhook' && (
            <div className="space-y-2">
              <Label htmlFor="webhookUrl">URL del Webhook *</Label>
              <Input
                id="webhookUrl"
                type="url"
                value={formData.actionConfig?.webhookUrl || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  actionConfig: { ...formData.actionConfig, webhookUrl: e.target.value },
                })}
                required
              />
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Guardar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Automation Logs View
function AutomationLogsView() {
  const { data: logs = [], isLoading } = useQuery<AutomationLog[]>({
    queryKey: ['/api/admin/automations/logs'],
  });

  if (isLoading) {
    return <div className="text-center py-8">Cargando logs...</div>;
  }

  if (logs.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">No hay logs de ejecución</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {logs.map((logEntry) => (
        <Card key={logEntry.log.id}>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant={
                    logEntry.log.status === 'success' ? 'default' :
                    logEntry.log.status === 'failed' ? 'destructive' : 'secondary'
                  }>
                    {logEntry.log.status === 'success' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                    {logEntry.log.status === 'failed' && <XCircle className="h-3 w-3 mr-1" />}
                    {logEntry.log.status === 'skipped' && <Clock className="h-3 w-3 mr-1" />}
                    {logEntry.log.status}
                  </Badge>
                  {logEntry.automation && (
                    <span className="font-medium">{logEntry.automation.name}</span>
                  )}
                </div>
                {logEntry.user && (
                  <p className="text-sm text-muted-foreground">
                    {logEntry.user.email} ({logEntry.user.firstName} {logEntry.user.lastName})
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {new Date(logEntry.log.executedAt).toLocaleString()}
                </p>
                {logEntry.log.errorMessage && (
                  <p className="text-sm text-destructive mt-2">{logEntry.log.errorMessage}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Automation Logs Dialog
function AutomationLogsDialog({
  open,
  onOpenChange,
  automationId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  automationId: string;
}) {
  const { data: logs = [], isLoading } = useQuery<AutomationLog[]>({
    queryKey: [`/api/admin/automations/${automationId}/logs`],
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Logs de Ejecución</DialogTitle>
          <DialogDescription>
            Historial de ejecuciones de esta automatización
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-8">Cargando logs...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No hay logs para esta automatización
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((logEntry) => (
              <Card key={logEntry.log.id}>
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <Badge variant={
                        logEntry.log.status === 'success' ? 'default' :
                        logEntry.log.status === 'failed' ? 'destructive' : 'secondary'
                      }>
                        {logEntry.log.status}
                      </Badge>
                      {logEntry.user && (
                        <p className="text-sm">{logEntry.user.email}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(logEntry.log.executedAt).toLocaleString()}
                      </p>
                      {logEntry.log.errorMessage && (
                        <p className="text-sm text-destructive mt-2">
                          {logEntry.log.errorMessage}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Recent Events View
function RecentEventsView() {
  // This would need a new endpoint to fetch recent events
  return (
    <Card>
      <CardHeader>
        <CardTitle>Eventos Recientes</CardTitle>
        <CardDescription>
          Los eventos más recientes registrados en el sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-center py-8">
          Esta funcionalidad requiere un endpoint adicional para obtener eventos recientes
        </p>
      </CardContent>
    </Card>
  );
}

// Segment Selector Component
function SegmentSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (segmentId: string) => void;
}) {
  const { data: segments = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/segments'],
  });

  return (
    <div className="space-y-2">
      <Label htmlFor="segmentId">Segmento *</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Seleccionar segmento" />
        </SelectTrigger>
        <SelectContent>
          {segments.length === 0 ? (
            <SelectItem value="" disabled>
              No hay segmentos disponibles
            </SelectItem>
          ) : (
            segments.map((segment: any) => (
              <SelectItem key={segment.id} value={segment.id}>
                {segment.name} ({segment.userCount} usuarios)
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      {segments.length === 0 && (
        <p className="text-xs text-gray-400">
          <a href="/admin/segments" className="text-purple-400 hover:underline">
            Crear un segmento primero
          </a>
        </p>
      )}
    </div>
  );
}

