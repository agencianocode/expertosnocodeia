import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSimpleAuth } from "@/hooks/use-simple-auth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
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

export default function Courses() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useSimpleAuth();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // No authentication redirect - allow public access with locked content

  // Mark courses as visited for onboarding progress tracking
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      localStorage.setItem('courses-visited', 'true');
    }
  }, [isAuthenticated, isLoading]);

  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ["/api/courses"],
    enabled: true, // Allow fetching for all users to show real content
  });

  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
    enabled: true, // Allow fetching for all users to show real content
  });

  const queryClient = useQueryClient();

  // Get saved courses
  const { data: savedCourses } = useQuery({
    queryKey: ['/api/users/saved-courses'],
    retry: false,
    enabled: isAuthenticated,
  });

  // Mutation to save/unsave course
  const saveCourseMutation = useMutation({
    mutationFn: async ({ courseId, isSaved }: { courseId: string; isSaved: boolean }) => {
      const method = isSaved ? 'DELETE' : 'POST';
      const url = isSaved 
        ? `/api/users/saved-courses/${courseId}`
        : '/api/users/saved-courses';
      
      if (method === 'POST') {
        return await apiRequest('POST', url, { 
          courseId: courseId,
        });
      } else {
        return await apiRequest('DELETE', url);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/saved-courses'] });
      toast({
        title: variables.isSaved ? "Curso removido" : "Curso guardado",
        description: variables.isSaved 
          ? "El curso fue removido de tus favoritos" 
          : "El curso fue guardado en tus favoritos",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo guardar el curso",
        variant: "destructive",
      });
    },
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
  const coursesList = (courses as any)?.filter((course: any) => {
    // Filter out workshops - only show actual courses
    if (course.type === 'workshop' || course.id.startsWith('workshop-')) {
      return false;
    }
    return true;
  }) || [];

  const filteredCourses = coursesList.filter((course: any) => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const matchesSearch = !normalizedSearch
      ? true
      : `${course.title || ""} ${course.description || ""}`
          .toLowerCase()
          .includes(normalizedSearch);

    const matchesDifficulty = difficultyFilter === "all"
      ? true
      : course.difficulty === difficultyFilter;

    const matchesCategory = selectedCategory === "all"
      ? true
      : course.categoryId === selectedCategory;

    return matchesSearch && matchesDifficulty && matchesCategory;
  });

  const sortedCourses = [...filteredCourses].sort((a: any, b: any) => {
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

  const getDifficultyColors = (difficulty?: string) => {
    if (difficulty === "beginner") {
      return "bg-green-500/15 text-green-400 border-green-500/30";
    }
    if (difficulty === "intermediate") {
      return "bg-yellow-500/15 text-yellow-400 border-yellow-500/30";
    }
    if (difficulty === "advanced") {
      return "bg-red-500/15 text-red-400 border-red-500/30";
    }
    return "bg-gray-500/15 text-gray-400 border-gray-500/30";
  };

  const getInstructorInfo = (course: any) => {
    const metadata = course?.metadata
      ? typeof course.metadata === "string"
        ? JSON.parse(course.metadata)
        : course.metadata
      : {};
    const instructor = metadata?.instructor || {};
    const fallbackName = user?.firstName || user?.lastName
      ? `${user?.firstName || ""} ${user?.lastName || ""}`.trim()
      : "";
    const defaultAvatar = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96'><rect width='96' height='96' fill='%2320132d'/><circle cx='48' cy='36' r='16' fill='%23c0467f'/><rect x='20' y='58' width='56' height='26' rx='13' fill='%23c0467f'/></svg>";
    return {
      name: instructor?.name || course?.instructorName || fallbackName || "Instructor",
      avatar: instructor?.avatar || course?.instructorAvatar || (user as any)?.profileImageUrl || defaultAvatar,
    };
  };

  const renderListCard = (course: any) => {
    const instructor = getInstructorInfo(course);
    const category = (categories as any)?.find((cat: any) => cat.id === course.categoryId);

    return (
      <div key={course.id} className="relative w-full">
        <div
          onClick={() => {
            const courseIdentifier = (course as any).slug || course.id;
            setLocation(`/curso/${courseIdentifier}`);
          }}
          className="w-full text-left bg-card border border-border rounded-xl p-5 hover:bg-muted/30 transition-colors cursor-pointer relative"
        >
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-3">
            <h3 className="text-[18px] font-bold text-foreground">{course.title}</h3>
            <div className="flex items-center gap-2">
              {course.difficulty && (
                <div className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide border ${getDifficultyColors(course.difficulty)}`}>
                  {getDifficultyLabel(course.difficulty)}
                </div>
              )}
              {category && (
                <div className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded-md">
                  <span className="text-xs text-muted-foreground">{category.name}</span>
                </div>
              )}
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
      </div>
      </div>
    );
  };

  const renderGridCard = (course: any) => {
    const instructor = getInstructorInfo(course);
    const isSaved = Array.isArray(savedCourses) && savedCourses.some((savedCourse: any) => savedCourse.courseId === course.id);
    const category = (categories as any)?.find((cat: any) => cat.id === course.categoryId);

    return (
      <div
        key={course.id}
        className="w-full bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 relative"
      >
        <div
          onClick={() => {
            const courseIdentifier = (course as any).slug || course.id;
            setLocation(`/curso/${courseIdentifier}`);
          }}
          className="w-full text-left cursor-pointer relative"
        >
          <div className="relative aspect-[16/10] bg-muted/40 rounded-t-2xl overflow-hidden">
            {course.coverImageUrl ? (
              <div className="w-full h-full p-4 flex items-center justify-center">
                <img
                  src={course.coverImageUrl}
                  alt={course.title}
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
              {course.title}
            </h3>

            <div className="flex items-center gap-2 flex-wrap">
              {course.difficulty && (
                <div className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide border ${getDifficultyColors(course.difficulty)}`}>
                  {getDifficultyLabel(course.difficulty)}
                </div>
              )}
              {category && (
                <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted rounded-md">
                  <span className="text-[10px] text-muted-foreground">{category.name}</span>
                </div>
              )}
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
                    saveCourseMutation.mutate({ courseId: course.id, isSaved });
                  }}
                  disabled={saveCourseMutation.isPending}
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
        </div>
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
            <h1 className="text-2xl font-bold text-foreground">Cursos</h1>
            <Button variant="ghost" size="sm" className="p-2">
              <Menu className="h-6 w-6 text-muted-foreground" />
            </Button>
          </div>

          {/* Desktop/Tablet Content */}
          <div className="hidden lg:block px-8 py-6 max-w-[1200px] mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold mb-2">Cursos</h1>
                <p className="text-muted-foreground">Descubre cursos completos para dominar la IA</p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-3 flex-1">
                <div className="relative w-full max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Buscar cursos..."
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

                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[200px] bg-card border-border text-foreground">
                    <SelectValue placeholder="Todas las categorías" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="all" className="text-foreground hover:bg-muted">
                      Todas las categorías
                    </SelectItem>
                    {(categories as any)?.map((category: any) => (
                      <SelectItem key={category.id} value={category.id} className="text-foreground hover:bg-muted">
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  className="border-border text-foreground hover:bg-muted"
                  onClick={() => {
                    setSearchTerm("");
                    setSortBy("newest");
                    setDifficultyFilter("all");
                    setSelectedCategory("all");
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
                {sortedCourses.map((course: any) => renderGridCard(course))}
              </div>
            ) : (
              <div className="space-y-4">
                {sortedCourses.map((course: any) => renderListCard(course))}
              </div>
            )}

            {sortedCourses.length === 0 && (
              <div className="text-center py-16">
                <p className="text-muted-foreground text-lg">No se encontraron cursos que coincidan con los filtros seleccionados.</p>
              </div>
            )}
          </div>

          {/* Mobile Content */}
          <div className="lg:hidden px-4 pb-6">
            <div className="mb-6">
              <p className="text-gray-400 mb-4">Descubre cursos completos para dominar la IA</p>

              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Buscar cursos..."
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

                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full bg-card border-border text-foreground">
                    <SelectValue placeholder="Todas las categorías" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="all" className="text-foreground hover:bg-muted">
                      Todas las categorías
                    </SelectItem>
                    {(categories as any)?.map((category: any) => (
                      <SelectItem key={category.id} value={category.id} className="text-foreground hover:bg-muted">
                        {category.name}
                      </SelectItem>
                    ))}
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
                    setSelectedCategory("all");
                    setViewMode("grid");
                  }}
                >
                  Borrar filtros
                </Button>
              </div>
            </div>

            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 gap-4">
                {sortedCourses.map((course: any) => renderGridCard(course))}
              </div>
            ) : (
              <div className="space-y-4">
                {sortedCourses.map((course: any) => renderListCard(course))}
              </div>
            )}

            {sortedCourses.length === 0 && (
              <div className="text-center py-16">
                <p className="text-muted-foreground">No se encontraron cursos que coincidan con los filtros seleccionados.</p>
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
