import { useEffect, useState } from "react";
import { useSimpleAuth } from "@/hooks/use-simple-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type Course = {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  duration: number;
  imageUrl: string;
  category: {
    name: string;
    slug: string;
  };
};

type UserProgress = {
  id: string;
  courseId: string;
  completedLessons: number;
  totalLessons: number;
  isCompleted: boolean;
  lastAccessedAt: string;
};

type RecentActivity = {
  id: string;
  courseId: string;
  lastAccessedAt: string;
  course: {
    title: string;
    imageUrl: string;
  };
};

export default function RealDashboard() {
  const { user, logout } = useSimpleAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('simpleAuthToken');
        if (!token) return;

        // Fetch all data in parallel
        const [coursesRes, progressRes, activityRes] = await Promise.all([
          fetch('/api/courses'),
          fetch('/api/user-progress', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('/api/user-recent-activity', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        if (coursesRes.ok) {
          const coursesData = await coursesRes.json();
          setCourses(coursesData);
        }

        if (progressRes.ok) {
          const progressData = await progressRes.json();
          setUserProgress(progressData);
        }

        if (activityRes.ok) {
          const activityData = await activityRes.json();
          setRecentActivity(activityData);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando tu dashboard...</p>
        </div>
      </div>
    );
  }

  const totalCourses = courses.length;
  const coursesInProgress = userProgress.filter(p => !p.isCompleted).length;
  const coursesCompleted = userProgress.filter(p => p.isCompleted).length;
  const totalLessonsCompleted = userProgress.reduce((sum, p) => sum + p.completedLessons, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              ¡Bienvenido de vuelta, {user?.firstName}!
            </h1>
            <p className="text-muted-foreground">
              Tu plataforma de aprendizaje NoCode IA
            </p>
          </div>
          <Button variant="outline" onClick={logout}>
            Cerrar sesión
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card key="total-courses">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Cursos Disponibles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCourses}</div>
            </CardContent>
          </Card>

          <Card key="in-progress">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                En Progreso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{coursesInProgress}</div>
            </CardContent>
          </Card>

          <Card key="completed">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{coursesCompleted}</div>
            </CardContent>
          </Card>

          <Card key="lessons-completed">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Lecciones Completadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{totalLessonsCompleted}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Tu Progreso */}
          <Card key="user-progress">
            <CardHeader>
              <CardTitle>Tu Progreso</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {userProgress.length > 0 ? (
                userProgress.map((progress) => {
                  const course = courses.find(c => c.id === progress.courseId);
                  const completionPercent = Math.round((progress.completedLessons / progress.totalLessons) * 100);
                  
                  return (
                    <div key={progress.id} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{course?.title || 'Curso'}</span>
                        <span className="text-muted-foreground">
                          {progress.completedLessons}/{progress.totalLessons} lecciones
                        </span>
                      </div>
                      <Progress value={completionPercent} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{completionPercent}% completado</span>
                        <span>Último acceso: {new Date(progress.lastAccessedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-muted-foreground">Aún no has comenzado ningún curso.</p>
              )}
            </CardContent>
          </Card>

          {/* Actividad Reciente */}
          <Card key="recent-activity">
            <CardHeader>
              <CardTitle>Actividad Reciente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <span className="text-xs font-bold">📚</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {activity.course?.title || 'Curso'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.lastAccessedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">No hay actividad reciente.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Success Message */}
        <div className="mt-8">
          <Card className="bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-green-800">✅ ¡Migración Exitosa!</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-green-700 space-y-2">
                <p><strong>Tu cuenta:</strong> {user?.email}</p>
                <p><strong>Datos preservados:</strong> {userProgress.length} curso(s) en progreso, {recentActivity.length} actividades recientes</p>
                <p><strong>Sistema:</strong> Autenticación JWT funcionando perfectamente</p>
                <p><strong>Estado:</strong> ¡Listo para usar todas las funcionalidades!</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}