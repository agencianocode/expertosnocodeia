import { useAdmin } from "@/hooks/useAdmin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, FolderOpen, Image, ClipboardList, MessageSquare, DoorOpen, Mail, Newspaper, Zap } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import MobileHeader from "@/components/layout/mobile-header";

export default function AdminDashboard() {
  const { adminStats, isLoading, isAdmin } = useAdmin();

  if (isLoading) {
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

  const stats = [
    {
      title: "Usuarios",
      value: (adminStats as any)?.totalUsers || 0,
      description: "Usuarios registrados",
      icon: Users,
      href: "/admin/users",
    },
    {
      title: "Total de Cursos",
      value: (adminStats as any)?.totalCourses || 0,
      description: "Cursos publicados y en borrador",
      icon: BookOpen,
      href: "/admin/content",
    },
    {
      title: "Categorías",
      value: (adminStats as any)?.totalCategories || 0,
      description: "Categorías de contenido",
      icon: FolderOpen,
      href: "/admin/categories",
    },
    {
      title: "Comentarios",
      value: (adminStats as any)?.totalComments || 0,
      description: "Comentarios de estudiantes",
      icon: MessageSquare,
      href: "/admin/comentarios",
    },
    {
      title: "Respuestas Onboarding",
      value: (adminStats as any)?.totalOnboardingResponses || 0,
      description: "Usuarios que completaron onboarding",
      icon: ClipboardList,
      href: "/admin/onboarding",
    },
    {
      title: "Archivos Multimedia",
      value: (adminStats as any)?.totalMediaFiles || 0,
      description: "Imágenes, videos y documentos",
      icon: Image,
      href: "/admin/media",
    },
    {
      title: "Email Marketing",
      value: "—",
      description: "Gestiona emails y secuencias",
      icon: Mail,
      href: "/admin/emails",
    },
    {
      title: "Beehiiv",
      value: "—",
      description: "Integración con newsletter",
      icon: Newspaper,
      href: "/admin/beehiiv",
    },
    {
      title: "Automatizaciones",
      value: "—",
      description: "Automatizaciones avanzadas",
      icon: Zap,
      href: "/admin/automations",
    },
  ];

  return (
    <div className="min-h-screen bg-dark-bg text-white">
      {/* Mobile Header */}
      <MobileHeader />
      
      <div className="flex">
        {/* Sidebar - Hidden on mobile */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        
        {/* Main Content */}
        <main className="flex-1 overflow-auto pb-20 lg:pb-0 lg:ml-[250px]">
          <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Panel de Administración</h1>
          <p className="text-gray-400 mt-2">Gestiona todo el contenido de la plataforma</p>
        </div>
        <Link href="/">
          <Button variant="outline">Ver Plataforma</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Link key={index} href={stat.href}>
              <Card className="bg-slate-900/50 border-slate-700 hover:bg-slate-800/50 transition-colors cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-white">
                    {stat.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-purple-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <p className="text-xs text-gray-400">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Acciones Rápidas</CardTitle>
            <CardDescription className="text-gray-400">
              Operaciones comunes de administración
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/admin/content">
              <Button className="w-full justify-start">
                <BookOpen className="mr-2 h-4 w-4" />
                Gestionar Contenido
              </Button>
            </Link>
            <Link href="/admin/comentarios">
              <Button variant="outline" className="w-full justify-start">
                <MessageSquare className="mr-2 h-4 w-4" />
                Gestionar Comentarios
              </Button>
            </Link>
            <Link href="/admin/rooms">
              <Button variant="outline" className="w-full justify-start">
                <DoorOpen className="mr-2 h-4 w-4" />
                Gestionar Salas
              </Button>
            </Link>
            <Link href="/admin/content/course/new">
              <Button variant="outline" className="w-full justify-start">
                <BookOpen className="mr-2 h-4 w-4" />
                Crear Nuevo Curso
              </Button>
            </Link>
            <Link href="/admin/content/category/new">
              <Button variant="outline" className="w-full justify-start">
                <FolderOpen className="mr-2 h-4 w-4" />
                Crear Nueva Categoría
              </Button>
            </Link>
            <Link href="/admin/media/upload">
              <Button variant="outline" className="w-full justify-start">
                <Image className="mr-2 h-4 w-4" />
                Subir Archivos Multimedia
              </Button>
            </Link>
            <Link href="/admin/segments">
              <Button variant="outline" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                Gestionar Segmentos
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Actividad Reciente</CardTitle>
            <CardDescription className="text-gray-400">
              Últimas actividades en la plataforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">
                Funcionalidad de actividad reciente próximamente
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
          </div>
        </main>
      </div>
      
      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
}