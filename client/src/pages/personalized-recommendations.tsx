import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, FileText, Users, ArrowRight, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
import { useSimpleAuth } from "@/hooks/use-simple-auth";

type Recommendation = {
  id: string;
  title: string;
  description?: string;
  reason: string;
  categoryId?: string;
  difficulty?: string;
  coverImageUrl?: string;
};

type PersonalizedRecommendations = {
  courses: Recommendation[];
  guides: Recommendation[];
  workshops: Recommendation[];
  nextSteps: string[];
};

export default function PersonalizedRecommendations() {
  const { user } = useSimpleAuth();
  const [, setLocation] = useLocation();

  const { data: recommendations, isLoading } = useQuery<PersonalizedRecommendations>({
    queryKey: ['/api/onboarding/recommendations'],
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12 text-white">
            <Sparkles className="h-12 w-12 mx-auto mb-4 animate-pulse" />
            <p className="text-xl">Generando recomendaciones personalizadas...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!recommendations) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="bg-slate-900/50 border-slate-700">
            <CardContent className="py-12 text-center">
              <p className="text-gray-400 mb-4">No hay recomendaciones disponibles</p>
              <Button onClick={() => setLocation('/onboarding')} className="bg-purple-600 hover:bg-purple-700">
                Completar Onboarding
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="h-8 w-8 text-purple-400" />
            <h1 className="text-4xl font-bold text-white">Recomendaciones para Ti</h1>
          </div>
          <p className="text-gray-400">
            Contenido personalizado basado en tu perfil y objetivos
          </p>
        </div>

        {/* Next Steps */}
        {recommendations.nextSteps && recommendations.nextSteps.length > 0 && (
          <Card className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-purple-500/50 mb-8">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <ArrowRight className="h-5 w-5" />
                Próximos Pasos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {recommendations.nextSteps.map((step, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-300">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Courses */}
        {recommendations.courses && recommendations.courses.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="h-6 w-6 text-purple-400" />
              <h2 className="text-2xl font-bold text-white">Cursos Recomendados</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendations.courses.map((course) => (
                <Card
                  key={course.id}
                  className="bg-slate-900/50 border-slate-700 hover:border-purple-500/50 transition-colors cursor-pointer"
                  onClick={() => setLocation(`/course/${course.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-white text-lg">{course.title}</CardTitle>
                      {course.difficulty && (
                        <Badge variant="outline" className="ml-2">
                          {course.difficulty}
                        </Badge>
                      )}
                    </div>
                    {course.description && (
                      <CardDescription className="text-gray-400 line-clamp-2">
                        {course.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-purple-400 mb-3">{course.reason}</p>
                    <Button
                      size="sm"
                      className="w-full bg-purple-600 hover:bg-purple-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLocation(`/course/${course.id}`);
                      }}
                    >
                      Ver Curso
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Guides */}
        {recommendations.guides && recommendations.guides.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-6 w-6 text-purple-400" />
              <h2 className="text-2xl font-bold text-white">Guías Recomendadas</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendations.guides.map((guide) => (
                <Card
                  key={guide.id}
                  className="bg-slate-900/50 border-slate-700 hover:border-purple-500/50 transition-colors cursor-pointer"
                  onClick={() => setLocation(`/guide/${guide.id}`)}
                >
                  <CardHeader>
                    <CardTitle className="text-white">{guide.title}</CardTitle>
                    {guide.description && (
                      <CardDescription className="text-gray-400">
                        {guide.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-purple-400 mb-3">{guide.reason}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLocation(`/guide/${guide.id}`);
                      }}
                    >
                      Ver Guía
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Workshops */}
        {recommendations.workshops && recommendations.workshops.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-6 w-6 text-purple-400" />
              <h2 className="text-2xl font-bold text-white">Workshops Recomendados</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recommendations.workshops.map((workshop) => (
                <Card
                  key={workshop.id}
                  className="bg-slate-900/50 border-slate-700 hover:border-purple-500/50 transition-colors cursor-pointer"
                  onClick={() => setLocation(`/workshop/${workshop.id}`)}
                >
                  <CardHeader>
                    <CardTitle className="text-white">{workshop.title}</CardTitle>
                    {workshop.description && (
                      <CardDescription className="text-gray-400">
                        {workshop.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-purple-400 mb-3">{workshop.reason}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLocation(`/workshop/${workshop.id}`);
                      }}
                    >
                      Ver Workshop
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {(!recommendations.courses || recommendations.courses.length === 0) &&
         (!recommendations.guides || recommendations.guides.length === 0) &&
         (!recommendations.workshops || recommendations.workshops.length === 0) && (
          <Card className="bg-slate-900/50 border-slate-700">
            <CardContent className="py-12 text-center">
              <Sparkles className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">
                Aún no tenemos recomendaciones personalizadas para ti
              </p>
              <Button onClick={() => setLocation('/onboarding')} className="bg-purple-600 hover:bg-purple-700">
                Completar Onboarding
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

