import { useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import MobileHeader from "@/components/layout/mobile-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Users, Award, BookmarkPlus, BookmarkCheck, Calendar, Play, Eye, Star } from "lucide-react";
import { cn } from "@/lib/utils";

// Helper function to convert YouTube URLs to embed format
const getYouTubeEmbedUrl = (url: string) => {
  if (!url) return '';
  
  // Handle different YouTube URL formats
  let videoId = '';
  
  if (url.includes('youtube.com/watch?v=')) {
    videoId = url.split('v=')[1]?.split('&')[0];
  } else if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1]?.split('?')[0];
  } else if (url.includes('youtube.com/embed/')) {
    return url; // Already in embed format
  }
  
  return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
};

export default function Workshop() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { id } = useParams();
  const queryClient = useQueryClient();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
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
  }, [isAuthenticated, authLoading, toast]);

  const { data: workshop, isLoading: workshopLoading } = useQuery<any>({
    queryKey: [`/api/courses/${id}`],
    enabled: isAuthenticated && !!id,
  });

  // Invalidate dashboard cache when workshop is loaded
  useEffect(() => {
    if (workshop) {
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
    }
  }, [workshop, queryClient]);

  const { data: savedCourses = [] } = useQuery<any[]>({
    queryKey: ['/api/users/saved-courses'],
    enabled: isAuthenticated,
  });

  const { data: resources = [] } = useQuery<any[]>({
    queryKey: [`/api/resources/${id}`],
    enabled: isAuthenticated && !!id,
  });
  
  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ['/api/categories'],
    enabled: isAuthenticated,
  });

  if (authLoading || workshopLoading) {
    return (
      <div className="min-h-screen bg-dark-bg flex">
        <div className="w-64 bg-dark-card border-r border-dark-border"></div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white">Loading...</div>
        </div>
      </div>
    );
  }

  if (!workshop) {
    return (
      <div className="min-h-screen bg-dark-bg text-white">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Taller no encontrado</h2>
            <Link href="/talleres">
              <Button variant="outline">Volver a talleres</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isBookmarked = savedCourses.some((saved: any) => saved.courseId === workshop.id);

  // Workshop details with real data from API
  const workshopDetails = {
    videoUrl: workshop?.videoUrl || "https://www.youtube.com/embed/dQw4w9WgXcQ",
    duration: workshop?.duration || "2h 30min", 
    participants: workshop?.participants || "1,240",
    rating: workshop?.rating || 4.8,
    recordedDate: workshop?.recordedDate || "15 de Agosto, 2024",
    description: workshop?.description,
    instructor: {
      name: workshop?.instructorName || workshop?.instructor?.name || "Fabián Segura",
      bio: workshop?.instructorBio || workshop?.instructor?.title || "Experto en Inteligencia Artificial con más de 10 años de experiencia en el desarrollo de soluciones empresariales.",
      avatar: workshop?.instructorAvatar || workshop?.instructor?.avatar || ""
    },
    topics: [
      "Configuración inicial del entorno",
      "Implementación de agentes inteligentes",
      "Casos de uso prácticos",
      "Optimización y mejores prácticas",
      "Sesión de preguntas y respuestas"
    ]
  };

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
          {/* Header */}
          <div className="px-8 pt-6 pb-0 pl-[45px] pr-[45px] ml-[25px] mr-[25px]" style={{ backgroundColor: '#171717' }}>
            {/* Top navigation and actions */}
            <div className="flex items-center justify-between mb-6">
              <Link href="/talleres">
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Regresar a los talleres
                </Button>
              </Link>
              
              <div className="flex items-center space-x-3">
                <Button variant="ghost" className="text-gray-400 hover:text-white p-2">
                  <Eye className="w-5 h-5" />
                  <span className="ml-2">0</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  {isBookmarked ? (
                    <>
                      <BookmarkCheck className="w-4 h-4 mr-2" />
                      Guardar taller
                    </>
                  ) : (
                    <>
                      <BookmarkPlus className="w-4 h-4 mr-2" />
                      Guardar taller
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Title Section */}
            <div className="mb-6">
              <h1 className="lg:text-4xl font-bold text-white mb-0 text-[34px]">
                {workshop.title}
              </h1>
            </div>
          </div>

          <div className="px-8 py-0 pl-[45px] pr-[45px] ml-[25px] mr-[25px]">
            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Video and Main Content - Left Side */}
              <div className="lg:col-span-2 space-y-4">
                {/* Video Player Card */}
                <div className="rounded-lg overflow-hidden" style={{ backgroundColor: '#1e1e1e' }}>
                  <div className="bg-black aspect-video relative group">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Button 
                        size="icon" 
                        className="w-16 h-16 bg-white/90 hover:bg-white text-black rounded-full shadow-lg"
                      >
                        <Play className="w-6 h-6 ml-1" fill="currentColor" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Video Information Card */}
                <div className="rounded-lg p-6" style={{ backgroundColor: '#1e1e1e' }}>
                  <h3 className="text-lg font-semibold mb-4 text-white">Marcas de tiempo:</h3>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <span className="text-sm font-mono text-gray-400 bg-gray-800 px-2 py-1 rounded">[00:00]</span>
                      <span className="text-gray-300">Dar la bienvenida a los asistentes y comenzar las presentaciones</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <span className="text-sm font-mono text-gray-400 bg-gray-800 px-2 py-1 rounded">[02:15]</span>
                      <span className="text-gray-300">Describir la agenda del taller y las conclusiones clave</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <span className="text-sm font-mono text-gray-400 bg-gray-800 px-2 py-1 rounded">[05:40]</span>
                      <span className="text-gray-300">Explicar el rol de los agentes de IA en la evolución del servicio al cliente</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <span className="text-sm font-mono text-gray-400 bg-gray-800 px-2 py-1 rounded">[10:05]</span>
                      <span className="text-gray-300">Demostrar cómo Fin maneja un problema de datos móviles</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Sidebar - Right Side - Single Card */}
              <div>
                <div className="rounded-lg p-6" style={{ backgroundColor: '#1e1e1e' }}>
                  {/* Instructores */}
                  <div className="mb-4">
                    <h3 className="font-semibold mb-2 text-gray-300 text-[14px]">Instructores</h3>
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-600">
                        {workshopDetails.instructor.avatar && workshopDetails.instructor.avatar !== "" ? (
                          <img 
                            src={workshopDetails.instructor.avatar} 
                            alt={workshopDetails.instructor.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                            <span className="text-white font-bold text-lg">
                              {workshopDetails.instructor.name.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-white text-[14px]">{workshopDetails.instructor.name}</h4>
                        <p className="text-sm text-gray-400">Instructor</p>
                      </div>
                    </div>
                  </div>

                  {/* Separator Line */}
                  <div className="border-b border-gray-700/30 mb-4"></div>

                  {/* Publicado */}
                  <div className="mb-4">
                    <h3 className="font-semibold mb-2 text-gray-300 text-[14px]">Publicado</h3>
                    <p className="text-gray-400 text-[14px]">
                      {workshopDetails.recordedDate || "13 de agosto de 2025"}
                    </p>
                  </div>

                  {/* Separator Line */}
                  <div className="border-b border-gray-700/30 mb-4"></div>

                  {/* Recursos */}
                  <div className="mb-4">
                    <h3 className="font-semibold mb-2 text-gray-300 text-[14px]">Recursos</h3>
                    <div className="space-y-3">
                      {resources.length > 0 ? (
                        resources.map((resource: any) => (
                          <div key={resource.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gray-600 rounded flex items-center justify-center">
                                <svg className="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">
                                  {resource.title}
                                </p>
                                <p className="text-xs text-gray-400 truncate">
                                  {resource.description}
                                </p>
                                <p className="text-xs text-gray-500">{resource.fileType?.toUpperCase() || 'Archivo'}</p>
                              </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-gray-400 hover:text-white p-2"
                              onClick={() => {
                                if (resource.fileUrl) {
                                  window.open(resource.fileUrl, '_blank');
                                }
                              }}
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </Button>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 italic">No hay recursos disponibles</p>
                      )}
                    </div>
                  </div>

                  {/* Separator Line */}
                  <div className="border-b border-gray-700/30 mb-4"></div>

                  {/* Categorías */}
                  <div>
                    <h3 className="font-semibold mb-2 text-gray-300 text-[14px]">Categorías</h3>
                    <div className="space-y-2">
                      {workshop?.categoryIds && workshop.categoryIds.length > 0 ? (
                        workshop.categoryIds.map((categoryId: string, index: number) => {
                          const category = categories?.find((c: any) => c.id === categoryId);
                          return category ? (
                            <Badge key={categoryId} variant="secondary" className="block w-fit bg-gray-700/50 text-gray-300 border-gray-600">
                              {category.name}
                            </Badge>
                          ) : null;
                        })
                      ) : (
                        <Badge variant="secondary" className="block w-fit bg-gray-700/50 text-gray-300 border-gray-600">
                          General
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}