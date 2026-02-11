import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Users,
  RefreshCw,
  Calculator,
  Filter
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Segment = {
  id: string;
  name: string;
  description?: string;
  rules: any;
  userCount: number;
  lastCalculatedAt?: string;
  createdAt: string;
  updatedAt: string;
};

type SegmentRule = {
  subscriptionStatus?: 'active' | 'trial' | 'cancelled' | 'none';
  subscriptionPlanId?: string;
  minCoursesCompleted?: number;
  maxCoursesCompleted?: number;
  minLessonsCompleted?: number;
  hasCompletedCourse?: string;
  hasNotCompletedCourse?: string;
  registeredAfter?: string;
  registeredBefore?: string;
  experienceLevel?: string[];
  workAreas?: string[];
  learningMethods?: string[];
  goals?: string[];
  hasTriggeredEvent?: string;
  hasNotTriggeredEvent?: string;
  lastLoginAfter?: string;
  lastLoginBefore?: string;
  isInactive?: boolean;
  inactiveDays?: number;
  minPoints?: number;
  minLevel?: number;
};

export default function AdminSegments() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSegment, setSelectedSegment] = useState<Segment | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCalculating, setIsCalculating] = useState<string | null>(null);

  // Fetch segments
  const { data: segments = [], isLoading } = useQuery<Segment[]>({
    queryKey: ['/api/admin/segments'],
  });

  // Create/Update segment mutation
  const segmentMutation = useMutation({
    mutationFn: async (data: Partial<Segment>) => {
      if (selectedSegment?.id) {
        return apiRequest('PUT', `/api/admin/segments/${selectedSegment.id}`, data);
      } else {
        return apiRequest('POST', '/api/admin/segments', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/segments'] });
      setIsDialogOpen(false);
      setSelectedSegment(null);
      toast({
        title: "Éxito",
        description: selectedSegment ? "Segmento actualizado" : "Segmento creado",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al guardar segmento",
        variant: "destructive",
      });
    },
  });

  // Delete segment mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/admin/segments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/segments'] });
      toast({
        title: "Éxito",
        description: "Segmento eliminado",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al eliminar segmento",
        variant: "destructive",
      });
    },
  });

  // Calculate segment mutation
  const calculateMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('POST', `/api/admin/segments/${id}/calculate`);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/segments'] });
      setIsCalculating(null);
      toast({
        title: "Éxito",
        description: `Segmento calculado: ${data.count} usuarios`,
      });
    },
    onError: (error: any) => {
      setIsCalculating(null);
      toast({
        title: "Error",
        description: error.message || "Error al calcular segmento",
        variant: "destructive",
      });
    },
  });

  // Recalculate all segments
  const recalculateAllMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/admin/segments/recalculate-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/segments'] });
      toast({
        title: "Éxito",
        description: "Todos los segmentos recalculados",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al recalcular segmentos",
        variant: "destructive",
      });
    },
  });

  const handleCreate = () => {
    setSelectedSegment(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (segment: Segment) => {
    setSelectedSegment(segment);
    setIsDialogOpen(true);
  };

  const handleDelete = (segment: Segment) => {
    if (confirm(`¿Estás seguro de eliminar el segmento "${segment.name}"?`)) {
      deleteMutation.mutate(segment.id);
    }
  };

  const handleCalculate = (segment: Segment) => {
    setIsCalculating(segment.id);
    calculateMutation.mutate(segment.id);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Segmentación de Usuarios</h1>
          <p className="text-gray-400">
            Crea y gestiona segmentos de usuarios para automatizaciones y campañas
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-4 mb-6">
          <Button onClick={handleCreate} className="bg-purple-600 hover:bg-purple-700">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Segmento
          </Button>
          <Button 
            onClick={() => recalculateAllMutation.mutate()} 
            variant="outline"
            disabled={recalculateAllMutation.isPending}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${recalculateAllMutation.isPending ? 'animate-spin' : ''}`} />
            Recalcular Todos
          </Button>
        </div>

        {/* Segments List */}
        {isLoading ? (
          <div className="text-center py-12 text-gray-400">Cargando segmentos...</div>
        ) : segments.length === 0 ? (
          <Card className="bg-slate-900/50 border-slate-700">
            <CardContent className="py-12 text-center">
              <Filter className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">No hay segmentos creados</p>
              <Button onClick={handleCreate} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="mr-2 h-4 w-4" />
                Crear Primer Segmento
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {segments.map((segment) => (
              <Card key={segment.id} className="bg-slate-900/50 border-slate-700">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-white mb-1">{segment.name}</CardTitle>
                      {segment.description && (
                        <CardDescription className="text-gray-400 text-sm mt-1">
                          {segment.description}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-white font-semibold">{segment.userCount}</span>
                      <span className="text-gray-400 text-sm">usuarios</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {formatDate(segment.lastCalculatedAt)}
                    </Badge>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(segment)}
                      className="flex-1"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCalculate(segment)}
                      disabled={isCalculating === segment.id}
                      className="flex-1"
                    >
                      <Calculator className={`h-3 w-3 mr-1 ${isCalculating === segment.id ? 'animate-spin' : ''}`} />
                      Calcular
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(segment)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create/Edit Segment Dialog */}
        <SegmentDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          segment={selectedSegment}
          onSave={(data) => segmentMutation.mutate(data)}
        />
      </div>
    </div>
  );
}

// Segment Dialog Component
function SegmentDialog({
  open,
  onOpenChange,
  segment,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  segment: Segment | null;
  onSave: (data: Partial<Segment>) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rules, setRules] = useState<SegmentRule>({});

  // Reset form when dialog opens/closes or segment changes
  useEffect(() => {
    if (open) {
      if (segment) {
        setName(segment.name || '');
        setDescription(segment.description || '');
        setRules(segment.rules || {});
      } else {
        setName('');
        setDescription('');
        setRules({});
      }
    }
  }, [open, segment]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      description,
      rules,
    });
  };

  const updateRule = (key: keyof SegmentRule, value: any) => {
    setRules(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{segment ? 'Editar Segmento' : 'Nuevo Segmento'}</DialogTitle>
          <DialogDescription>
            Define las reglas para segmentar usuarios
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="name">Nombre del Segmento</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1"
              rows={2}
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Reglas de Segmentación</h3>

            {/* Subscription Status */}
            <div>
              <Label>Estado de Suscripción</Label>
              <Select
                value={rules.subscriptionStatus || 'all'}
                onValueChange={(value) => updateRule('subscriptionStatus', value === 'all' ? undefined : value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="trial">Prueba</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                  <SelectItem value="none">Sin suscripción</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Course Completion */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Mín. Cursos Completados</Label>
                <Input
                  type="number"
                  min="0"
                  value={rules.minCoursesCompleted || ''}
                  onChange={(e) => updateRule('minCoursesCompleted', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Máx. Cursos Completados</Label>
                <Input
                  type="number"
                  min="0"
                  value={rules.maxCoursesCompleted || ''}
                  onChange={(e) => updateRule('maxCoursesCompleted', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Registration Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Registrado Después De</Label>
                <Input
                  type="date"
                  value={rules.registeredAfter || ''}
                  onChange={(e) => updateRule('registeredAfter', e.target.value || undefined)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Registrado Antes De</Label>
                <Input
                  type="date"
                  value={rules.registeredBefore || ''}
                  onChange={(e) => updateRule('registeredBefore', e.target.value || undefined)}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Inactivity */}
            <div className="flex items-center gap-4">
              <input
                type="checkbox"
                id="isInactive"
                checked={rules.isInactive || false}
                onChange={(e) => updateRule('isInactive', e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="isInactive" className="cursor-pointer">
                Usuario inactivo
              </Label>
              {rules.isInactive && (
                <div className="flex-1">
                  <Input
                    type="number"
                    min="1"
                    placeholder="Días de inactividad"
                    value={rules.inactiveDays || ''}
                    onChange={(e) => updateRule('inactiveDays', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="max-w-32"
                  />
                </div>
              )}
            </div>

            {/* Points/Level */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Puntos Mínimos</Label>
                <Input
                  type="number"
                  min="0"
                  value={rules.minPoints || ''}
                  onChange={(e) => updateRule('minPoints', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Nivel Mínimo</Label>
                <Input
                  type="number"
                  min="1"
                  value={rules.minLevel || ''}
                  onChange={(e) => updateRule('minLevel', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
              {segment ? 'Actualizar' : 'Crear'} Segmento
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

