import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAdmin } from "@/hooks/useAdmin";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import MobileHeader from "@/components/layout/mobile-header";
import { Plus, MoreVertical, Calendar, Trash2, GripVertical, ArrowLeft } from "lucide-react";

// ---------- Types (mirror server/adminTasks.ts) ----------

type TaskUser = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  profileImageUrl: string | null;
};

type BoardTask = {
  id: string;
  columnId: string;
  title: string;
  description: string | null;
  priority: "low" | "medium" | "high";
  dueDate: string | null;
  position: number;
  assignee: TaskUser | null;
  createdBy: TaskUser | null;
  createdAt: string | null;
  updatedAt: string | null;
};

type BoardColumn = {
  id: string;
  name: string;
  color: string | null;
  position: number;
  tasks: BoardTask[];
};

type BoardResponse = {
  columns: BoardColumn[];
  assignableUsers: TaskUser[];
};

const PRIORITY_CONFIG: Record<BoardTask["priority"], { label: string; className: string }> = {
  low: { label: "Baja", className: "bg-slate-500/15 text-slate-300 border-slate-500/30" },
  medium: { label: "Media", className: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  high: { label: "Alta", className: "bg-red-500/15 text-red-300 border-red-500/30" },
};

function userInitials(user: TaskUser | null): string {
  if (!user) return "?";
  const first = user.firstName?.[0] || user.email?.[0] || "?";
  const last = user.lastName?.[0] || "";
  return `${first}${last}`.toUpperCase();
}

function userLabel(user: TaskUser | null): string {
  if (!user) return "Sin asignar";
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ");
  return name || user.email;
}

function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  return new Date(dueDate).getTime() < new Date().setHours(0, 0, 0, 0);
}

// ---------- Main page ----------

export default function AdminTasks() {
  const { isLoading: adminLoading, isAdmin } = useAdmin();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<BoardResponse>({
    queryKey: ["/api/admin/tasks/board"],
    enabled: isAdmin,
  });

  const [columns, setColumns] = useState<BoardColumn[]>([]);
  const [activeTask, setActiveTask] = useState<BoardTask | null>(null);

  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<BoardTask | null>(null);
  const [defaultColumnId, setDefaultColumnId] = useState<string | null>(null);

  const [columnDialogOpen, setColumnDialogOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState<BoardColumn | null>(null);

  useEffect(() => {
    if (data?.columns) setColumns(data.columns);
  }, [data]);

  const invalidateBoard = () => qc.invalidateQueries({ queryKey: ["/api/admin/tasks/board"] });

  const createTaskMutation = useMutation({
    mutationFn: (payload: Record<string, any>) => apiRequest("POST", "/api/admin/tasks", payload),
    onSuccess: () => {
      invalidateBoard();
      setTaskDialogOpen(false);
      toast({ title: "Tarea creada" });
    },
    onError: (error: any) =>
      toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, any> }) =>
      apiRequest("PATCH", `/api/admin/tasks/${id}`, payload),
    onSuccess: () => {
      invalidateBoard();
      setTaskDialogOpen(false);
      toast({ title: "Tarea actualizada" });
    },
    onError: (error: any) =>
      toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/tasks/${id}`),
    onSuccess: () => {
      invalidateBoard();
      setTaskDialogOpen(false);
      toast({ title: "Tarea eliminada" });
    },
    onError: (error: any) =>
      toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const moveTaskMutation = useMutation({
    mutationFn: ({ id, columnId, position }: { id: string; columnId: string; position: number }) =>
      apiRequest("POST", `/api/admin/tasks/${id}/move`, { columnId, position }),
    onError: (error: any) => {
      toast({ title: "Error al mover la tarea", description: error.message, variant: "destructive" });
      invalidateBoard();
    },
  });

  const createColumnMutation = useMutation({
    mutationFn: (payload: { name: string; color?: string }) =>
      apiRequest("POST", "/api/admin/tasks/columns", payload),
    onSuccess: () => {
      invalidateBoard();
      setColumnDialogOpen(false);
      toast({ title: "Columna creada" });
    },
    onError: (error: any) =>
      toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const updateColumnMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { name?: string; color?: string } }) =>
      apiRequest("PATCH", `/api/admin/tasks/columns/${id}`, payload),
    onSuccess: () => {
      invalidateBoard();
      setColumnDialogOpen(false);
      toast({ title: "Columna actualizada" });
    },
    onError: (error: any) =>
      toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const deleteColumnMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/tasks/columns/${id}`),
    onSuccess: () => {
      invalidateBoard();
      setColumnDialogOpen(false);
      toast({ title: "Columna eliminada" });
    },
    onError: (error: any) =>
      toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const findColumnOfTask = (taskId: string) =>
    columns.find((c) => c.tasks.some((t) => t.id === taskId));

  const handleDragStart = (event: DragStartEvent) => {
    const task = findColumnOfTask(String(event.active.id))?.tasks.find(
      (t) => t.id === event.active.id
    );
    setActiveTask(task || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    const sourceColumn = findColumnOfTask(activeId);
    if (!sourceColumn) return;
    const activeTaskData = sourceColumn.tasks.find((t) => t.id === activeId);
    if (!activeTaskData) return;

    let destColumn = columns.find((c) => c.id === overId);
    let destIndex: number;

    if (destColumn) {
      destIndex = destColumn.tasks.length;
    } else {
      destColumn = findColumnOfTask(overId);
      if (!destColumn) return;
      destIndex = destColumn.tasks.findIndex((t) => t.id === overId);
    }

    const destColumnId = destColumn.id;

    setColumns((prev) => {
      const next = prev.map((c) => ({ ...c, tasks: [...c.tasks] }));
      const srcCol = next.find((c) => c.id === sourceColumn.id)!;
      const srcIdx = srcCol.tasks.findIndex((t) => t.id === activeId);
      srcCol.tasks.splice(srcIdx, 1);
      const dstCol = next.find((c) => c.id === destColumnId)!;
      const insertAt = Math.min(destIndex, dstCol.tasks.length);
      dstCol.tasks.splice(insertAt, 0, { ...activeTaskData, columnId: destColumnId });
      return next;
    });

    moveTaskMutation.mutate({ id: activeId, columnId: destColumnId, position: destIndex });
  };

  const openNewTask = (columnId: string) => {
    setEditingTask(null);
    setDefaultColumnId(columnId);
    setTaskDialogOpen(true);
  };

  const openEditTask = (task: BoardTask) => {
    setEditingTask(task);
    setDefaultColumnId(task.columnId);
    setTaskDialogOpen(true);
  };

  if (adminLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <h1 className="text-2xl font-bold text-red-500">Acceso Denegado</h1>
        <p className="text-gray-400">No tienes privilegios de administrador.</p>
        <Link href="/">
          <Button>Volver al Inicio</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <MobileHeader />
      <div className="flex">
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        <main className="flex-1 overflow-auto pb-20 lg:pb-0 lg:ml-[250px]">
          <div className="px-4 py-8 max-w-full">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-2">
                  <ArrowLeft className="h-3.5 w-3.5" /> Panel de Administración
                </Link>
                <h1 className="text-3xl font-bold">Tareas</h1>
                <p className="text-muted-foreground mt-1">
                  Tablero interno del equipo para organizar el trabajo pendiente
                </p>
              </div>
              <Button
                onClick={() => {
                  setEditingColumn(null);
                  setColumnDialogOpen(true);
                }}
                variant="outline"
              >
                <Plus className="mr-2 h-4 w-4" />
                Nueva columna
              </Button>
            </div>

            {isLoading ? (
              <div className="text-center py-16 text-muted-foreground">Cargando tablero...</div>
            ) : columns.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                No hay columnas todavía. Crea la primera para empezar a organizar tareas.
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <div className="flex gap-4 overflow-x-auto pb-4">
                  {columns.map((column) => (
                    <TaskColumn
                      key={column.id}
                      column={column}
                      onAddTask={() => openNewTask(column.id)}
                      onEditTask={openEditTask}
                      onEditColumn={() => {
                        setEditingColumn(column);
                        setColumnDialogOpen(true);
                      }}
                    />
                  ))}
                </div>
                <DragOverlay>
                  {activeTask ? <TaskCard task={activeTask} onClick={() => {}} overlay /> : null}
                </DragOverlay>
              </DndContext>
            )}
          </div>
        </main>
      </div>
      <MobileNav />

      <TaskDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        task={editingTask}
        columns={columns}
        defaultColumnId={defaultColumnId}
        assignableUsers={data?.assignableUsers || []}
        onSave={(payload) => {
          if (editingTask) {
            updateTaskMutation.mutate({ id: editingTask.id, payload });
          } else {
            createTaskMutation.mutate(payload);
          }
        }}
        onDelete={editingTask ? () => deleteTaskMutation.mutate(editingTask.id) : undefined}
        isSaving={createTaskMutation.isPending || updateTaskMutation.isPending}
      />

      <ColumnDialog
        open={columnDialogOpen}
        onOpenChange={setColumnDialogOpen}
        column={editingColumn}
        onSave={(payload) => {
          if (editingColumn) {
            updateColumnMutation.mutate({ id: editingColumn.id, payload });
          } else {
            createColumnMutation.mutate(payload as { name: string; color?: string });
          }
        }}
        onDelete={
          editingColumn ? () => deleteColumnMutation.mutate(editingColumn.id) : undefined
        }
        isSaving={createColumnMutation.isPending || updateColumnMutation.isPending}
      />
    </div>
  );
}

// ---------- Column ----------

function TaskColumn({
  column,
  onAddTask,
  onEditTask,
  onEditColumn,
}: {
  column: BoardColumn;
  onAddTask: () => void;
  onEditTask: (task: BoardTask) => void;
  onEditColumn: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div className="flex flex-col w-[300px] shrink-0 rounded-lg border bg-card">
      <div className="flex items-center justify-between px-3 py-3 border-b">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="h-2.5 w-2.5 rounded-full shrink-0"
            style={{ backgroundColor: column.color || "#1978E5" }}
          />
          <h3 className="font-semibold truncate">{column.name}</h3>
          <Badge variant="secondary" className="ml-1">
            {column.tasks.length}
          </Badge>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEditColumn}>Editar columna</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 min-h-[80px] p-2 space-y-2 rounded-b-lg transition-colors ${
          isOver ? "bg-primary/5" : ""
        }`}
      >
        <SortableContext items={column.tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {column.tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={() => onEditTask(task)} />
          ))}
        </SortableContext>

        <Button
          variant="ghost"
          onClick={onAddTask}
          className="w-full justify-start text-muted-foreground hover:text-foreground"
        >
          <Plus className="mr-2 h-4 w-4" />
          Añadir tarea
        </Button>
      </div>
    </div>
  );
}

// ---------- Task card ----------

function TaskCard({
  task,
  onClick,
  overlay,
}: {
  task: BoardTask;
  onClick: () => void;
  overlay?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    disabled: overlay,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
  const overdue = isOverdue(task.dueDate);

  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      style={overlay ? undefined : style}
      {...(overlay ? {} : attributes)}
      {...(overlay ? {} : listeners)}
      onClick={onClick}
      className={`group rounded-md border bg-background p-3 cursor-pointer hover:border-primary/50 transition-colors ${
        overlay ? "shadow-lg rotate-2" : ""
      }`}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="h-4 w-4 text-muted-foreground/40 mt-0.5 shrink-0 group-hover:text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-snug break-words">{task.title}</p>
          {task.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
          )}
          <div className="flex items-center flex-wrap gap-2 mt-2">
            <Badge variant="outline" className={`text-[10px] ${priority.className}`}>
              {priority.label}
            </Badge>
            {task.dueDate && (
              <span
                className={`inline-flex items-center gap-1 text-[11px] ${
                  overdue ? "text-red-400" : "text-muted-foreground"
                }`}
              >
                <Calendar className="h-3 w-3" />
                {new Date(task.dueDate).toLocaleDateString("es-ES", {
                  day: "2-digit",
                  month: "short",
                })}
              </span>
            )}
            {task.assignee && (
              <Avatar className="h-5 w-5 ml-auto">
                <AvatarFallback className="text-[9px]">
                  {userInitials(task.assignee)}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Task dialog ----------

function TaskDialog({
  open,
  onOpenChange,
  task,
  columns,
  defaultColumnId,
  assignableUsers,
  onSave,
  onDelete,
  isSaving,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: BoardTask | null;
  columns: BoardColumn[];
  defaultColumnId: string | null;
  assignableUsers: TaskUser[];
  onSave: (payload: Record<string, any>) => void;
  onDelete?: () => void;
  isSaving: boolean;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [columnId, setColumnId] = useState("");
  const [priority, setPriority] = useState<BoardTask["priority"]>("medium");
  const [assigneeId, setAssigneeId] = useState<string>("none");
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    if (!open) return;
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setColumnId(task.columnId);
      setPriority(task.priority);
      setAssigneeId(task.assignee?.id || "none");
      setDueDate(task.dueDate ? task.dueDate.slice(0, 10) : "");
    } else {
      setTitle("");
      setDescription("");
      setColumnId(defaultColumnId || columns[0]?.id || "");
      setPriority("medium");
      setAssigneeId("none");
      setDueDate("");
    }
  }, [open, task, defaultColumnId, columns]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !columnId) return;
    onSave({
      title: title.trim(),
      description: description.trim() || null,
      columnId,
      priority,
      assigneeId: assigneeId === "none" ? null : assigneeId,
      dueDate: dueDate || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{task ? "Editar tarea" : "Nueva tarea"}</DialogTitle>
          <DialogDescription>
            {task ? "Actualiza los detalles de la tarea" : "Añade una tarea al tablero"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="task-title">Título</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="mt-1"
              autoFocus
            />
          </div>

          <div>
            <Label htmlFor="task-description">Descripción</Label>
            <Textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Columna</Label>
              <Select value={columnId} onValueChange={setColumnId}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {columns.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Prioridad</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as BoardTask["priority"])}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baja</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Responsable</Label>
              <Select value={assigneeId} onValueChange={setAssigneeId}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin asignar</SelectItem>
                  {assignableUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {userLabel(u)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="task-due-date">Fecha límite</Label>
              <Input
                id="task-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:justify-between">
            {onDelete ? (
              <Button
                type="button"
                variant="ghost"
                className="text-red-400 hover:text-red-300"
                onClick={() => {
                  if (confirm("¿Eliminar esta tarea?")) onDelete();
                }}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Eliminar
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {task ? "Guardar" : "Crear tarea"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Column dialog ----------

function ColumnDialog({
  open,
  onOpenChange,
  column,
  onSave,
  onDelete,
  isSaving,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  column: BoardColumn | null;
  onSave: (payload: { name: string; color?: string }) => void;
  onDelete?: () => void;
  isSaving: boolean;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#1978E5");

  useEffect(() => {
    if (!open) return;
    setName(column?.name || "");
    setColor(column?.color || "#1978E5");
  }, [open, column]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), color });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{column ? "Editar columna" : "Nueva columna"}</DialogTitle>
          <DialogDescription>
            {column ? "Renombra o cambia el color de la columna" : "Añade una etapa al tablero"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="column-name">Nombre</Label>
            <Input
              id="column-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1"
              autoFocus
            />
          </div>
          <div>
            <Label htmlFor="column-color">Color</Label>
            <div className="flex items-center gap-2 mt-1">
              <input
                id="column-color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-9 w-12 rounded border cursor-pointer bg-transparent"
              />
              <Input value={color} onChange={(e) => setColor(e.target.value)} />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:justify-between">
            {onDelete ? (
              <Button
                type="button"
                variant="ghost"
                className="text-red-400 hover:text-red-300"
                onClick={() => {
                  if (
                    confirm(
                      "¿Eliminar esta columna? Se eliminarán también todas sus tareas."
                    )
                  )
                    onDelete();
                }}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Eliminar
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {column ? "Guardar" : "Crear columna"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
