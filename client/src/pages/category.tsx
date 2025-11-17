import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import MobileHeader from "@/components/layout/mobile-header";
import CourseCard from "@/components/course-card";
import { useRoute } from "wouter";
import { Megaphone, Code2, Users, PenTool, GraduationCap, Building2, TrendingUp, DollarSign, Bus, BarChart3, FileText, MoreHorizontal } from "lucide-react";

export default function CategoryPage() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [match, params] = useRoute("/categoria/:categorySlug");
  const categorySlug = params?.categorySlug;
  const [activeFilter, setActiveFilter] = useState<"all" | "courses" | "guides" | "workshops" | "programs">("all");

  const getCategoryFromSlug = (slug: string, categories: any[]) => {
    const slugMap: { [key: string]: string } = {
      "general": "General",
      "codificacion": "Codificación",
      "marketing": "Marketing", 
      "creacion-contenido": "Creación de contenido",
      "educacion": "Educación",
      "operaciones-comerciales": "Operaciones comerciales",
      "ventas": "Ventas",
      "finanzas": "Finanzas",
      "consultoria": "Consultoría",
      "analisis-datos": "Análisis de datos",
      "gestion-proyectos": "Gestión de proyectos",
      "otros": "Otros",
      "no-code": "No Code",
      "vibe-coding": "Vibe Coding",
      "agentes-ia": "Agentes IA",
      "inteligencia-artificial": "Inteligencia Artificial",
      "saas": "SaaS",
      "automatizaciones": "Automatizaciones",
      "programas": "Programas",
    };
    const categoryName = slugMap[slug] || slug;
    return categories?.find((cat: any) => cat.name === categoryName);
  };

  const getCategoryIcon = (categoryName: string) => {
    const iconMap: { [key: string]: any } = {
      "General": Users,
      "Codificación": Code2,
      "Marketing": Megaphone,
      "Creación de contenido": PenTool,
      "Educación": GraduationCap,
      "Operaciones comerciales": Building2,
      "Ventas": TrendingUp,
      "Finanzas": DollarSign,
      "Consultoría": Users,
      "Análisis de datos": BarChart3,
      "Gestión de proyectos": FileText,
      "Otros": MoreHorizontal,
      "Programas": GraduationCap,
    };
    return iconMap[categoryName] || Users;
  };

  const getCategoryColor = (categoryName: string) => {
    const colorMap: { [key: string]: string } = {
      "General": "bg-blue-500",
      "Codificación": "bg-green-500",
      "Marketing": "bg-red-500",
      "Creación de contenido": "bg-purple-500",
      "Educación": "bg-blue-500",
      "Operaciones comerciales": "bg-orange-500",
      "Ventas": "bg-green-500",
      "Finanzas": "bg-cyan-500",
      "Consultoría": "bg-pink-500",
      "Análisis de datos": "bg-indigo-500",
      "Gestión de proyectos": "bg-green-500",
      "Otros": "bg-gray-500",
      "Programas": "bg-orange-500",
    };
    return colorMap[categoryName] || "bg-blue-500";
  };

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

  // Fetch all content (courses and guides) - INCLUDING those in rooms for category filtering
  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ["/api/courses/all"],
    enabled: isAuthenticated,
  });

  const { data: guides, isLoading: guidesLoading } = useQuery({
    queryKey: ["/api/guides/all"], 
    enabled: isAuthenticated,
  });

  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
    enabled: isAuthenticated,
  });

  // Fetch rooms that contain courses from this category
  const currentCategory = getCategoryFromSlug(categorySlug || '', (categories as any) || []);
  
  const { data: programRooms, isLoading: roomsLoading } = useQuery({
    queryKey: ["/api/rooms/by-course-category", currentCategory?.id],
    enabled: isAuthenticated && !!currentCategory?.id,
  });

  if (isLoading || coursesLoading || guidesLoading || roomsLoading) {
    return (
      <div className="min-h-screen bg-dark-bg flex">
        <div className="w-64 bg-dark-card border-r border-dark-border"></div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white">Cargando...</div>
        </div>
      </div>
    );
  }
  
  // Filter content by category and type
  // EXCLUDE courses that belong to rooms (roomContext.length > 0) to avoid confusion
  const allRooms = (programRooms as any) || [];
  const allCourses = (courses as any) || [];
  const allGuides = (guides as any) || [];
  
  const filteredRooms = allRooms; // Rooms that contain courses from this category
  
  const filteredCourses = allCourses.filter((item: any) => 
    item.categoryId === currentCategory?.id && 
    item.type === 'course' &&
    (!item.roomContext || item.roomContext.length === 0) // Only standalone courses
  );
  
  const filteredGuides = allGuides.filter((item: any) => 
    item.categoryId === currentCategory?.id &&
    (!item.roomContext || item.roomContext.length === 0) // Only standalone guides
  );

  // Count total content
  const totalContent = filteredCourses.length + filteredGuides.length + filteredRooms.length;
  
  // Get content to display based on active filter
  const displayedCourses = activeFilter === "all" || activeFilter === "courses" ? filteredCourses : [];
  const displayedGuides = activeFilter === "all" || activeFilter === "guides" ? filteredGuides : [];
  const displayedPrograms = activeFilter === "all" || activeFilter === "programs" ? filteredRooms : [];
  
  // Get category icon and color
  const CategoryIcon = getCategoryIcon(currentCategory?.name || '');
  const categoryColor = getCategoryColor(currentCategory?.name || '');

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
          <div className="px-4 lg:px-16 py-6 space-y-4">
            {/* Title Section */}
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${categoryColor}`}>
                <CategoryIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {currentCategory?.name || "Categoría"}
                </h1>
                <p className="text-sm text-gray-400">
                  {totalContent} recursos disponibles
                </p>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center space-x-1">
              <button 
                onClick={() => setActiveFilter("all")}
                className={`px-4 py-2 text-sm rounded-lg font-medium ${
                  activeFilter === "all" 
                    ? "bg-white text-black" 
                    : "text-gray-400 hover:text-white"
                }`}
                data-testid="filter-all"
              >
                Todos ({totalContent})
              </button>
              <button 
                onClick={() => setActiveFilter("courses")}
                className={`px-4 py-2 text-sm rounded-lg ${
                  activeFilter === "courses" 
                    ? "bg-white text-black font-medium" 
                    : "text-gray-400 hover:text-white"
                }`}
                data-testid="filter-courses"
              >
                Cursos ({filteredCourses.length})
              </button>
              <button 
                onClick={() => setActiveFilter("guides")}
                className={`px-4 py-2 text-sm rounded-lg ${
                  activeFilter === "guides" 
                    ? "bg-white text-black font-medium" 
                    : "text-gray-400 hover:text-white"
                }`}
                data-testid="filter-guides"
              >
                Guías ({filteredGuides.length})
              </button>
              <button 
                onClick={() => setActiveFilter("workshops")}
                className={`px-4 py-2 text-sm rounded-lg ${
                  activeFilter === "workshops" 
                    ? "bg-white text-black font-medium" 
                    : "text-gray-400 hover:text-white"
                }`}
                data-testid="filter-workshops"
              >
                Talleres (0)
              </button>
              <button 
                onClick={() => setActiveFilter("programs")}
                className={`px-4 py-2 text-sm rounded-lg ${
                  activeFilter === "programs" 
                    ? "bg-white text-black font-medium" 
                    : "text-gray-400 hover:text-white"
                }`}
                data-testid="filter-programs"
              >
                Programas ({filteredRooms.length})
              </button>
            </div>
          </div>

          {/* Content Sections */}
          <div className="px-4 lg:px-16 pb-6 space-y-12">
            
            {/* Programas Section */}
            {displayedPrograms.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold mb-6 text-white">Programas</h2>
                <div className="space-y-6">
                  {displayedPrograms.map((room: any) => (
                    <div key={room.id} className="bg-dark-card rounded-xl border border-dark-border overflow-hidden hover:shadow-lg transition-shadow">
                      <CourseCard
                        course={{
                          ...room,
                          title: room.title,
                          description: room.shortDescription || room.description,
                          coverImageUrl: room.coverImageUrl,
                          difficulty: "Intermedio",
                          duration: "8 semanas",
                          type: "program",
                          roomSlug: room.slug,
                        }}
                        category={currentCategory}
                        variant="horizontal"
                        roomSlug={room.slug}
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Cursos Section */}
            {displayedCourses.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold mb-6 text-white">Cursos</h2>
                <div className="space-y-6">
                  {displayedCourses.map((course: any) => (
                    <div key={course.id} className="bg-dark-card rounded-xl border border-dark-border overflow-hidden hover:shadow-lg transition-shadow">
                      <CourseCard
                        course={course}
                        category={currentCategory}
                        variant="horizontal"
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Talleres Section */}
            {displayedGuides.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold mb-6 text-white">Talleres</h2>
                <div className="space-y-6">
                  {displayedGuides.map((guide: any) => (
                    <div key={guide.id} className="bg-dark-card rounded-xl border border-dark-border overflow-hidden hover:shadow-lg transition-shadow">
                      <CourseCard
                        course={guide}
                        category={currentCategory}
                        variant="horizontal"
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Empty State */}
            {displayedCourses.length === 0 && displayedGuides.length === 0 && displayedPrograms.length === 0 && (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-xl font-semibold mb-2">No hay contenido disponible</h3>
                <p className="text-gray-400 mb-6">
                  {activeFilter === "programs" 
                    ? "Aún no hay programas en esta categoría."
                    : "Aún no hay contenido en este filtro."}
                </p>
              </div>
            )}
            
          </div>
        </main>
      </div>
      
      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
}