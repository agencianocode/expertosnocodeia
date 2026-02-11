import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSimpleAuth } from "@/hooks/use-simple-auth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trophy, Medal, Award, HelpCircle, Lock, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

const LEVELS = [
  { level: 1, points: 0 },
  { level: 2, points: 100 },
  { level: 3, points: 200 },
  { level: 4, points: 400 },
  { level: 5, points: 1200 },
  { level: 6, points: 2400 },
  { level: 7, points: 4800 },
  { level: 8, points: 7200 },
  { level: 9, points: 10400 },
];

function getPointsForNextLevel(currentLevel: number, currentPoints: number): number {
  const nextLevel = LEVELS.find(l => l.level === currentLevel + 1);
  if (!nextLevel) return 0;
  return Math.max(0, nextLevel.points - currentPoints);
}

export default function Leaderboard() {
  const { user } = useSimpleAuth();
  const { toast } = useToast();
  const [period, setPeriod] = useState<"7_days" | "30_days" | "all_time">("7_days");
  const [pointsInfoOpen, setPointsInfoOpen] = useState(false);

  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ['/api/community/leaderboard', period],
    queryFn: async () => {
      const response = await fetch(`/api/community/leaderboard?period=${period}`);
      if (!response.ok) throw new Error('Failed to fetch leaderboard');
      return response.json();
    },
  });

  const { data: userStats } = useQuery({
    queryKey: ['/api/community/users/stats', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const response = await fetch(`/api/community/users/${user?.id}/stats`);
      if (!response.ok) throw new Error('Failed to fetch user stats');
      return response.json();
    },
  });

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return <div className="bg-yellow-500 text-white text-sm font-bold rounded-full h-8 w-8 flex items-center justify-center border-2 border-yellow-600">1</div>;
    } else if (rank === 2) {
      return <div className="bg-gray-400 text-white text-sm font-bold rounded-full h-8 w-8 flex items-center justify-center border-2 border-gray-500">2</div>;
    } else if (rank === 3) {
      return <div className="bg-amber-700 text-white text-sm font-bold rounded-full h-8 w-8 flex items-center justify-center border-2 border-amber-800">3</div>;
    } else {
      return <div className="bg-[#404040] text-gray-400 text-sm font-bold rounded-full h-8 w-8 flex items-center justify-center">{rank}</div>;
    }
  };

  const currentUserRank = leaderboard?.findIndex((u: any) => u.userId === user?.id) ?? -1;
  const currentUserData = currentUserRank >= 0 ? leaderboard[currentUserRank] : null;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="md:ml-16 lg:ml-[250px] min-h-screen">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <h1 className="text-3xl font-bold text-white mb-8">Clasificación</h1>

          {/* User's Personal Progress Card */}
          {user && (
            <Card className="bg-[#1a1a1a] border-[#333333] mb-6">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-start gap-6">
                  {/* Left side: Avatar with name and points below */}
                  <div className="flex flex-col items-center sm:items-start">
                    <div className="relative mb-3">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={(user as any)?.profileImageUrl || undefined} />
                        <AvatarFallback className="bg-[#333333] text-white text-2xl">
                          {(user?.firstName?.charAt(0) || "U").toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {/* Badge de nivel en el avatar */}
                      <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-white text-xs font-bold rounded-full h-7 w-7 flex items-center justify-center border-2 border-[#1a1a1a]">
                        {userStats?.level || 1}
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-white text-center sm:text-left mb-1">
                      {user.firstName} {user.lastName}
                    </h3>
                    <p className="text-sm text-muted-foreground text-center sm:text-left">
                      {userStats?.points || 0} puntos
                    </p>
                  </div>

                  {/* Right side: Level info and levels grid */}
                  <div className="flex-1 w-full">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex items-center gap-2">
                        <Trophy className="h-6 w-6 text-yellow-500" />
                        <span className="text-white font-semibold text-lg">Nivel {userStats?.level || 1}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-6">
                      <span className="text-sm text-muted-foreground">
                        {userStats ? getPointsForNextLevel(userStats.level || 1, userStats.points || 0) : 0} puntos para subir de nivel
                      </span>
                      <HelpCircle 
                        className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-cyan-500 transition-colors" 
                        onClick={() => setPointsInfoOpen(true)}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {LEVELS.map((level) => {
                        const currentLevel = userStats?.level || 1;
                        const isUnlocked = currentLevel >= level.level;
                        const isCurrent = currentLevel === level.level;
                        return (
                          <div
                            key={level.level}
                            className={cn(
                              "flex items-center gap-2 text-sm",
                              isUnlocked ? "text-white" : "text-muted-foreground"
                            )}
                          >
                            {isCurrent ? (
                              <div className="bg-yellow-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0">
                                {level.level}
                              </div>
                            ) : isUnlocked ? (
                              <Award className="h-4 w-4 text-green-500 flex-shrink-0" />
                            ) : (
                              <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            )}
                            <span className="flex-1">Nivel {level.level}: {level.points} puntos</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Period Filters - Moved after user card */}
          <div className="flex items-center gap-4 mb-6 flex-wrap">
            <Button
              variant={period === "7_days" ? "default" : "outline"}
              onClick={() => setPeriod("7_days")}
              className={cn(
                period === "7_days"
                  ? "bg-cyan-500 hover:bg-cyan-600 text-white border-cyan-500"
                  : "border-[#333333] text-white hover:bg-[#232323] bg-transparent"
              )}
            >
              7 días
            </Button>
            <Button
              variant={period === "30_days" ? "default" : "outline"}
              onClick={() => setPeriod("30_days")}
              className={cn(
                period === "30_days"
                  ? "bg-cyan-500 hover:bg-cyan-600 text-white border-cyan-500"
                  : "border-[#333333] text-white hover:bg-[#232323] bg-transparent"
              )}
            >
              30 días
            </Button>
            <Button
              variant={period === "all_time" ? "default" : "outline"}
              onClick={() => setPeriod("all_time")}
              className={cn(
                period === "all_time"
                  ? "bg-cyan-500 hover:bg-cyan-600 text-white border-cyan-500"
                  : "border-[#333333] text-white hover:bg-[#232323] bg-transparent"
              )}
            >
              Todo el tiempo
            </Button>
            <a
              href="#"
              className="text-sm text-cyan-500 hover:text-cyan-400 ml-auto cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                setPointsInfoOpen(true);
              }}
            >
              ¿Cómo funcionan los puntos?
            </a>
          </div>

          {/* Leaderboard List */}
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Cargando clasificación...</p>
            </div>
          ) : leaderboard && leaderboard.length > 0 ? (
            <div className="space-y-3">
              {leaderboard.map((member: any, index: number) => {
                const rank = index + 1;
                const isCurrentUser = member.userId === user?.id;
                return (
                  <Card
                    key={member.userId}
                    className={cn(
                      "bg-[#1a1a1a] border-[#333333] hover:bg-[#232323] transition-colors",
                      isCurrentUser && "border-cyan-500 border-2"
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0">
                          {getRankBadge(rank)}
                        </div>
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={member.profileImageUrl || undefined} />
                          <AvatarFallback className="bg-[#333333] text-white">
                            {(member.firstName?.charAt(0) || "U").toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-semibold truncate">
                            {member.firstName} {member.lastName}
                          </h3>
                          {member.shortDescription && (
                            <p className="text-sm text-muted-foreground truncate">
                              {member.shortDescription}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <p className="text-white font-semibold">+ {member.points || 0}</p>
                            <p className="text-xs text-muted-foreground">Nivel {member.level || 1}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No hay usuarios en la clasificación aún.</p>
            </div>
          )}
        </div>
      </div>
      <MobileNav />

      {/* Points Info Dialog */}
      <Dialog open={pointsInfoOpen} onOpenChange={setPointsInfoOpen}>
        <DialogContent className="max-w-lg bg-[#1a1a1a] border-[#333333] text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white">
              ¿Cómo funcionan los puntos?
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 mt-4">
            {/* 1 me gusta = 1 punto */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-white">1 me gusta = 1 punto</h3>
              <p className="text-sm text-muted-foreground">
                Recibir un "me gusta" en una publicación o comentario te otorga 1 punto. 
                Esto fomenta que los miembros hagan contribuciones valiosas y recompensa a otros 
                por dar "me gusta" a las publicaciones.
              </p>
            </div>

            {/* Recompensas */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-white">Recompensas</h3>
              <p className="text-sm text-muted-foreground">
                Los administradores de la comunidad pueden otorgar puntos ocasionalmente. 
                Estas recompensas son visibles en tu perfil.
              </p>
            </div>

            {/* Niveles */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-white">Niveles</h3>
              <p className="text-sm text-muted-foreground">
                A medida que acumulas puntos, avanzarás por los niveles del 1 al 9. 
                Tu nivel actual se muestra en tu avatar y los puntos necesarios para el siguiente 
                nivel se muestran en tu página de perfil.
              </p>
            </div>

            {/* Tabla de niveles */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white">Progresión de Niveles</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {LEVELS.map((level) => {
                  const currentLevel = userStats?.level || 1;
                  const isUnlocked = currentLevel >= level.level;
                  const isCurrent = currentLevel === level.level;
                  
                  return (
                    <div
                      key={level.level}
                      className={cn(
                        "p-3 rounded border",
                        isCurrent
                          ? "bg-yellow-500/20 border-yellow-500 text-white"
                          : isUnlocked
                          ? "bg-green-500/10 border-green-500/50 text-white"
                          : "bg-[#2a2a2a] border-[#333333] text-muted-foreground"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {isCurrent ? (
                          <Trophy className="h-5 w-5 text-yellow-500" />
                        ) : isUnlocked ? (
                          <Award className="h-5 w-5 text-green-500" />
                        ) : (
                          <Lock className="h-5 w-5 text-muted-foreground" />
                        )}
                        <div>
                          <p className="font-semibold">Nivel {level.level}</p>
                          <p className="text-xs">{level.points} puntos</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

