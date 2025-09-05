import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useLessonPosition } from "@/hooks/useLessonPosition";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import MobileHeader from "@/components/layout/mobile-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Clock, BookOpen, PlayCircle, FileText, HelpCircle, Play } from "lucide-react";
import { GraduationCap } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';

type Lesson = {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  content?: string;
  type: string;
  order: number;
  duration?: number;
  videoUrl?: string;
  objectives?: string;
  attachments?: string;
  createdAt: string;
};

type Course = {
  id: string;
  title: string;
  description?: string;
  difficulty?: string;
};

const typeIcons = {
  text: FileText,
  video: PlayCircle,
  quiz: HelpCircle,
};

const typeLabels = {
  text: "Texto",
  video: "Video",
  quiz: "Quiz",
};

export default function Lesson() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const { saveLessonPosition } = useLessonPosition();

  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ["/api/courses", courseId],
    queryFn: () => fetch(`/api/courses/${courseId}`).then(r => r.json()),
    enabled: !!courseId,
  });

  const { data: lesson, isLoading: lessonLoading } = useQuery({
    queryKey: ["/api/courses", courseId, "lessons", lessonId],
    queryFn: () => fetch(`/api/courses/${courseId}/lessons/${lessonId}`).then(r => r.json()),
    enabled: !!courseId && !!lessonId,
  });

  // Guardar automáticamente la posición de la lección cuando se carga
  useEffect(() => {
    if (courseId && lessonId && lesson) {
      saveLessonPosition(courseId, lessonId);
    }
  }, [courseId, lessonId, lesson, saveLessonPosition]);

  if (courseLoading || lessonLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
            <p className="text-gray-400 mt-4">Cargando lección...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!lesson || !course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-20">
            <BookOpen className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Lección no encontrada</h1>
            <p className="text-gray-400 mb-6">La lección que buscas no existe o no está disponible.</p>
            <Link href="/courses">
              <Button>Volver a Cursos</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const TypeIcon = typeIcons[lesson.type as keyof typeof typeIcons] || FileText;
  const objectives = lesson.objectives ? lesson.objectives.split('\n').filter((obj: string) => obj.trim()) : [];
  const attachments = lesson.attachments ? lesson.attachments.split('\n').filter((att: string) => att.trim()) : [];

  return (
    <div className="min-h-screen bg-[#171717] text-white">
      {/* Mobile Header */}
      <MobileHeader />
      
      <div className="flex">
        {/* Sidebar - Hidden on mobile, shown on desktop */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        
        {/* Main Content */}
        <main className="flex-1 overflow-auto pb-20 lg:pb-0 lg:ml-[250px]">
          {/* Top Header */}
          <div className="px-4 py-3 border-b border-gray-800">
            <div className="flex items-center justify-between">
              <Link href="/courses" className="flex items-center text-gray-400 hover:text-white">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a los cursos
              </Link>
              <Button variant="outline" size="sm" className="border-gray-600 text-gray-300">
                <span className="mr-1">🔖</span>
                Guardar curso
              </Button>
            </div>
          </div>

          {/* Course Title and Progress */}
          <div className="px-4 py-4">
            <h1 className="text-xl font-bold text-white mb-2">{course.title}</h1>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span className="w-2 h-2 bg-white rounded-full"></span>
              <span>Lecciones</span>
              <div className="flex-1 bg-gray-700 rounded-full h-1">
                <div className="bg-white rounded-full h-1 w-1/3"></div>
              </div>
            </div>
          </div>

          {/* Video Player Area */}
          <div className="px-4 mb-6">
            <div className="aspect-video bg-black rounded-lg flex items-center justify-center relative">
              {lesson.videoUrl ? (
                <iframe
                  className="absolute top-0 left-0 w-full h-full rounded-lg"
                  src={lesson.videoUrl.includes('youtube.com') || lesson.videoUrl.includes('youtu.be') ? 
                    lesson.videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/') : 
                    lesson.videoUrl}
                  title={lesson.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                  <PlayCircle className="h-10 w-10 text-black" />
                </div>
              )}
            </div>
          </div>

          {/* Lesson Content */}
          <div className="px-4 space-y-4">
            {/* Lesson Title with Icon */}
            <div className="flex items-start gap-3">
              <div>
                <h2 className="flex items-center gap-3 text-[24px] font-bold text-white mb-2 font-satoshi">
                  {/* Graduation cap icon */}
                  <span className="text-[24px] flex-shrink-0" style={{fontSize: '24px'}}>🎓</span>
                  {lesson.title}
                </h2>
                {lesson.description && (
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {lesson.description}
                  </p>
                )}
              </div>
            </div>

            {/* Lesson Content */}
            {lesson.content && (
              <div className="bg-gray-900/30 rounded-lg p-4">
                <div className="prose prose-invert prose-sm max-w-none prose-headings:text-white prose-p:text-gray-300 prose-strong:text-white prose-em:text-gray-200 prose-ul:text-gray-300 prose-ol:text-gray-300 prose-blockquote:text-gray-300 prose-code:text-purple-400 prose-pre:bg-slate-900">
                  <div className="markdown-content">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeHighlight, rehypeRaw]}
                    >
                      {lesson.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            )}

            {/* Learning Objectives - Mobile View */}
            {objectives.length > 0 && (
              <div className="bg-gray-900/30 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-3">Objetivos de Aprendizaje</h3>
                <div className="space-y-2">
                  {objectives.map((objective: string, index: number) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-gray-300 text-sm">{objective}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Attachments - Mobile View */}
            {attachments.length > 0 && (
              <div className="bg-gray-900/30 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-3">Archivos Adjuntos</h3>
                <div className="space-y-2">
                  {attachments.map((attachment: string, index: number) => (
                    <div key={index} className="p-3 bg-slate-800/50 rounded-lg">
                      <p className="text-gray-300 text-sm break-all">{attachment}</p>
                    </div>
                  ))}
                </div>
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