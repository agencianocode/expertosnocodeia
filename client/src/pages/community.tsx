import React, { useState } from "react";
import { useSimpleAuth } from "@/hooks/use-simple-auth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import MobileHeader from "@/components/layout/mobile-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Share2, Calendar, TrendingUp, Search, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Post {
  id: string;
  author: {
    name: string;
    avatar?: string;
    role?: string;
  };
  title: string;
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  category?: string;
  image?: string;
  liked?: boolean;
}

interface Event {
  id: string;
  date: string;
  day: string;
  title: string;
  time: string;
}

export default function Community() {
  const { isAuthenticated, user, isLoading } = useSimpleAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [posts, setPosts] = useState<Post[]>([
    {
      id: "1",
      author: {
        name: "María González",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria",
        role: "Mentor"
      },
      title: "Sesión de preguntas y respuestas: IA y automatización",
      content: "Hoy tuvimos una sesión increíble discutiendo sobre los últimos avances en IA...",
      timestamp: "Hace 2 horas",
      likes: 45,
      comments: 12,
      category: "IA",
      liked: false
    },
    {
      id: "2",
      author: {
        name: "Carlos Ruiz",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos",
        role: "Desarrollador"
      },
      title: "Ganadores del Black IA No Vela 🎉",
      content: "Felicidades a todos los ganadores de esta semana. Sus proyectos fueron...",
      timestamp: "Hace 5 horas",
      likes: 128,
      comments: 34,
      category: "Concursos",
      liked: false
    },
    {
      id: "3",
      author: {
        name: "Ana López",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ana",
        role: "Creadora"
      },
      title: "TEMAS para TRANSMISIONES EN VIVO (¡Necesitamos tu ayuda!)",
      content: "¿Qué temas te gustaría que cubramos en nuestras próximas transmisiones?...",
      timestamp: "Hace 8 horas",
      likes: 67,
      comments: 23,
      category: "Sugerencias",
      liked: false
    }
  ]);

  const upcomingEvents: Event[] = [
    {
      id: "1",
      date: "24",
      day: "Jueves",
      title: "Sesión de preguntas y respuestas: IA y automatización",
      time: "3:00 - 4:00 PM -05"
    },
    {
      id: "2",
      date: "25",
      day: "Viernes",
      title: "Bienvenida a la transmisión en vivo - Comunidad NoCode",
      time: "8:00 - 9:00 PM -05"
    },
    {
      id: "3",
      date: "26",
      day: "Sábado",
      title: "Sesión de preguntas y respuestas: IA y automatización",
      time: "3:00 - 4:00 PM -05"
    },
    {
      id: "4",
      date: "28",
      day: "Lunes",
      title: "Cómo ofrecer soluciones de automatización e IA",
      time: "5:00 - 6:00 PM -05"
    }
  ];

  const popularPosts: Post[] = [
    {
      id: "p1",
      author: { name: "Enric", role: "Instructor" },
      title: "Envío automático de comprobantes de pago",
      content: "Tutorial completo sobre automatización de pagos",
      timestamp: "2 días",
      likes: 234,
      comments: 45,
      category: "Tutorial"
    },
    {
      id: "p2",
      author: { name: "Bruno Rialetta Morales", role: "Mentor" },
      title: "¿De verdad está protegiendo el certificado de seguridad de mi aplicación?",
      content: "Análisis de seguridad en certificados SSL",
      timestamp: "3 días",
      likes: 189,
      comments: 32,
      category: "Seguridad"
    }
  ];

  const categories = [
    { id: "all", label: "Todos", icon: "🌐" },
    { id: "presentate", label: "Presentate", icon: "👋" },
    { id: "faqs", label: "Preguntas frecuentes", icon: "❓" },
    { id: "announcements", label: "Anuncios", icon: "📢" },
    { id: "streams", label: "Transmisiones en directo", icon: "🔴" },
    { id: "chat", label: "Redes de chat", icon: "💬" },
    { id: "jobs", label: "Ofertas de empleo", icon: "💼" }
  ];

  const handleLikePost = (postId: string) => {
    setPosts(posts.map(post =>
      post.id === postId
        ? { ...post, liked: !post.liked, likes: post.liked ? post.likes - 1 : post.likes + 1 }
        : post
    ));
  };

  const handleNewPost = () => {
    if (!isAuthenticated) {
      toast({
        title: "Inicia sesión",
        description: "Debes estar autenticado para crear una publicación",
        variant: "destructive"
      });
      return;
    }
    toast({
      title: "Nueva publicación",
      description: "Función de crear publicación próximamente",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-foreground">Cargando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <MobileHeader />
      
      <div className="flex flex-col lg:flex-row gap-6 pt-20 lg:pt-6 lg:ml-[250px] px-4 lg:px-6 pb-20">
        {/* Main Feed - Centro */}
        <div className="flex-1 max-w-2xl">
          {/* Search and New Post */}
          <div className="space-y-4 mb-6">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar publicaciones..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button
                onClick={handleNewPost}
                className="bg-cyan-500 hover:bg-cyan-600 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nueva publicación
              </Button>
            </div>

            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all flex-shrink-0",
                    selectedCategory === cat.id
                      ? "bg-primary text-white"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  <span className="mr-2">{cat.icon}</span>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Posts */}
          <div className="space-y-4">
            {posts.map(post => (
              <Card key={post.id} className="bg-[#1a1a1a] border-[#333333] hover:border-[#444444] transition-colors">
                <CardContent className="pt-6">
                  {/* Author */}
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={post.author.avatar} />
                      <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white text-sm">{post.author.name}</h3>
                        {post.author.role && (
                          <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                            {post.author.role}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{post.timestamp}</p>
                    </div>
                  </div>

                  {/* Post Content */}
                  <div className="mb-4">
                    <h2 className="text-lg font-semibold text-white mb-2">{post.title}</h2>
                    <p className="text-muted-foreground text-sm">{post.content}</p>
                  </div>

                  {/* Category Badge */}
                  {post.category && (
                    <div className="mb-4">
                      <Badge className="bg-primary/20 text-primary border-0">
                        {post.category}
                      </Badge>
                    </div>
                  )}

                  {/* Interactions */}
                  <div className="flex items-center justify-between text-muted-foreground border-t border-[#333333] pt-4">
                    <button
                      onClick={() => handleLikePost(post.id)}
                      className={cn(
                        "flex items-center gap-2 text-sm hover:text-white transition-colors",
                        post.liked && "text-red-500"
                      )}
                    >
                      <Heart className={cn("h-4 w-4", post.liked && "fill-current")} />
                      {post.likes}
                    </button>
                    <button className="flex items-center gap-2 text-sm hover:text-white transition-colors">
                      <MessageCircle className="h-4 w-4" />
                      {post.comments}
                    </button>
                    <button className="flex items-center gap-2 text-sm hover:text-white transition-colors">
                      <Share2 className="h-4 w-4" />
                      Compartir
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Sidebar Derecho - Desktop only */}
        <div className="hidden lg:flex flex-col gap-6 w-72 sticky top-6 h-fit">
          {/* Upcoming Events */}
          <Card className="bg-[#1a1a1a] border-[#333333]">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Próximos eventos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingEvents.map(event => (
                <div
                  key={event.id}
                  className="flex gap-3 p-2 rounded hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div className="flex flex-col items-center justify-center min-w-fit bg-muted/50 px-2 py-1 rounded">
                    <span className="text-lg font-bold text-primary">{event.date}</span>
                    <span className="text-xs text-muted-foreground">{event.day}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white line-clamp-2">{event.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{event.time}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Popular Posts */}
          <Card className="bg-[#1a1a1a] border-[#333333]">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Publicaciones populares
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {popularPosts.map(post => (
                <div
                  key={post.id}
                  className="p-3 bg-muted/30 rounded hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-start gap-2 mb-2">
                    <Avatar className="h-6 w-6 flex-shrink-0">
                      <AvatarFallback className="text-xs">{post.author.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">{post.author.name}</p>
                      <p className="text-sm font-medium text-white line-clamp-2">{post.title}</p>
                    </div>
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      {post.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />
                      {post.comments}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <MobileNav />
    </div>
  );
}
