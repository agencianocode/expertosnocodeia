import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import MobileHeader from "@/components/layout/mobile-header";
import CourseCard from "@/components/course-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bookmark, BookmarkCheck, LayoutGrid, List, Menu, Search } from "lucide-react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

export default function Guides() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // No authentication redirect - allow public access with locked content

  // Mark guides as visited for onboarding progress tracking
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      localStorage.setItem('guides-visited', 'true');
    }
  }, [isAuthenticated, isLoading]);

  const { data: guides, isLoading: guidesLoading } = useQuery({
    queryKey: ["/api/guides"],
    enabled: true, // Allow fetching for all users to show real content
  });

  const queryClient = useQueryClient();

  // Get saved courses/guides
  const { data: savedCourses } = useQuery({
    queryKey: ['/api/users/saved-courses'],
    retry: false,
    enabled: isAuthenticated,
  });

  // Mutation to save/unsave guide
  const saveGuideMutation = useMutation({
    mutationFn: async ({ guideId, isSaved }: { guideId: string; isSaved: boolean }) => {
      const method = isSaved ? 'DELETE' : 'POST';
      const url = isSaved 
        ? `/api/users/saved-courses/${guideId}`
        : '/api/users/saved-courses';
      
      if (method === 'POST') {
        return await apiRequest('POST', url, { 
          courseId: guideId,
        });
      } else {
        return await apiRequest('DELETE', url);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/saved-courses'] });
      toast({
        title: variables.isSaved ? "Guía removida" : "Guía guardada",
        description: variables.isSaved 
          ? "La guía fue removida de tus favoritos" 
          : "La guía fue guardada en tus favoritos",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo guardar la guía",
        variant: "destructive",
      });
    },
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

  // Use real data for all users - authenticated users get full access, non-authenticated see locked content
  const guidesList = (guides as any) || [];

  const filteredGuides = guidesList.filter((guide: any) => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const matchesSearch = !normalizedSearch
      ? true
      : `${guide.title || ""} ${guide.description || ""}`
          .toLowerCase()
          .includes(normalizedSearch);

    const matchesDifficulty = difficultyFilter === "all"
      ? true
      : guide.difficulty === difficultyFilter;

    return matchesSearch && matchesDifficulty;
  });

  const sortedGuides = [...filteredGuides].sort((a: any, b: any) => {
    if (sortBy === "az") {
      return (a.title || "").localeCompare(b.title || "", "es", { sensitivity: "base" });
    }
    const dateA = new Date(a.createdAt || a.updatedAt || a.publishedAt || 0).getTime();
    const dateB = new Date(b.createdAt || b.updatedAt || b.publishedAt || 0).getTime();
    return sortBy === "oldest" ? dateA - dateB : dateB - dateA;
  });

  const getDifficultyLabel = (difficulty?: string) => {
    if (difficulty === "beginner") return "Principiante";
    if (difficulty === "intermediate") return "Intermedio";
    if (difficulty === "advanced") return "Avanzado";
    return "Nivel";
  };

  const getInstructorInfo = (guide: any) => {
    const metadata = guide?.metadata
      ? typeof guide.metadata === "string"
        ? JSON.parse(guide.metadata)
        : guide.metadata
      : {};
    const instructor = metadata?.instructor || {};
    const fallbackName = user?.firstName || user?.lastName
      ? `${user?.firstName || ""} ${user?.lastName || ""}`.trim()
      : "";
    const defaultAvatar = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96'><rect width='96' height='96' fill='%2320132d'/><circle cx='48' cy='36' r='16' fill='%23c0467f'/><rect x='20' y='58' width='56' height='26' rx='13' fill='%23c0467f'/></svg>";
    return {
      name: instructor?.name || guide?.instructorName || fallbackName || "Instructor",
      avatar: instructor?.avatar || guide?.instructorAvatar || (user as any)?.profileImageUrl || defaultAvatar,
    };
  };

  const renderListCard = (guide: any) => {
    const instructor = getInstructorInfo(guide);

    return (
      <button
        key={guide.id}
        type="button"
        onClick={() => setLocation(`/guia/${guide.id}`)}
        className="w-full text-left bg-card border border-border rounded-xl p-5 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-3">
            <h3 className="text-[18px] font-bold text-foreground">{guide.title}</h3>
            <div className="inline-flex items-center rounded-full bg-emerald-500/15 text-emerald-300 px-3 py-1 text-xs font-medium uppercase tracking-wide">
              {getDifficultyLabel(guide.difficulty)}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Avatar className="h-6 w-6">
                <AvatarImage src={instructor.avatar} alt={instructor.name} />
                <AvatarFallback>{instructor.name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="text-sm">Impartido por {instructor.name}</span>
            </div>
          </div>
          <div className="h-8 w-8 flex items-center justify-center rounded-full border border-border text-muted-foreground">
            ☆
          </div>
        </div>
      </button>
    );
  };

  const renderGridCard = (guide: any) => {
    const instructor = getInstructorInfo(guide);
    const isSaved = Array.isArray(savedCourses) && savedCourses.some((savedCourse: any) => savedCourse.courseId === guide.id);

    return (
      <div
        key={guide.id}
        className="w-full bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg hover:shadow-primary/10 transition-all duration-300"
      >
        <button
          type="button"
          onClick={() => setLocation(`/guia/${guide.id}`)}
          className="w-full text-left"
        >
          <div className="relative aspect-[16/10] bg-muted/40 rounded-t-2xl overflow-hidden">
            {guide.coverImageUrl ? (
              <div className="w-full h-full p-4 flex items-center justify-center">
                <img
                  src={guide.coverImageUrl}
                  alt={guide.title}
                  className="w-full h-full object-contain rounded-xl"
                />
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                Sin imagen
              </div>
            )}
          </div>

          <div className="p-3 space-y-2">
            <h3 className="text-[18px] font-bold text-foreground line-clamp-2 leading-tight">
              {guide.title}
            </h3>

            <div className="inline-flex items-center rounded-full bg-emerald-500/15 text-emerald-300 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide">
              {getDifficultyLabel(guide.difficulty)}
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={instructor.avatar} alt={instructor.name} />
                  <AvatarFallback className="text-[10px]">{instructor.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="line-clamp-1 text-sm">Impartido por {instructor.name}</span>
              </div>

              {isAuthenticated && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 hover:bg-muted/50 flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    saveGuideMutation.mutate({ guideId: guide.id, isSaved });
                  }}
                  disabled={saveGuideMutation.isPending}
                >
                  {isSaved ? (
                    <BookmarkCheck className="h-3 w-3 text-foreground fill-current" />
                  ) : (
                    <Bookmark className="h-3 w-3 text-foreground" />
                  )}
                </Button>
              )}
            </div>
          </div>
        </button>
      </div>
    );
  };

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
          <div className="hidden lg:block px-8 py-6 max-w-[1200px] mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold mb-2">Guías</h1>
                <p className="text-muted-foreground">Descubre guías paso a paso para dominar la IA</p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-3 flex-1">
                <div className="relative w-full max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Buscar guías..."
                    className="pl-9 bg-card border-border text-foreground"
                  />
                </div>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px] bg-card border-border text-foreground">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="newest" className="text-foreground hover:bg-muted">
                      Más nuevo
                    </SelectItem>
                    <SelectItem value="oldest" className="text-foreground hover:bg-muted">
                      Más antiguo
                    </SelectItem>
                    <SelectItem value="az" className="text-foreground hover:bg-muted">
                      A-Z
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                  <SelectTrigger className="w-[200px] bg-card border-border text-foreground">
                    <SelectValue placeholder="Todos los niveles" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="all" className="text-foreground hover:bg-muted">
                      Todos los niveles
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

                <Button
                  variant="outline"
                  className="border-border text-foreground hover:bg-muted"
                  onClick={() => {
                    setSearchTerm("");
                    setSortBy("newest");
                    setDifficultyFilter("all");
                    setViewMode("grid");
                  }}
                >
                  Borrar filtros
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  className="border-border"
                  onClick={() => setViewMode("grid")}
                >
                  <LayoutGrid className="h-4 w-4 mr-2" />
                  Cuadros
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  className="border-border"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4 mr-2" />
                  Lista
                </Button>
              </div>
            </div>

            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedGuides.map((guide: any) => renderGridCard(guide))}
              </div>
            ) : (
              <div className="space-y-4">
                {sortedGuides.map((guide: any) => renderListCard(guide))}
              </div>
            )}

            {sortedGuides.length === 0 && (
              <div className="text-center py-16">
                <p className="text-muted-foreground text-lg">No se encontraron guías que coincidan con los filtros seleccionados.</p>
              </div>
            )}
          </div>

          {/* Mobile Content */}
          <div className="lg:hidden px-4 pb-6">
            <div className="mb-6">
              <p className="text-gray-400 mb-4">Descubre guías paso a paso para dominar la IA</p>

              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Buscar guías..."
                    className="pl-9 bg-card border-border text-foreground"
                  />
                </div>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full bg-card border-border text-foreground">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="newest" className="text-foreground hover:bg-muted">
                      Más nuevo
                    </SelectItem>
                    <SelectItem value="oldest" className="text-foreground hover:bg-muted">
                      Más antiguo
                    </SelectItem>
                    <SelectItem value="az" className="text-foreground hover:bg-muted">
                      A-Z
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                  <SelectTrigger className="w-full bg-card border-border text-foreground">
                    <SelectValue placeholder="Todos los niveles" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="all" className="text-foreground hover:bg-muted">
                      Todos los niveles
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

                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === "grid" ? "default" : "outline"}
                    className="flex-1 border-border"
                    onClick={() => setViewMode("grid")}
                  >
                    <LayoutGrid className="h-4 w-4 mr-2" />
                    Cuadros
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "outline"}
                    className="flex-1 border-border"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="h-4 w-4 mr-2" />
                    Lista
                  </Button>
                </div>

                <Button
                  variant="outline"
                  className="border-border text-foreground hover:bg-muted"
                  onClick={() => {
                    setSearchTerm("");
                    setSortBy("newest");
                    setDifficultyFilter("all");
                    setViewMode("grid");
                  }}
                >
                  Borrar filtros
                </Button>
              </div>
            </div>

            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 gap-4">
                {sortedGuides.map((guide: any) => renderGridCard(guide))}
              </div>
            ) : (
              <div className="space-y-4">
                {sortedGuides.map((guide: any) => renderListCard(guide))}
              </div>
            )}

            {sortedGuides.length === 0 && (
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