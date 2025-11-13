import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAdmin } from "@/hooks/useAdmin";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import MobileHeader from "@/components/layout/mobile-header";
import { Link } from "wouter";
import { MessageCircle, CheckCircle, Filter, Reply, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface CommentUser {
  firstName: string;
  lastName: string;
  profileImageUrl: string | null;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  userId: string;
  lessonId: string;
  parentCommentId: string | null;
  isAdminReviewed: boolean;
  depth: number;
  replyCount: number;
  user: CommentUser;
  replies: Comment[];
}

interface Lesson {
  id: string;
  title: string;
  courseId: string;
}

interface Course {
  id: string;
  title: string;
}

export default function AdminComments() {
  const { isLoading: adminLoading, isAdmin } = useAdmin();
  const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed'>('pending');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");

  // Fetch all comments (we'll need to expand this endpoint to get all comments across all lessons)
  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ['/api/admin/comments/unread-count'],
    enabled: isAdmin,
  });

  const unreadCount = unreadData?.count || 0;

  const markReviewedMutation = useMutation({
    mutationFn: async (commentId: string) => {
      return apiRequest('PATCH', `/api/comments/${commentId}/review`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/comments/unread-count'] });
    },
  });

  if (adminLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
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
    <div className="min-h-screen bg-dark-bg text-white">
      <MobileHeader />
      
      <div className="flex">
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        
        <main className="flex-1 overflow-auto pb-20 lg:pb-0 lg:ml-[250px]">
          <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                  <MessageCircle className="h-8 w-8" />
                  Gestión de Comentarios
                </h1>
                <p className="text-gray-400 mt-2">
                  Revisa y modera los comentarios de los estudiantes
                </p>
              </div>
              <Link href="/admin">
                <Button variant="outline">Volver al Panel</Button>
              </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-white">
                    Sin Revisar
                  </CardTitle>
                  <MessageCircle className="h-4 w-4 text-amber-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{unreadCount}</div>
                  <p className="text-xs text-gray-400">
                    Comentarios pendientes de revisión
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-white">
                    Revisados
                  </CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">-</div>
                  <p className="text-xs text-gray-400">
                    Comentarios revisados
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-white">
                    Total
                  </CardTitle>
                  <MessageCircle className="h-4 w-4 text-purple-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">-</div>
                  <p className="text-xs text-gray-400">
                    Todos los comentarios
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <div className="mb-6 flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                onClick={() => setFilter('all')}
                size="sm"
              >
                <Filter className="h-4 w-4 mr-2" />
                Todos
              </Button>
              <Button
                variant={filter === 'pending' ? 'default' : 'outline'}
                onClick={() => setFilter('pending')}
                size="sm"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Pendientes
              </Button>
              <Button
                variant={filter === 'reviewed' ? 'default' : 'outline'}
                onClick={() => setFilter('reviewed')}
                size="sm"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Revisados
              </Button>
            </div>

            {/* Placeholder for comments list */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardContent className="pt-6">
                <div className="text-center py-12 text-gray-400">
                  <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">
                    Sistema de Comentarios en Desarrollo
                  </p>
                  <p className="text-sm">
                    La lista completa de comentarios se mostrará aquí próximamente.
                  </p>
                  <div className="mt-6 text-left max-w-2xl mx-auto">
                    <h3 className="font-semibold mb-3 text-white">Funcionalidades implementadas:</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <span>API backend completa (crear, responder, marcar revisado, contador)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <span>Componente de comentarios integrado en páginas de curso</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <span>Notificaciones por email con Resend</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <span>Sistema de hilos y respuestas anidadas</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <span>Contador de comentarios sin revisar: {unreadCount}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <MobileNav />
    </div>
  );
}
