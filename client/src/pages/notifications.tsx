import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import MobileHeader from "@/components/layout/mobile-header";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileText, GraduationCap, Calendar, Eye, MoreVertical } from "lucide-react";

type NotificationItem = {
  id: string;
  contentId: string;
  type: "guide" | "course" | "workshop";
  title: string;
  description: string;
  timeAgo: string;
};

function getContentHref(n: NotificationItem): string {
  if (n.type === "guide") return `/guia/${n.contentId}`;
  if (n.type === "course") return `/course/${n.contentId}`;
  return `/taller/${n.contentId}`;
}

function getTypeLabel(n: NotificationItem): string {
  if (n.type === "guide") return "Nueva guía!";
  if (n.type === "course") return "Nuevo Curso!";
  return "Nuevo taller!";
}

function NotificationIcon({ type }: { type: NotificationItem["type"] }) {
  const base = "h-5 w-5 shrink-0";
  if (type === "guide") return <FileText className={`${base} text-green-500`} />;
  if (type === "course") return <GraduationCap className={`${base} text-purple-500`} />;
  return <Calendar className={`${base} text-purple-500`} />;
}

function TypeLabelClass(type: NotificationItem["type"]): string {
  if (type === "guide") return "text-green-500 font-semibold";
  if (type === "course" || type === "workshop") return "text-purple-500 font-semibold";
  return "font-semibold text-foreground";
}

export default function NotificationsPage() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data, isLoading: listLoading, error } = useQuery<{
    notifications: NotificationItem[];
    unreadCount: number;
  }>({
    queryKey: ["/api/notifications"],
    enabled: isAuthenticated,
    retry: (failureCount, err) => !isUnauthorizedError(err as Error) && failureCount < 3,
  });

  const clearAllMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("simpleAuthToken");
      const res = await fetch("/api/notifications/clear-all", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({ title: "Notificaciones borradas" });
    },
    onError: () => {
      toast({ title: "Error al borrar", variant: "destructive" });
    },
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Inicia sesión",
        description: "Debes iniciar sesión para ver tus notificaciones.",
        variant: "destructive",
      });
      setTimeout(() => { window.location.href = "/login"; }, 500);
    }
  }, [isAuthenticated, isLoading, toast]);

  useEffect(() => {
    if (error && isUnauthorizedError(error as Error)) {
      toast({ title: "Sesión expirada", variant: "destructive" });
      setTimeout(() => { window.location.href = "/login"; }, 500);
    }
  }, [error, toast]);

  const notifications = data?.notifications ?? [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex">
        <div className="w-[250px] bg-card border-r border-border" />
        <div className="flex-1 flex items-center justify-center text-foreground">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <MobileHeader />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 overflow-auto pb-20 lg:pb-0 md:ml-16 lg:ml-[250px]">
          <div className="max-w-2xl mx-auto px-4 py-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 border-b border-border pb-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground uppercase tracking-tight">
                  NOTIFICACIONES
                </h1>
                <p className="text-sm text-muted-foreground mt-1">Notificaciones anteriores</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="shrink-0 bg-muted hover:bg-muted/80 text-foreground"
                onClick={() => clearAllMutation.mutate()}
                disabled={clearAllMutation.isPending || notifications.length === 0}
              >
                {clearAllMutation.isPending ? "Borrando..." : "Borrar todo"}
              </Button>
            </div>

            {listLoading ? (
              <p className="text-muted-foreground">Cargando notificaciones...</p>
            ) : notifications.length === 0 ? (
              <p className="text-muted-foreground">No hay notificaciones.</p>
            ) : (
              <ul className="space-y-4">
                {notifications.map((n) => (
                  <li
                    key={n.id}
                    className="flex items-start gap-3 p-4 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors"
                  >
                    <div className="mt-0.5">
                      <NotificationIcon type={n.type} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={TypeLabelClass(n.type)}>{getTypeLabel(n)}</p>
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                        {n.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">{n.timeAgo}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-foreground"
                        onClick={() => setLocation(getContentHref(n))}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => setLocation(getContentHref(n))}
                          >
                            Ir al contenido
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
