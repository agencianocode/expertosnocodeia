import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSimpleAuth } from "@/hooks/use-simple-auth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import MobileHeader from "@/components/layout/mobile-header";
import CourseCard from "@/components/course-card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Menu, CheckCircle } from "lucide-react";
import { Link } from "wouter";

export default function Courses() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useSimpleAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // No authentication redirect - allow public access with locked content

  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ["/api/courses"],
    enabled: true, // Allow fetching for all users to show real content
  });

  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
    enabled: true, // Allow fetching for all users to show real content
  });

  const { data: roomsData } = useQuery({
    queryKey: ["/api/rooms"],
  });

  if (isLoading || coursesLoading) {
    return (
      <div className="min-h-screen bg-background flex">
        <div className="w-[250px] bg-card border-r border-border"></div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  // Use real data for all users - authenticated users get full access, non-authenticated see locked content
  const filteredCourses = (courses as any)?.filter((course: any) => {
    // First filter out workshops - only show actual courses
    if (course.type === 'workshop' || course.id.startsWith('workshop-')) {
      return false;
    }
    
    // Then filter by category
    if (selectedCategory === "all") return true;
    return course.categoryId === selectedCategory;
  }) || [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Mobile Header */}
      <MobileHeader />
      <div className="flex">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main Content */}
        <main className="flex-1 overflow-auto pb-20 lg:pb-0 md:ml-16 lg:ml-[250px]">
          {/* Mobile Header with Filter */}
          <div className="lg:hidden px-4 py-4 space-y-4">
            <h1 className="text-2xl font-bold text-foreground">Cursos</h1>
            <div className="flex items-center gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="flex-1 bg-background border-border text-foreground">
                  <SelectValue placeholder="Todas las categorías" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {(categories as any)?.map((category: any) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                variant="outline"
                size="sm"
                onClick={() => setSelectedCategory("all")}
              >
                Limpiar
              </Button>
            </div>
          </div>

          {/* Desktop Header */}
          <div className="hidden lg:flex px-16 py-6 items-center justify-between pt-[35px] pb-[35px] pl-[70px] pr-[70px]">
            <h1 className="text-2xl font-bold text-foreground">Cursos</h1>
            <div className="flex items-center space-x-4">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48 bg-background border-border text-foreground">
                  <SelectValue placeholder="Todas las categorías" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {(categories as any)?.map((category: any) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                className="bg-secondary hover:bg-secondary/80 text-secondary-foreground border-0"
                onClick={() => setSelectedCategory("all")}
              >
                Borrar filtros
              </Button>
            </div>
          </div>

          {/* Rooms Section */}
          {roomsData && (roomsData as any).length > 0 && (
            <div className="px-4 lg:px-16 pb-12">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-foreground mb-2">Salas de Aprendizaje</h2>
                <p className="text-muted-foreground">Rutas de aprendizaje completas con contenido que se desbloquea semanalmente</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(roomsData as any).map((room: any) => (
                  <Link key={room.id} href={`/sala/${room.slug}`}>
                    <div className="group relative bg-card rounded-xl border border-border overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer h-full" data-testid={`room-card-${room.slug}`}>
                      {/* Background gradient */}
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-background opacity-50 group-hover:opacity-70 transition-opacity" />
                      
                      {room.coverImageUrl && (
                        <div 
                          className="absolute inset-0 bg-cover bg-center opacity-20 group-hover:opacity-30 transition-opacity"
                          style={{ backgroundImage: `url(${room.coverImageUrl})` }}
                        />
                      )}
                      
                      {/* Content */}
                      <div className="relative p-6 h-full flex flex-col">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                            {room.title}
                          </h3>
                          
                          <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                            {room.shortDescription || room.description}
                          </p>
                          
                          {room.metadata?.features && room.metadata.features.length > 0 && (
                            <div className="space-y-2 mb-4">
                              {room.metadata.features.slice(0, 2).map((feature: string, idx: number) => (
                                <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                                  <span className="line-clamp-1">{feature}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-border/50">
                          <div className="text-sm font-medium">
                            {room.price ? (
                              <span className="text-primary">
                                ${(room.price / 100).toFixed(0)} USD
                              </span>
                            ) : (
                              <span className="text-muted-foreground">Gratis</span>
                            )}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="group-hover:bg-primary group-hover:text-primary-foreground"
                            data-testid={`button-view-room-${room.slug}`}
                          >
                            Ver sala →
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Course Grid */}
          <div className="px-4 lg:px-16 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCourses.map((course: any) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  category={(categories as any)?.find((cat: any) => cat.id === course.categoryId)}
                  isAuthenticated={isAuthenticated}
                />
              ))}
            </div>

            {filteredCourses.length === 0 && (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-xl font-semibold mb-2">No courses found</h3>
                <p className="text-gray-400 mb-6">
                  {selectedCategory === "all" 
                    ? "Check back soon for new courses!" 
                    : "Try selecting a different category or browse all courses."}
                </p>
                <Button 
                  onClick={() => setSelectedCategory("all")}
                  className="bg-purple-accent hover:bg-purple-accent/90"
                >
                  Browse All Courses
                </Button>
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
