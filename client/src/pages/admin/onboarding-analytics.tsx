import { useState, useEffect } from "react";
import { useAdmin } from "@/hooks/useAdmin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Users, TrendingUp, Target, Brain } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import Sidebar from "@/components/layout/sidebar";
import MobileHeader from "@/components/layout/mobile-header";

interface OnboardingAnalytics {
  totalResponses: number;
  experienceLevels: Record<string, number>;
  popularWorkAreas: Record<string, number>;
  popularLearningMethods: Record<string, number>;
  popularGoals: Record<string, number>;
  popularAiTools: Record<string, number>;
  recentResponses: any[];
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe'];

export default function OnboardingAnalytics() {
  const { isLoading, isAdmin } = useAdmin();
  const [analytics, setAnalytics] = useState<OnboardingAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/admin/onboarding/analytics', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setAnalytics(data);
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setAnalyticsLoading(false);
      }
    };

    if (isAdmin && !isLoading) {
      fetchAnalytics();
    }
  }, [isAdmin, isLoading]);

  if (isLoading || analyticsLoading) {
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

  // Convert analytics data to chart format
  const experienceLevelData = analytics?.experienceLevels ? 
    Object.entries(analytics.experienceLevels).map(([level, count]) => ({
      name: level,
      value: count
    })) : [];

  const workAreasData = analytics?.popularWorkAreas ? 
    Object.entries(analytics.popularWorkAreas)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([area, count]) => ({
        name: area,
        count: count
      })) : [];

  const aiToolsData = analytics?.popularAiTools ? 
    Object.entries(analytics.popularAiTools)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([tool, count]) => ({
        name: tool,
        count: count
      })) : [];

  const learningMethodsData = analytics?.popularLearningMethods ? 
    Object.entries(analytics.popularLearningMethods)
      .sort(([,a], [,b]) => b - a)
      .map(([method, count]) => ({
        name: method,
        count: count
      })) : [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <MobileHeader />
      
      <div className="flex">
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        
        <main className="flex-1 overflow-auto pb-20 lg:pb-0 lg:ml-[250px]">
          <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-white">Analytics de Onboarding</h1>
                <p className="text-gray-400 mt-2">Insights de usuarios que completaron el onboarding</p>
              </div>
              <Link href="/admin/dashboard">
                <Button variant="outline">Volver al Dashboard</Button>
              </Link>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-white">
                    Total Respuestas
                  </CardTitle>
                  <Users className="h-4 w-4 text-purple-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{analytics?.totalResponses || 0}</div>
                  <p className="text-xs text-gray-400">
                    Usuarios completaron onboarding
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-white">
                    Herramienta Más Popular
                  </CardTitle>
                  <Brain className="h-4 w-4 text-purple-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {aiToolsData[0]?.name || 'N/A'}
                  </div>
                  <p className="text-xs text-gray-400">
                    {aiToolsData[0]?.count || 0} usuarios
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-white">
                    Área Más Popular
                  </CardTitle>
                  <Target className="h-4 w-4 text-purple-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {workAreasData[0]?.name || 'N/A'}
                  </div>
                  <p className="text-xs text-gray-400">
                    {workAreasData[0]?.count || 0} usuarios
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-white">
                    Tasa de Completado
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-purple-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">100%</div>
                  <p className="text-xs text-gray-400">
                    Solo respuestas completas
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Experience Levels Pie Chart */}
              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Niveles de Experiencia</CardTitle>
                  <CardDescription className="text-gray-400">
                    Distribución de experiencia en NoCode IA
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={experienceLevelData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {experienceLevelData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Work Areas Bar Chart */}
              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Áreas de Trabajo Populares</CardTitle>
                  <CardDescription className="text-gray-400">
                    Top 8 áreas donde quieren ayuda con IA
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={workAreasData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey="name" 
                        stroke="#9CA3AF"
                        fontSize={12}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px'
                        }} 
                      />
                      <Bar dataKey="count" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* AI Tools and Learning Methods */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* AI Tools */}
              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Herramientas de IA Más Usadas</CardTitle>
                  <CardDescription className="text-gray-400">
                    Top 10 herramientas reportadas por usuarios
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={aiToolsData} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis type="number" stroke="#9CA3AF" />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        stroke="#9CA3AF"
                        fontSize={12}
                        width={80}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px'
                        }} 
                      />
                      <Bar dataKey="count" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Learning Methods */}
              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Métodos de Aprendizaje Preferidos</CardTitle>
                  <CardDescription className="text-gray-400">
                    Cómo prefieren aprender los usuarios
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={learningMethodsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey="name" 
                        stroke="#9CA3AF"
                        fontSize={11}
                        angle={-45}
                        textAnchor="end"
                        height={100}
                      />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px'
                        }} 
                      />
                      <Bar dataKey="count" fill="#ffc658" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}