import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Lock, Play, BookOpen, Video, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import CourseCard from "@/components/course-card";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import MobileHeader from "@/components/layout/mobile-header";
import { PromoBanner } from "@/components/PromoBanner";

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

interface PromoBannerData {
  id: string;
  roomId: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  backgroundImageUrl: string | null;
  backgroundColor: string;
  ctaText: string | null;
  ctaLink: string | null;
  displayAfterPhaseOrder: number;
  order: number;
  isActive: boolean;
}

interface RoomDetailResponse {
  room: Room;
  phases: Phase[];
  promoBanners: PromoBannerData[];
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

  const { room, phases, promoBanners, userHasAccess } = roomDetail;
  const hasAccess = userHasAccess;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Mobile Header */}
      <MobileHeader />
      
      <div className="flex">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main Content */}
        <main className="flex-1 overflow-auto pb-20 lg:pb-0 md:ml-16 lg:ml-[250px]">
          {/* Hero Banner - Full width image only */}
          {room.heroImageUrl && (
            <div className="relative w-full h-[clamp(300px,60vh,600px)] overflow-hidden">
              <img 
                src={room.heroImageUrl}
                alt={room.title}
                className="w-full h-full object-cover"
              />
              {/* Bottom fade to blend with content */}
              <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
            </div>
          )}

          {/* Phases Section */}
          <div className="container mx-auto px-4 pb-16 -mt-32 relative z-10">
            <div className="space-y-12">
              {phases.map((phase, index) => {
                // Compute whether this phase is locked for the current user
                // Phase is locked if: user doesn't have room access OR phase release date hasn't passed
                const isLockedForUser = !hasAccess || phase.isLocked;
                
                // Find promo banners that should display after this phase
                const bannersAfterPhase = (promoBanners || []).filter(
                  banner => banner.displayAfterPhaseOrder === phase.order
                );
                
                return (
                  <div key={`phase-${phase.id}`}>
                    <div className="space-y-4">
                      {/* Phase Header */}
                      <div className="flex items-center gap-4">
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

                      {/* Phase Content - Netflix Style Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {phase.content.map((content) => {
                          const getHref = () => {
                            if (isLockedForUser) return "#";
                            if (content.contentType === 'course') return `/sala/${slug}/curso/${content.contentId}`;
                            if (content.contentType === 'workshop') return `/taller/${content.contentId}`;
                            if (content.contentType === 'guide') return `/guia/${content.contentId}`;
                            return "#";
                          };

                          const getBadgeText = () => {
                            if (content.contentType === 'workshop') return 'Workshop';
                            if (content.contentType === 'guide') return 'Guía';
                            return 'Curso';
                          };

                          return (
                            <div key={content.id} className="group">
                              <Link href={getHref()}>
                                <div className={cn(
                                  "relative transition-all duration-300",
                                  isLockedForUser ? "cursor-not-allowed" : "cursor-pointer hover:scale-105 hover:z-10 hover:shadow-2xl"
                                )}>
                                  {/* Poster Image */}
                                  <div className={cn(
                                    "relative aspect-[2/3] rounded-lg overflow-hidden group-hover:rounded-b-none",
                                    isLockedForUser && "opacity-50"
                                  )}>
                                    {content.courseData?.coverImageUrl ? (
                                      <img 
                                        src={content.courseData.coverImageUrl} 
                                        alt={content.courseData.title}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                        {content.contentType === 'workshop' && (
                                          <Video className="h-16 w-16 text-primary/40" />
                                        )}
                                        {content.contentType === 'guide' && (
                                          <BookOpen className="h-16 w-16 text-primary/40" />
                                        )}
                                        {content.contentType === 'course' && (
                                          <Play className="h-16 w-16 text-primary/40" />
                                        )}
                                      </div>
                                    )}

                                    {/* Lock Overlay */}
                                    {isLockedForUser && (
                                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                        <Lock className="h-12 w-12 text-white" />
                                      </div>
                                    )}
                                  </div>

                                  {/* Title and Badge - Show below on hover */}
                                  <div className="max-h-0 group-hover:max-h-40 overflow-hidden transition-all duration-300 bg-black rounded-b-lg">
                                    <div className="p-3 space-y-1">
                                      <Badge className="text-xs">{getBadgeText()}</Badge>
                                      <h4 className="text-white font-semibold text-sm line-clamp-2 leading-tight">
                                        {content.courseData?.title || 'Sin título'}
                                      </h4>
                                    </div>
                                  </div>
                                </div>
                              </Link>
                            </div>
                          );
                        })}
                        
                        {phase.content.length === 0 && (
                          <div className="col-span-full p-12 text-center text-muted-foreground">
                            <p>No hay contenido disponible en esta fase todavía</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Promo Banners After Phase */}
                    {bannersAfterPhase.map(banner => (
                      <div key={banner.id} className="my-12">
                        <PromoBanner
                          title={banner.title}
                          subtitle={banner.subtitle || undefined}
                          description={banner.description || undefined}
                          ctaText={banner.ctaText || undefined}
                          ctaLink={banner.ctaLink || undefined}
                          backgroundImage={banner.backgroundImageUrl || undefined}
                          backgroundColor={banner.backgroundColor}
                        />
                      </div>
                    ))}
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
        </main>
      </div>
      
      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
}
