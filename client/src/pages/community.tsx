import { useState, useEffect } from "react";
import { useSimpleAuth } from "@/hooks/use-simple-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Loader2, Menu, Heart, MessageCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";

interface Channel {
  id: string;
  slug: string;
  name: string;
  description?: string;
  icon: string;
  section: string;
}

interface Post {
  post: {
    id: string;
    channelId: string;
    userId: string;
    title: string;
    content: string;
    imageUrl?: string;
    likes: number;
    createdAt: string;
    updatedAt: string;
  };
  user: {
    id: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
  } | null;
}

interface Comment {
  comment: {
    id: string;
    postId: string;
    userId: string;
    content: string;
    createdAt: string;
    updatedAt: string;
  };
  user: {
    id: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
  } | null;
}

export default function Community() {
  const { isAuthenticated, user } = useSimpleAuth();
  const { toast } = useToast();
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [postComments, setPostComments] = useState<{ [key: string]: Comment[] }>({});
  const [loading, setLoading] = useState(true);
  const [commentInput, setCommentInput] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const [channelsSidebarOpen, setChannelsSidebarOpen] = useState(true);
  const [isAnunciosChannel, setIsAnunciosChannel] = useState(false);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);

  // Fetch channels on mount
  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const res = await fetch("/api/community/channels");
        const data = await res.json();
        setChannels(data);
        if (data.length > 0) {
          const firstChannel = data.find((c: Channel) => c.slug === "anuncios") || data[0];
          setActiveChannel(firstChannel);
        }
      } catch (error) {
        console.error("Error fetching channels:", error);
        toast({ title: "Error", description: "No se pudieron cargar los canales", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchChannels();
  }, []);

  // Fetch content when channel changes
  useEffect(() => {
    if (!activeChannel) return;

    const isAnuncios = activeChannel.slug === "anuncios";
    setIsAnunciosChannel(isAnuncios);

    const fetchContent = async () => {
      try {
        if (isAnuncios) {
          // Fetch posts for announcements channel
          const res = await fetch(`/api/community/channels/${activeChannel.id}/posts?limit=50`);
          const data = await res.json();
          setPosts(Array.isArray(data) ? data : []);
          setPostComments({});
          setExpandedPostId(null);
        } else {
          // For regular channels, we could add message fetching here if needed
          setPosts([]);
          setPostComments({});
          setExpandedPostId(null);
        }
      } catch (error) {
        console.error("Error fetching content:", error);
        setPosts([]);
      }
    };

    fetchContent();
  }, [activeChannel]);

  // Fetch comments for a specific post
  const fetchCommentsForPost = async (postId: string) => {
    try {
      const res = await fetch(`/api/community/posts/${postId}/comments`);
      const data = await res.json();
      setPostComments(prev => ({
        ...prev,
        [postId]: Array.isArray(data) ? data : []
      }));
    } catch (error) {
      console.error("Error fetching comments:", error);
      setPostComments(prev => ({
        ...prev,
        [postId]: []
      }));
    }
  };

  const handleExpandPost = async (postId: string) => {
    if (expandedPostId === postId) {
      setExpandedPostId(null);
    } else {
      setExpandedPostId(postId);
      if (!postComments[postId]) {
        await fetchCommentsForPost(postId);
      }
    }
  };

  const handleSendComment = async (postId: string) => {
    if (!commentInput.trim()) return;

    setSendingComment(true);
    try {
      const res = await fetch(`/api/community/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: commentInput }),
      });

      if (res.ok) {
        setCommentInput("");
        // Refresh comments for this post
        await fetchCommentsForPost(postId);
        toast({ title: "Éxito", description: "Comentario enviado" });
      } else {
        const error = await res.json();
        toast({ title: "Error", description: error.message || "No se pudo enviar el comentario", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error sending comment:", error);
      toast({ title: "Error", description: "No se pudo enviar el comentario", variant: "destructive" });
    } finally {
      setSendingComment(false);
    }
  };

  const groupedChannels = channels.reduce((acc: { [key: string]: Channel[] }, channel) => {
    if (!acc[channel.section]) acc[channel.section] = [];
    acc[channel.section].push(channel);
    return acc;
  }, {});

  const sectionOrder = ["Comunidad", "Cursos de Salas"];
  const orderedSections = sectionOrder.filter(s => groupedChannels[s]).map(s => ({ title: s, channels: groupedChannels[s] }));

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Left Sidebar - Main Navigation (fixed) */}
      <Sidebar />

      {/* Main Content Container - accounts for fixed sidebar */}
      <div className="md:ml-16 lg:ml-[250px] min-h-screen flex overflow-hidden">
        {/* Middle Sidebar - Channels */}
        <div className={cn(
          "w-[280px] bg-[#2a2a2a] border-r border-[#333333] overflow-y-auto flex flex-col transition-all duration-300",
          !channelsSidebarOpen && "hidden lg:flex"
        )}>
          {/* Search */}
          <div className="p-4 border-b border-[#333333] sticky top-0 bg-[#2a2a2a] z-10">
            <Input type="search" placeholder="Buscar..." className="text-xs h-8 bg-[#1a1a1a] border-[#444444]" />
          </div>

          {/* Sections */}
          <div className="flex-1 overflow-y-auto px-2 py-3 space-y-2">
            {orderedSections.map((section) => (
              <div key={section.title}>
                <div className="text-xs text-muted-foreground px-2 py-2 font-semibold uppercase">{section.title}</div>
                {section.channels.map((channel) => (
                  <button
                    key={channel.id}
                    onClick={() => setActiveChannel(channel)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded text-sm font-medium flex items-center gap-2 hover:bg-[#333333] transition-colors",
                      activeChannel?.id === channel.id && "bg-[#404040] text-white"
                    )}
                    data-testid={`channel-${channel.slug}`}
                  >
                    <span className="text-lg">{channel.icon}</span>
                    <span className="truncate">{channel.name}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>

          <div className="border-t border-[#333333] p-3 text-xs text-muted-foreground sticky bottom-0 bg-[#2a2a2a]">
            En vivo
          </div>
        </div>

        {/* Center Content - Posts Feed */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="border-b border-[#333333] bg-[#1a1a1a] px-6 py-4 flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setChannelsSidebarOpen(!channelsSidebarOpen)}
              className="lg:hidden"
              data-testid="toggle-channels-button"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-white">{activeChannel?.name}</h1>
              {activeChannel?.description && <p className="text-xs text-muted-foreground mt-1">{activeChannel.description}</p>}
            </div>
          </div>

          {/* Posts Feed - Only for Anuncios channel */}
          {isAnunciosChannel ? (
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
              {posts.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p>No hay anuncios. Vuelve pronto.</p>
                </div>
              ) : (
                posts.map((post) => {
                  const comments = postComments[post.post.id] || [];
                  const isExpanded = expandedPostId === post.post.id;
                  
                  return (
                    <div
                      key={post.post.id}
                      className={cn(
                        "p-4 rounded-lg border border-[#333333] bg-[#1a1a1a] transition-all",
                        isExpanded && "border-cyan-500 bg-[#1a2a2a]"
                      )}
                      data-testid={`post-${post.post.id}`}
                    >
                      {/* Post Header */}
                      {post.post.imageUrl && (
                        <img src={post.post.imageUrl} alt="" className="w-full h-40 object-cover rounded mb-3" />
                      )}
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={post.user?.profileImageUrl || undefined} />
                          <AvatarFallback>{(post.user?.firstName?.charAt(0) || "U").toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="text-sm">
                          <p className="font-semibold text-white">
                            {post.user?.firstName} {post.user?.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(post.post.createdAt).toLocaleDateString("es-ES")}
                          </p>
                        </div>
                      </div>

                      {/* Post Content */}
                      <h3 className="font-bold text-white mb-2">{post.post.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{post.post.content}</p>

                      {/* Post Actions */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4 pb-4 border-b border-[#333333]">
                        <div className="flex items-center gap-1">
                          <Heart className="h-4 w-4" />
                          {post.post.likes}
                        </div>
                        <button
                          onClick={() => handleExpandPost(post.post.id)}
                          className="flex items-center gap-1 hover:text-cyan-500 transition-colors"
                          data-testid={`toggle-comments-${post.post.id}`}
                        >
                          <MessageCircle className="h-4 w-4" />
                          {comments.length}
                        </button>
                      </div>

                      {/* Comments Section - Expandable */}
                      {isExpanded && (
                        <div className="space-y-3">
                          {/* Comments List */}
                          {comments.length === 0 ? (
                            <p className="text-xs text-muted-foreground text-center py-2">Sin comentarios aún. ¡Sé el primero!</p>
                          ) : (
                            <div className="space-y-3 mb-3 max-h-48 overflow-y-auto">
                              {comments.map((comment) => (
                                <div key={comment.comment.id} className="flex gap-2 text-sm">
                                  <Avatar className="h-6 w-6 flex-shrink-0 mt-0.5">
                                    <AvatarImage src={comment.user?.profileImageUrl || undefined} />
                                    <AvatarFallback className="text-xs">{(comment.user?.firstName?.charAt(0) || "U").toUpperCase()}</AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1">
                                      <p className="text-xs font-semibold text-white">
                                        {comment.user?.firstName} {comment.user?.lastName}
                                      </p>
                                      <span className="text-xs text-muted-foreground">
                                        {new Date(comment.comment.createdAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                                      </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground break-words">{comment.comment.content}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Comment Input */}
                          <div className="flex gap-2 border-t border-[#333333] pt-3">
                            <Input
                              placeholder="Escribe un comentario..."
                              className="bg-[#2a2a2a] border-[#444444] text-white text-xs h-8"
                              value={commentInput}
                              onChange={(e) => setCommentInput(e.target.value)}
                              onKeyPress={(e) => e.key === "Enter" && handleSendComment(post.post.id)}
                              data-testid={`comment-input-${post.post.id}`}
                            />
                            <Button
                              onClick={() => handleSendComment(post.post.id)}
                              disabled={sendingComment || !commentInput.trim()}
                              className="bg-cyan-500 hover:bg-cyan-600 px-2 h-8"
                              size="sm"
                              data-testid={`send-comment-${post.post.id}`}
                            >
                              {sendingComment ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto px-6 py-6 text-muted-foreground text-center">
              <p>Este canal utiliza mensajes de chat. Implementar aquí si es necesario.</p>
            </div>
          )}
        </div>
      </div>

      <MobileNav />
    </div>
  );
}
