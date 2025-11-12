import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Lock, Play, BookOpen, Video, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import CourseCard from "@/components/course-card";

interface Phase {
  id: string;
  title: string;
  description: string | null;
  order: number;
  releaseDate: string;
  isLocked: boolean;
  content: PhaseContent[];
}

interface PhaseContent {
  id: string;
  contentType: string;
  contentId: string;
  order: number;
  courseData?: any;
}

interface Room {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  coverImageUrl: string | null;
  heroImageUrl: string | null;
  order: number;
  isPublished: boolean;
  price: number | null;
  currency: string;
  metadata: any;
}

interface RoomDetailResponse {
  room: Room;
  phases: Phase[];
  userHasAccess: boolean;
}

export default function Room() {
  const { slug } = useParams();
  const { user, isAuthenticated } = useAuth();

  const { data: roomDetail, isLoading } = useQuery<RoomDetailResponse>({
    queryKey: [`/api/rooms/${slug}`],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Cargando sala...</div>
      </div>
    );
  }

  if (!roomDetail) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Sala no encontrada</h1>
          <Link href="/">
            <Button>Volver al inicio</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { room, phases, userHasAccess } = roomDetail;
  const hasAccess = userHasAccess;

  // Format price
  const formattedPrice = room.price 
    ? `$${(room.price / 100).toFixed(2)} ${room.currency.toUpperCase()}`
    : 'Gratis';

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative w-full h-[70vh] min-h-[500px] bg-gradient-to-b from-black/80 to-background">
        {room.heroImageUrl && (
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-40"
            style={{ backgroundImage: `url(${room.heroImageUrl})` }}
          />
        )}
        
        <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-end pb-16">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
              {room.title}
            </h1>
            
            {room.shortDescription && (
              <p className="text-xl text-gray-200 mb-6">
                {room.shortDescription}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 mb-6">
              <Badge variant="secondary" className="text-lg px-4 py-2">
                {formattedPrice}
              </Badge>
              {phases.length > 0 && (
                <Badge variant="outline" className="text-white border-white">
                  {phases.length} fases
                </Badge>
              )}
            </div>

            <div className="flex gap-4">
              {hasAccess ? (
                <Button size="lg" className="text-lg px-8">
                  <Play className="mr-2 h-5 w-5" />
                  Continuar aprendiendo
                </Button>
              ) : (
                <Button size="lg" className="text-lg px-8">
                  Inscribirse ahora
                </Button>
              )}
              
              <Button size="lg" variant="outline" className="text-lg px-8">
                Más información
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      {room.description && (
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl">
            <h2 className="text-2xl font-bold mb-4">Acerca de esta sala</h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              {room.description}
            </p>
          </div>
        </div>
      )}

      {/* Phases Section */}
      <div className="container mx-auto px-4 pb-16">
        <h2 className="text-3xl font-bold mb-8">Contenido por fases</h2>
        
        <div className="space-y-12">
          {phases.map((phase, index) => {
            // Compute whether this phase is locked for the current user
            // Phase is locked if: user doesn't have room access OR phase release date hasn't passed
            const isLockedForUser = !hasAccess || phase.isLocked;
            
            return (
            <div key={phase.id} className="space-y-4">
              {/* Phase Header */}
              <div className="flex items-center gap-4">
                <div className={cn(
                  "flex items-center justify-center w-12 h-12 rounded-full text-xl font-bold",
                  isLockedForUser 
                    ? "bg-muted text-muted-foreground" 
                    : "bg-primary text-primary-foreground"
                )}>
                  {index + 1}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-2xl font-bold">{phase.title}</h3>
                    
                    {/* Show "Bloqueado" if user doesn't have room access */}
                    {!hasAccess && (
                      <Badge variant="secondary" className="gap-1">
                        <Lock className="h-3 w-3" />
                        Requiere acceso
                      </Badge>
                    )}
                    
                    {/* Show release date for locked phases (due to future release) */}
                    {hasAccess && phase.isLocked && (
                      <Badge variant="outline" className="gap-1">
                        <Calendar className="h-3 w-3" />
                        Se desbloquea {new Date(phase.releaseDate).toLocaleDateString()}
                      </Badge>
                    )}
                  </div>
                  
                  {phase.description && (
                    <p className="text-muted-foreground mt-1">{phase.description}</p>
                  )}
                </div>
              </div>

              {/* Phase Content - Horizontal Scroll */}
              <div className="relative">
                <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
                  {phase.content.map((content) => (
                    <div key={content.id} className="flex-shrink-0 w-80 snap-start">
                      {content.contentType === 'course' && content.courseData && (
                        <div className={cn(isLockedForUser && "opacity-50 pointer-events-none")}>
                          <CourseCard
                            course={content.courseData}
                            isAuthenticated={isAuthenticated}
                          />
                        </div>
                      )}
                      
                      {content.contentType === 'workshop' && content.courseData && (
                        <Card className={cn(
                          "h-full cursor-pointer transition-all hover:scale-105",
                          isLockedForUser && "opacity-50 pointer-events-none"
                        )}>
                          <Link href={isLockedForUser ? "#" : `/taller/${content.contentId}`}>
                            <CardContent className="p-6">
                              <div className="flex items-start gap-3 mb-4">
                                <div className="p-3 rounded-lg bg-purple-500/10">
                                  <Video className="h-6 w-6 text-purple-500" />
                                </div>
                                {isLockedForUser && (
                                  <Lock className="h-5 w-5 text-muted-foreground ml-auto" />
                                )}
                              </div>
                              
                              <h4 className="font-bold text-lg mb-2 line-clamp-2">
                                {content.courseData.title}
                              </h4>
                              
                              {content.courseData.description && (
                                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                                  {content.courseData.description}
                                </p>
                              )}
                              
                              <Badge variant="secondary">Workshop</Badge>
                            </CardContent>
                          </Link>
                        </Card>
                      )}
                      
                      {content.contentType === 'guide' && content.courseData && (
                        <Card className={cn(
                          "h-full cursor-pointer transition-all hover:scale-105",
                          isLockedForUser && "opacity-50 pointer-events-none"
                        )}>
                          <Link href={isLockedForUser ? "#" : `/guia/${content.contentId}`}>
                            <CardContent className="p-6">
                              <div className="flex items-start gap-3 mb-4">
                                <div className="p-3 rounded-lg bg-blue-500/10">
                                  <BookOpen className="h-6 w-6 text-blue-500" />
                                </div>
                                {isLockedForUser && (
                                  <Lock className="h-5 w-5 text-muted-foreground ml-auto" />
                                )}
                              </div>
                              
                              <h4 className="font-bold text-lg mb-2 line-clamp-2">
                                {content.courseData.title}
                              </h4>
                              
                              {content.courseData.description && (
                                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                                  {content.courseData.description}
                                </p>
                              )}
                              
                              <Badge variant="secondary">Guía</Badge>
                            </CardContent>
                          </Link>
                        </Card>
                      )}
                    </div>
                  ))}
                  
                  {phase.content.length === 0 && (
                    <div className="w-full p-8 text-center text-muted-foreground">
                      <p>No hay contenido disponible en esta fase todavía</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            );
          })}
        </div>
      </div>

      {/* Features Section */}
      {room.metadata?.features && room.metadata.features.length > 0 && (
        <div className="bg-muted/50 py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-8">Lo que aprenderás</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {room.metadata.features.map((feature: string, index: number) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Play className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-lg">{feature}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
