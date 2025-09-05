import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import MobileHeader from "@/components/layout/mobile-header";
import CourseCard from "@/components/course-card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Menu } from "lucide-react";

export default function Guides() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

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

  const { data: guides, isLoading: guidesLoading } = useQuery({
    queryKey: ["/api/guides"],
    enabled: isAuthenticated,
  });

  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
    enabled: isAuthenticated,
  });

  if (isLoading || guidesLoading) {
    return (
      <div className="min-h-screen bg-background flex">
        <div className="w-[250px] bg-card border-r border-border"></div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  const filteredGuides = (guides as any)?.filter((guide: any) => {
    if (selectedCategory === "all") return true;
    return guide.categoryId === selectedCategory;
  }) || [];

  const categoriesList = (categories as any) || [];

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
            <h1 className="text-2xl font-bold text-foreground">Guías</h1>
            <Button variant="ghost" size="sm" className="p-2">
              <Menu className="h-6 w-6 text-muted-foreground" />
            </Button>
          </div>

          {/* Desktop/Tablet Content */}
          <div className="hidden lg:block px-8 py-6">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold mb-2">Guías</h1>
                <p className="text-muted-foreground">Descubre guías paso a paso para dominar la IA</p>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Category Filter */}
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[200px] bg-card border-border text-foreground">
                    <SelectValue placeholder="Todas las categorías" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="all" className="text-foreground hover:bg-muted">
                      Todas las categorías
                    </SelectItem>
                    {categoriesList.map((category: any) => (
                      <SelectItem 
                        key={category.id} 
                        value={category.id}
                        className="text-foreground hover:bg-muted"
                      >
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Difficulty Filter */}
                <Select defaultValue="all">
                  <SelectTrigger className="w-[200px] bg-card border-border text-foreground">
                    <SelectValue placeholder="Todos los niveles de habilidad" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="all" className="text-foreground hover:bg-muted">
                      Todos los niveles de habilidad
                    </SelectItem>
                    <SelectItem value="beginner" className="text-foreground hover:bg-muted">
                      Principiante
                    </SelectItem>
                    <SelectItem value="intermediate" className="text-foreground hover:bg-muted">
                      Intermedio
                    </SelectItem>
                    <SelectItem value="advanced" className="text-foreground hover:bg-muted">
                      Avanzado
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" className="border-border text-foreground hover:bg-muted">
                  Borrar filtros
                </Button>
              </div>
            </div>

            {/* Guides Grid - 4 columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredGuides.map((guide: any) => (
                <CourseCard key={guide.id} course={guide} />
              ))}
            </div>

            {filteredGuides.length === 0 && (
              <div className="text-center py-16">
                <p className="text-muted-foreground text-lg">No se encontraron guías que coincidan con los filtros seleccionados.</p>
              </div>
            )}
          </div>

          {/* Mobile Content */}
          <div className="lg:hidden px-4 pb-6">
            <div className="mb-6">
              <p className="text-gray-400 mb-4">Descubre guías paso a paso para dominar la IA</p>
              
              {/* Mobile Filters */}
              <div className="space-y-3">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full bg-card border-border text-foreground">
                    <SelectValue placeholder="Todas las categorías" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="all" className="text-foreground hover:bg-muted">
                      Todas las categorías
                    </SelectItem>
                    {categoriesList.map((category: any) => (
                      <SelectItem 
                        key={category.id} 
                        value={category.id}
                        className="text-foreground hover:bg-muted"
                      >
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select defaultValue="all">
                  <SelectTrigger className="w-full bg-card border-border text-foreground">
                    <SelectValue placeholder="Todos los niveles de habilidad" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="all" className="text-foreground hover:bg-muted">
                      Todos los niveles de habilidad
                    </SelectItem>
                    <SelectItem value="beginner" className="text-foreground hover:bg-muted">
                      Principiante
                    </SelectItem>
                    <SelectItem value="intermediate" className="text-foreground hover:bg-muted">
                      Intermedio
                    </SelectItem>
                    <SelectItem value="advanced" className="text-foreground hover:bg-muted">
                      Avanzado
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Mobile Guides Grid - 1 column */}
            <div className="space-y-4">
              {filteredGuides.map((guide: any) => (
                <CourseCard key={guide.id} course={guide} />
              ))}
            </div>

            {filteredGuides.length === 0 && (
              <div className="text-center py-16">
                <p className="text-muted-foreground">No se encontraron guías que coincidan con los filtros seleccionados.</p>
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