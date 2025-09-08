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
import { Menu } from "lucide-react";

export default function Courses() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useSimpleAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // No authentication redirect - allow public access with locked content

  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ["/api/courses"],
    enabled: isAuthenticated, // Only fetch real data when authenticated
  });

  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
    enabled: isAuthenticated, // Only fetch real data when authenticated
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

  // Mock data for non-authenticated users
  const mockCourses = [
    {
      id: "preview-1",
      title: "Introducción a NoCode para Principiantes", 
      description: "Aprende los fundamentos de NoCode y cómo empezar tu primer proyecto",
      difficulty: "beginner",
      duration: "2h",
      type: "course",
      categoryId: "cat-1"
    },
    {
      id: "preview-2",
      title: "Automatización con Zapier y Make",
      description: "Domina las herramientas de automatización más populares", 
      difficulty: "intermediate",
      duration: "3h",
      type: "course",
      categoryId: "cat-2"
    },
    {
      id: "preview-3",
      title: "Creación de Apps sin Código",
      description: "Construye aplicaciones completas usando plataformas NoCode",
      difficulty: "advanced",
      duration: "4h", 
      type: "course",
      categoryId: "cat-3"
    },
    {
      id: "preview-4",
      title: "Bases de Datos NoCode con Airtable",
      description: "Gestiona datos de forma profesional sin escribir código",
      difficulty: "intermediate",
      duration: "2.5h",
      type: "course", 
      categoryId: "cat-1"
    }
  ];

  const mockCategories = [
    { id: "cat-1", name: "General" },
    { id: "cat-2", name: "Automatización" },
    { id: "cat-3", name: "Desarrollo" }
  ];

  const coursesToShow = isAuthenticated ? courses : mockCourses;
  const categoriesToShow = isAuthenticated ? categories : mockCategories;

  const filteredCourses = (coursesToShow as any)?.filter((course: any) => {
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
          {/* Mobile Header with Hamburger */}
          <div className="lg:hidden px-4 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">Cursos</h1>
            <Button variant="ghost" size="sm" className="p-2">
              <Menu className="h-6 w-6 text-muted-foreground" />
            </Button>
          </div>

          {/* Desktop Header */}
          <div className="hidden lg:flex px-16 py-6 items-center justify-between">
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

          {/* Course Grid */}
          <div className="px-4 lg:px-16 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCourses.map((course: any) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  category={(categories as any)?.find((cat: any) => cat.id === course.category_id)}
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
