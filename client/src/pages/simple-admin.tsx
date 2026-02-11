import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, BookOpen, GraduationCap, BarChart3, Plus } from "lucide-react";
import { Link } from "wouter"; 

interface DashboardData {
  totalCourses: number;
  totalUsers: number;
  totalLessons: number;
  totalCategories: number;
}

export default function SimpleAdmin() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/dashboard');
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        setDashboardData(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando panel de administración...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
            <CardDescription>No se pudo cargar el panel de administración</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} className="w-full">
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Panel de Administración</h1>
          <p className="text-gray-600 mt-2">Gestiona tu plataforma educativa NoCode</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cursos</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData?.totalCourses || 0}</div>
              <p className="text-xs text-muted-foreground">
                Cursos disponibles
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData?.totalUsers || 0}</div>
              <p className="text-xs text-muted-foreground">
                Usuarios registrados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Lecciones</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData?.totalLessons || 0}</div>
              <p className="text-xs text-muted-foreground">
                Lecciones creadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categorías</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData?.totalCategories || 0}</div>
              <p className="text-xs text-muted-foreground">
                Categorías activas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Status */}
        <Card>
          <CardHeader>
            <CardTitle>Sistema de Administración</CardTitle>
            <CardDescription>Estado actual del sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Base de datos</span>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  Conectada
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Autenticación</span>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  Activa
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">API</span>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  Funcionando
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>Gestiona tu contenido educativo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Link href="/simple-admin/course/new">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Nuevo Curso
                </Button>
              </Link>
              <Button asChild variant="outline">
                <a href="/preview-landing" target="_blank">
                  Ver Landing Principal
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href="/preview-universidad" target="_blank">
                  Ver Universidad NoCode
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href="/login">
                  Ir al Login
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
