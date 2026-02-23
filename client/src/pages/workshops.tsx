import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/sidebar";
import MobileHeader from "@/components/layout/mobile-header";
import CourseCard from "@/components/course-card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, X } from "lucide-react";

export default function Workshops() {
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Acceso público: se muestran talleres con contenido bloqueado si no está logueado (igual que /courses)
  const { data: workshops = [], isLoading: workshopsLoading } = useQuery<any[]>({
    queryKey: ['/api/workshops'],
    enabled: true,
  });

  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ['/api/categories'],
    enabled: true,
  });

  if (isLoading || workshopsLoading) {
    return (
      <div className="min-h-screen bg-background flex">
        <div className="w-64 bg-card border-r border-border"></div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  // Filter workshops by selected category
  const filteredWorkshops = selectedCategory === "all" 
    ? workshops 
    : workshops.filter((workshop: any) => workshop.categoryId === selectedCategory);

  const selectedCategoryData = categories.find((cat: any) => cat.id === selectedCategory);
  const workshopCount = filteredWorkshops.length;

  return (
    <div className="min-h-screen bg-background text-foreground">
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
          <header className="bg-card border-b border-border p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">Talleres a demanda</h1>
                <p className="text-gray-400 mt-1">
                  Accede a nuestra biblioteca de talleres grabados que puedes ver en cualquier momento, a tu propio ritmo.
                </p>
              </div>
              <div className="flex items-center space-x-4">
                {/* Category Filter */}
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[200px] bg-background border-border text-foreground">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Todas las categorías" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="all" className="text-foreground hover:bg-muted">
                      Todas las categorías
                    </SelectItem>
                    {categories.map((category: any) => (
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
                
                {/* Clear Filters Button */}
                {selectedCategory !== "all" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedCategory("all")}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    Borrar filtros
                    <X className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </header>

          <div className="p-6">
            {/* Category Header with Count */}
            {selectedCategory !== "all" && selectedCategoryData && (
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium"
                    style={{ backgroundColor: selectedCategoryData.color + '20', color: selectedCategoryData.color }}
                  >
                    <span className="text-lg">{selectedCategoryData.icon}</span>
                  </div>
                  <h2 className="text-xl font-semibold">{selectedCategoryData.name}</h2>
                  <span className="px-2 py-1 text-xs bg-gray-700 rounded-full text-gray-300">
                    {workshopCount} {workshopCount === 1 ? 'taller' : 'talleres'}
                  </span>
                </div>
                <p className="text-gray-400 text-sm">{selectedCategoryData.description}</p>
              </div>
            )}

            {/* Workshops Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredWorkshops.map((workshop: any) => {
                const category = categories.find((cat: any) => cat.id === workshop.categoryId);
                return (
                  <CourseCard
                    key={workshop.id}
                    course={workshop}
                    category={category}
                    isAuthenticated={isAuthenticated}
                  />
                );
              })}
            </div>

            {/* Empty State */}
            {filteredWorkshops.length === 0 && (
              <div className="text-center py-16">
                <div className="text-gray-400 mb-4">
                  <Filter className="w-12 h-12 mx-auto mb-4 opacity-50" />
                </div>
                <h3 className="text-lg font-medium text-gray-300 mb-2">
                  No se encontraron talleres
                </h3>
                <p className="text-gray-500 mb-6">
                  {selectedCategory === "all" 
                    ? "Aún no hay talleres disponibles."
                    : `No hay talleres disponibles en la categoría "${selectedCategoryData?.name}".`
                  }
                </p>
                {selectedCategory !== "all" && (
                  <Button
                    variant="outline"
                    onClick={() => setSelectedCategory("all")}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    Ver todos los talleres
                  </Button>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}