import React, { useState } from "react";
import { useSimpleAuth } from "@/hooks/use-simple-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, MessageCircle, Share2, Calendar, TrendingUp, Search, Plus, ChevronDown,
  Users, MessageSquare, Trophy, Calendar as CalendarIcon, DollarSign, Zap
} from "lucide-react";
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
  const [activeChannel, setActiveChannel] = useState("empieza");
  const [posts, setPosts] = useState<Post[]>([
    {
      id: "1",
      author: {
        name: "María González",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria",
        role: "Mentor"
      },
      title: "¡Bienvenido!",
      content: "Nuestra comunidad es un espacio para aprender, conectar e intercambiar experiencias sobre el mundo del desarrollo con código y la IA.",
      timestamp: "Hace 2 horas",
      likes: 45,
      comments: 12,
      category: "General",
      liked: false
    },
    {
      id: "2",
      author: {
        name: "Carlos Ruiz",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos",
        role: "Desarrollador"
      },
      title: "Publicaciones destacadas por leer, aprender e intercambiar esta semana",
      content: "Hemos recopilado las mejores publicaciones de la semana para que no te pierdas nada importante.",
      timestamp: "Hace 5 horas",
      likes: 128,
      comments: 34,
      category: "Destacadas",
      liked: false
    },
    {
      id: "3",
      author: {
        name: "Ana López",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ana",
        role: "Creadora"
      },
      title: "Ganadores del Black IA No Vela 🎉",
      content: "Felicidades a todos los ganadores de esta semana. Sus proyectos fueron increíbles.",
      timestamp: "Hace 8 horas",
      likes: 67,
      comments: 23,
      category: "Concursos",
      liked: false
    }
  ]);

  const upcomingEvents: Event[] = [
    { id: "1", date: "24", day: "jueves", title: "Sesión de preguntas y respuestas: IA y automatización", time: "3:00 - 4:00 PM -05" },
    { id: "2", date: "25", day: "viernes", title: "Bienvenida a la transmisión en vivo - Comunidad NoCode", time: "8:00 - 9:00 PM -05" },
    { id: "3", date: "26", day: "sábado", title: "Sesión de preguntas y respuestas: IA y automatización", time: "3:00 - 4:00 PM -05" },
    { id: "4", date: "28", day: "lunes", title: "Cómo ofrecer soluciones de automatización e IA", time: "5:00 - 6:00 PM -05" }
  ];

  const popularPosts: Post[] = [
    {
      id: "p1",
      author: { name: "Enric", role: "Instructor", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Enric" },
      title: "Envío automático de comprobantes de pago",
      content: "",
      timestamp: "2 días",
      likes: 234,
      comments: 45
    },
    {
      id: "p2",
      author: { name: "Bruno Rialetta Morales", role: "Mentor", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bruno" },
      title: "¿De verdad está protegiendo el certificado de seguridad de mi aplicación?",
      content: "",
      timestamp: "3 días",
      likes: 189,
      comments: 32
    }
  ];

  const channelSections = [
    {
      title: "Bienvenida",
      channels: [
        { id: "empieza", label: "Empieza aquí", icon: "🚀" },
        { id: "presentate", label: "Preséntate", icon: "🎤", badge: "63" },
        { id: "faqs", label: "Preguntas frecuentes", icon: "❓" },
        { id: "anuncios", label: "Anuncios", icon: "📢", badge: "11" },
        { id: "streams", label: "Transmisiones en directo y reuniones", icon: "🔴" },
      ]
    },
    {
      title: "Redes",
      channels: [
        { id: "proyectos", label: "Comparte tu proyecto/trabajo", icon: "👨‍💼", badge: "21" },
        { id: "chat", label: "Redes de chat", icon: "💬", badge: "53" },
        { id: "consejos", label: "Consejos y noticias", icon: "💡", badge: "9" },
        { id: "jobs", label: "Ofertas de empleo y oportunidades", icon: "💼", badge: "2" },
      ]
    },
    {
      title: "Mercado y negocios",
      channels: [
        { id: "marketing", label: "Marketing y ventas", icon: "📈", badge: "6" },
      ]
    },
    {
      title: "Obtén respuestas a tus preguntas",
      channels: [
        { id: "agentes-esp", label: "Agentes especializados", icon: "⭐" },
        { id: "agentes-ia", label: "Agentes de IA", icon: "🤖", badge: "31" },
        { id: "automatizacion", label: "Automatización", icon: "⚙️", badge: "18" },
        { id: "apps", label: "Aplicaciones y programación Vibe", icon: "📱", badge: "12" },
      ]
    },
    {
      title: "Materiales de clase",
      channels: [
        { id: "cupones", label: "Cupones y descuentos", icon: "🎟️" },
      ]
    },
    {
      title: "Links",
      channels: [
        { id: "clases", label: "Acceso a las clases", icon: "📚" },
        { id: "whatsapp", label: "Soporte de WhatsApp", icon: "💬" },
        { id: "whatsapp-notif", label: "Canal de notificaciones de WhatsApp", icon: "🔔" },
        { id: "feedback", label: "Comentarios y sugerencias", icon: "📝" },
        { id: "trabaja", label: "Trabaja con nosotros", icon: "💼" },
      ]
    }
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
        <div className="flex-1 flex items-center justify-center">
          <div className="text-foreground">Cargando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex overflow-hidden">
      {/* Left Sidebar - Channels */}
      <div className="w-[280px] bg-[#2a2a2a] border-r border-[#333333] overflow-y-auto flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-[#333333] sticky top-0 bg-[#2a2a2a] z-10">
          <div className="flex items-center gap-2">
            <Input
              type="search"
              placeholder="Buscar canales..."
              className="text-xs h-8 bg-[#1a1a1a] border-[#444444]"
            />
          </div>
        </div>

        {/* Sections */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-2">
          {channelSections.map((section) => (
            <div key={section.title}>
              <div className="text-xs text-muted-foreground px-2 py-2 font-semibold uppercase">
                {section.title}
              </div>
              {section.channels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => setActiveChannel(channel.id)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded text-sm font-medium flex items-center justify-between gap-2 hover:bg-[#333333] transition-colors group",
                    activeChannel === channel.id && "bg-[#404040] text-white"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-lg flex-shrink-0">{channel.icon}</span>
                    <span className="truncate text-sm">{channel.label}</span>
                  </div>
                  {channel.badge && (
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full flex-shrink-0 group-hover:bg-[#333333]">
                      {channel.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="border-t border-[#333333] p-3 text-xs text-muted-foreground sticky bottom-0 bg-[#2a2a2a]">
          En
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b border-[#333333] bg-[#1a1a1a] px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white capitalize">
              {channelSections.flatMap(s => s.channels).find(c => c.id === activeChannel)?.label || "Alimentar"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleNewPost}
              className="bg-cyan-500 hover:bg-cyan-600 text-white text-sm"
            >
              Nueva publicación
            </Button>
          </div>
        </div>

        {/* Content and Sidebar wrapper */}
        <div className="flex-1 overflow-hidden flex gap-6 bg-background">
          {/* Center Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="max-w-2xl space-y-4">
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
                            <Badge variant="outline" className="text-xs bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
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
                        <Badge className="bg-cyan-500/20 text-cyan-400 border-0 text-xs">
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
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="w-72 overflow-y-auto border-l border-[#333333] px-6 py-6 space-y-6">
            {/* Upcoming Events */}
            <div>
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-cyan-400" />
                Próximos eventos
              </h3>
              <div className="space-y-3">
                {upcomingEvents.map(event => (
                  <div key={event.id} className="flex gap-3 p-2 rounded hover:bg-muted/50 transition-colors cursor-pointer">
                    <div className="flex flex-col items-center justify-center min-w-fit bg-muted/50 px-2 py-1 rounded text-xs">
                      <span className="font-bold text-cyan-400">{event.date}</span>
                      <span className="text-muted-foreground text-xs capitalize">{event.day}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white line-clamp-2">{event.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{event.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Popular Posts */}
            <div>
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-cyan-400" />
                Publicaciones populares
              </h3>
              <div className="space-y-3">
                {popularPosts.map(post => (
                  <div key={post.id} className="p-3 bg-muted/30 rounded hover:bg-muted/50 transition-colors cursor-pointer">
                    <div className="flex items-start gap-2 mb-2">
                      <Avatar className="h-6 w-6 flex-shrink-0">
                        <AvatarImage src={post.author.avatar} />
                        <AvatarFallback className="text-xs">{post.author.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground font-medium">{post.author.name}</p>
                        <p className="text-xs font-medium text-white line-clamp-2">{post.title}</p>
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
