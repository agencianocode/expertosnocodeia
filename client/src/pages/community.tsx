import React, { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import MobileHeader from "@/components/layout/mobile-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, MessageCircle, Trophy, Star, ExternalLink } from "lucide-react";

export default function Community() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-bg flex">
        <div className="w-[250px] bg-dark-card border-r border-dark-border"></div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white">Loading...</div>
        </div>
      </div>
    );
  }

  const communityStats = {
    totalMembers: 1247,
    activeToday: 89,
    totalPosts: 2456,
    totalProjects: 134
  };

  const topMembers = [
    {
      id: "1",
      name: "María González",
      avatar: "",
      role: "Mentor",
      contributions: 45,
      level: "Expert"
    },
    {
      id: "2", 
      name: "Carlos Ruiz",
      avatar: "",
      role: "Estudiante",
      contributions: 32,
      level: "Advanced"
    },
    {
      id: "3",
      name: "Ana López",
      avatar: "",
      role: "Creadora",
      contributions: 28,
      level: "Intermediate"
    }
  ];

  const recentActivity = [
    {
      id: "1",
      user: "Pedro Martín",
      action: "completó el curso",
      target: "Automatización con Make.com",
      time: "hace 2 horas"
    },
    {
      id: "2",
      user: "Laura Sánchez",
      action: "publicó un proyecto",
      target: "App de Fitness con FlutterFlow",
      time: "hace 4 horas"
    },
    {
      id: "3",
      user: "Diego Torres",
      action: "obtuvo certificación en",
      target: "No-Code Fundamentals",
      time: "hace 1 día"
    }
  ];

  return (
    <div className="min-h-screen bg-dark-bg text-white">
      {/* Mobile Header */}
      <MobileHeader />
      
      <div className="flex">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main Content */}
        <main className="flex-1 overflow-auto pb-20 lg:pb-0 md:ml-16 lg:ml-[250px]">
          {/* Header */}
          <header className="bg-dark-card border-b border-dark-border p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">Comunidad</h1>
                <p className="text-gray-400 mt-1">
                  Conecta con otros estudiantes, comparte proyectos y aprende juntos.
                </p>
              </div>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <ExternalLink className="h-4 w-4 mr-2" />
                Unirse al Discord
              </Button>
            </div>
          </header>

          <div className="container mx-auto px-6 py-8 max-w-7xl">
            {/* Community Stats */}
            <section className="mb-8">
              <h2 className="text-xl font-bold text-white mb-6">Estadísticas de la Comunidad</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-dark-card border-dark-border">
                  <CardContent className="p-6 text-center">
                    <Users className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{communityStats.totalMembers.toLocaleString()}</p>
                    <p className="text-sm text-gray-400">Miembros Totales</p>
                  </CardContent>
                </Card>
                <Card className="bg-dark-card border-dark-border">
                  <CardContent className="p-6 text-center">
                    <Star className="h-8 w-8 text-green-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{communityStats.activeToday}</p>
                    <p className="text-sm text-gray-400">Activos Hoy</p>
                  </CardContent>
                </Card>
                <Card className="bg-dark-card border-dark-border">
                  <CardContent className="p-6 text-center">
                    <MessageCircle className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{communityStats.totalPosts.toLocaleString()}</p>
                    <p className="text-sm text-gray-400">Publicaciones</p>
                  </CardContent>
                </Card>
                <Card className="bg-dark-card border-dark-border">
                  <CardContent className="p-6 text-center">
                    <Trophy className="h-8 w-8 text-orange-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{communityStats.totalProjects}</p>
                    <p className="text-sm text-gray-400">Proyectos</p>
                  </CardContent>
                </Card>
              </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Top Members */}
              <section>
                <h2 className="text-xl font-bold text-white mb-6">Miembros Destacados</h2>
                <Card className="bg-dark-card border-dark-border">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {topMembers.map((member, index) => (
                        <div key={member.id} className="flex items-center gap-4 p-4 rounded-lg bg-dark-bg/50 hover:bg-dark-bg/70 transition-colors">
                          <div className="flex items-center gap-1 text-sm font-bold text-gray-400 w-6">
                            #{index + 1}
                          </div>
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback className="bg-purple-600 text-white">
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium text-white">{member.name}</p>
                            <p className="text-sm text-gray-400">{member.role}</p>
                          </div>
                          <div className="text-right">
                            <Badge className="bg-purple-500/20 text-purple-400 mb-1">
                              {member.level}
                            </Badge>
                            <p className="text-xs text-gray-500">{member.contributions} contribuciones</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Recent Activity */}
              <section>
                <h2 className="text-xl font-bold text-white mb-6">Actividad Reciente</h2>
                <Card className="bg-dark-card border-dark-border">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {recentActivity.map((activity) => (
                        <div key={activity.id} className="flex items-start gap-4 p-4 rounded-lg bg-dark-bg/50">
                          <Avatar className="h-8 w-8 mt-1">
                            <AvatarFallback className="bg-blue-600 text-white text-sm">
                              {activity.user.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm text-white">
                              <span className="font-medium">{activity.user}</span>
                              <span className="text-gray-400"> {activity.action} </span>
                              <span className="font-medium text-purple-400">{activity.target}</span>
                            </p>
                            <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </section>
            </div>

            {/* Community Guidelines */}
            <section className="mt-8">
              <h2 className="text-xl font-bold text-white mb-6">Únete a Nuestra Comunidad</h2>
              <Card className="bg-dark-card border-dark-border">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Discord</h3>
                      <p className="text-gray-400 mb-4">
                        Únete a nuestro servidor de Discord para chatear en tiempo real, hacer preguntas y colaborar en proyectos.
                      </p>
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Unirse al Discord
                      </Button>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Foro de Proyectos</h3>
                      <p className="text-gray-400 mb-4">
                        Comparte tus proyectos, recibe feedback y encuentra colaboradores para nuevas ideas.
                      </p>
                      <Button variant="outline" className="border-dark-border text-gray-300 hover:bg-dark-bg">
                        <Trophy className="h-4 w-4 mr-2" />
                        Ver Proyectos
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>
          </div>
        </main>
      </div>
      
      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
}