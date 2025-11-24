import { useState, useEffect } from "react";
import { useSimpleAuth } from "@/hooks/use-simple-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Loader2, Menu, Heart, MessageCircle, X, Smile, ChevronDown, MoreVertical, Bell, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface Channel {
  id: string;
  slug: string;
  name: string;
  description?: string;
  icon: string;
  section: string;
  isReadOnly?: boolean;
}

interface Post {
  post: {
    id: string;
    channelId: string;
    userId: string;
    title: string;
    content: string;
    imageUrl?: string;
    videoUrl?: string;
    likes: number;
    createdAt: string;
    updatedAt: string;
    contentBlocks?: any[];
    displayOrder?: number;
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
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentInput, setCommentInput] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const [channelsSidebarOpen, setChannelsSidebarOpen] = useState(true);
  const [isAnunciosChannel, setIsAnunciosChannel] = useState(false);
  const [postCommentCounts, setPostCommentCounts] = useState<{ [postId: string]: number }>({});
  const [allPostComments, setAllPostComments] = useState<{ [postId: string]: Comment[] }>({});
  const [openReactionPostId, setOpenReactionPostId] = useState<string | null>(null);
  const [postReactions, setPostReactions] = useState<{ [postId: string]: { emoji: string; count: number }[] }>({});
  const [userEmojis, setUserEmojis] = useState<{ [postId: string]: string[] }>({});
  const [allReactions, setAllReactions] = useState<{ [postId: string]: { emoji: string; count: number; users: string[] }[] }>({});
  const [sortBy, setSortBy] = useState("recent");
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [notificationPrefs, setNotificationPrefs] = useState({
    emailNotifications: true,
    inAppNotifications: true,
    mobileNotifications: false,
  });
  const [newPostContent, setNewPostContent] = useState("");
  const [creatingPost, setCreatingPost] = useState(false);
  const [isPresentanteChannel, setIsPresentanteChannel] = useState(false);

  // Mutation for adding/removing reactions
  const addReactionMutation = useMutation({
    mutationFn: async ({ postId, emoji }: { postId: string; emoji: string }) => {
      const res = await fetch(`/api/community/posts/${postId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ emoji }),
      });
      if (!res.ok) {
        throw new Error("Failed to add reaction");
      }
      return res.json();
    },
    onSuccess: (data, variables) => {
      // Close the reaction selector
      setOpenReactionPostId(null);
      
      // Refresh user reactions and all reactions
      Promise.all([
        fetch(`/api/community/posts/${variables.postId}/user-reactions`, { credentials: "include" }).then(r => r.json()),
        fetch(`/api/community/posts/${variables.postId}/reactions`).then(r => r.json())
      ]).then(([userReactionsData, allReactionsData]) => {
        const userReactionsArray = Array.isArray(userReactionsData) ? userReactionsData.map((r: any) => r.emoji) : [];
        const allReactionsArray = Array.isArray(allReactionsData) ? allReactionsData : [];
        setUserEmojis(prev => ({ ...prev, [variables.postId]: userReactionsArray }));
        setAllReactions(prev => ({ ...prev, [variables.postId]: allReactionsArray }));
      });
      
      toast({ title: "Éxito", description: "Reacción actualizada" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "No se pudo actualizar la reacción", variant: "destructive" });
    },
  });

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

  // Load notification preferences on mount
  useEffect(() => {
    const loadNotificationPrefs = async () => {
      try {
        const res = await fetch("/api/user/notification-preferences", {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setNotificationPrefs({
            emailNotifications: data.emailNotifications ?? true,
            inAppNotifications: data.inAppNotifications ?? true,
            mobileNotifications: data.mobileNotifications ?? false,
          });
        }
      } catch (error) {
        console.error("Error loading notification preferences:", error);
      }
    };

    if (user) {
      loadNotificationPrefs();
    }
  }, [user]);

  // Fetch content when channel changes
  useEffect(() => {
    if (!activeChannel) return;

    // Check if this channel should show posts (all "Comunidad" section channels show posts)
    const hasPostsFeed = activeChannel.section === "Comunidad";
    const isAnuncios = activeChannel.slug === "anuncios";
    const isPresentante = activeChannel.slug === "presentante";
    setIsAnunciosChannel(isAnuncios);
    setIsPresentanteChannel(isPresentante);

    const fetchContent = async () => {
      try {
        if (hasPostsFeed) {
          // Fetch posts for all channels with sorting
          const res = await fetch(`/api/community/channels/${activeChannel.id}/posts?limit=50&sort=${sortBy}`);
          const data = await res.json();
          const postsData = Array.isArray(data) ? data : [];
          setPosts(postsData);
          setSelectedPost(null);
          setComments([]);
          
          // Load comment counts, all comments, and reactions for all posts
          const counts: { [postId: string]: number } = {};
          const allComments: { [postId: string]: Comment[] } = {};
          const userReactionsMap: { [postId: string]: string[] } = {};
          const allReactionsMap: { [postId: string]: { emoji: string; count: number; users: string[] }[] } = {};
          
          for (const post of postsData) {
            try {
              // Fetch comments
              const commentsRes = await fetch(`/api/community/posts/${post.post.id}/comments`);
              const commentsData = await commentsRes.json();
              const commentsArray = Array.isArray(commentsData) ? commentsData : [];
              counts[post.post.id] = commentsArray.length;
              allComments[post.post.id] = commentsArray;
              
              // Fetch user reactions
              const userReactionsRes = await fetch(`/api/community/posts/${post.post.id}/user-reactions`, {
                credentials: "include"
              });
              const userReactionsData = await userReactionsRes.json();
              userReactionsMap[post.post.id] = Array.isArray(userReactionsData) ? userReactionsData.map((r: any) => r.emoji) : [];
              
              // Fetch all reactions
              const reactionsRes = await fetch(`/api/community/posts/${post.post.id}/reactions`);
              const reactionsData = await reactionsRes.json();
              allReactionsMap[post.post.id] = Array.isArray(reactionsData) ? reactionsData : [];
            } catch (err) {
              counts[post.post.id] = 0;
              allComments[post.post.id] = [];
              userReactionsMap[post.post.id] = [];
              allReactionsMap[post.post.id] = [];
            }
          }
          setPostCommentCounts(counts);
          setAllPostComments(allComments);
          setUserEmojis(userReactionsMap);
          setAllReactions(allReactionsMap);
        } else {
          // For non-post channels (chat channels), clear posts
          setPosts([]);
          setSelectedPost(null);
          setComments([]);
          setPostCommentCounts({});
          setAllPostComments({});
        }
      } catch (error) {
        console.error("Error fetching content:", error);
        setPosts([]);
        setPostCommentCounts({});
        setAllPostComments({});
      }
    };

    fetchContent();
  }, [activeChannel, sortBy]);

  // Fetch comments when post is selected
  useEffect(() => {
    if (!selectedPost) return;

    const fetchComments = async () => {
      try {
        const res = await fetch(`/api/community/posts/${selectedPost.post.id}/comments`);
        const data = await res.json();
        setComments(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching comments:", error);
        setComments([]);
      }
    };

    fetchComments();
  }, [selectedPost]);

  const handleSendComment = async () => {
    if (!commentInput.trim() || !selectedPost) return;

    setSendingComment(true);
    try {
      const res = await fetch(`/api/community/posts/${selectedPost.post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: commentInput }),
      });

      if (res.ok) {
        setCommentInput("");
        // Refresh comments
        const newRes = await fetch(`/api/community/posts/${selectedPost.post.id}/comments`);
        const data = await newRes.json();
        const newComments = Array.isArray(data) ? data : [];
        setComments(newComments);
        // Update the comment count and all post comments
        setPostCommentCounts(prev => ({
          ...prev,
          [selectedPost.post.id]: newComments.length
        }));
        setAllPostComments(prev => ({
          ...prev,
          [selectedPost.post.id]: newComments
        }));
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
        {/* Middle Sidebar - Channels (fixed) */}
        <div className={cn(
          "hidden lg:flex fixed left-[250px] top-0 w-[280px] h-screen bg-[#2a2a2a] overflow-y-auto flex-col transition-all duration-300 z-40",
          !channelsSidebarOpen && "lg:hidden"
        )}>
          {/* User Profile Section */}
          <div className="p-4 flex items-center gap-3 bg-[#232323] mt-[0px] mb-[0px] pl-[16px] pr-[16px] pt-[12px] pb-[12px]">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.profileImageUrl || undefined} />
              <AvatarFallback>{(user?.firstName?.charAt(0) || "U").toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-cyan-500 font-medium">● En Línea</p>
            </div>
          </div>

          {/* Search */}
          <div className="p-4 sticky top-0 z-10 bg-[#232323]">
            <Input type="search" placeholder="Buscar..." className="text-xs h-8 bg-[#1a1a1a] border-[#444444]" />
          </div>

          {/* Sections */}
          <div className="flex-1 overflow-y-auto px-2 py-3 space-y-0 bg-[#232323]">
            {orderedSections.map((section) => (
              <div key={section.title}>
                <div className="text-xs text-muted-foreground px-2 py-1 font-semibold uppercase">{section.title}</div>
                {section.channels.map((channel) => (
                  <button
                    key={channel.id}
                    onClick={() => setActiveChannel(channel)}
                    className={cn(
                      "w-full text-left px-3 py-1.5 rounded text-sm font-medium flex items-center gap-2 hover:bg-[#333333] transition-colors",
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

          </div>

        {/* Center Content - Posts Feed */}
        <div className={cn(
          "flex-1 flex flex-col overflow-hidden lg:ml-[280px]",
          selectedPost && isAnunciosChannel ? "lg:w-1/2" : ""
        )}>
          {/* Header */}
          <div className="bg-[#1a1a1a] px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
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

            {/* Sorting and Menu - only for Anuncios channel */}
            {isAnunciosChannel && (
              <div className="flex items-center gap-2">
                {/* Sort Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-xs gap-1">
                      El último
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={() => setSortBy("recent")} className={sortBy === "recent" ? "bg-[#333333]" : ""}>
                      Más reciente
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("activity")} className={sortBy === "activity" ? "bg-[#333333]" : ""}>
                      Nueva actividad
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("oldest")} className={sortBy === "oldest" ? "bg-[#333333]" : ""}>
                      Más antiguo
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("popular")} className={sortBy === "popular" ? "bg-[#333333]" : ""}>
                      Popular
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("likes")} className={sortBy === "likes" ? "bg-[#333333]" : ""}>
                      Me gusta
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("alphabetical")} className={sortBy === "alphabetical" ? "bg-[#333333]" : ""}>
                      Alfabético
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Notification Preferences Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="p-2" data-testid="notification-menu">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80 bg-[#2a2a2a] border-[#444444] p-4">
                    <div className="flex items-center gap-2 mb-4 pb-4 border-b border-[#444444]">
                      <Bell className="h-4 w-4 text-cyan-500" />
                      <span className="font-semibold text-white">Mi preferencia de notificaciones</span>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id="email-notif-dd"
                          checked={notificationPrefs.emailNotifications}
                          onCheckedChange={(checked) => {
                            setNotificationPrefs(prev => ({
                              ...prev,
                              emailNotifications: checked as boolean
                            }));
                          }}
                          className="border-[#555555]"
                        />
                        <Label htmlFor="email-notif-dd" className="cursor-pointer text-sm text-gray-200">
                          Notificaciones por Email
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id="app-notif-dd"
                          checked={notificationPrefs.inAppNotifications}
                          onCheckedChange={(checked) => {
                            setNotificationPrefs(prev => ({
                              ...prev,
                              inAppNotifications: checked as boolean
                            }));
                          }}
                          className="border-[#555555]"
                        />
                        <Label htmlFor="app-notif-dd" className="cursor-pointer text-sm text-gray-200">
                          Notificaciones en la App
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id="mobile-notif-dd"
                          checked={notificationPrefs.mobileNotifications}
                          onCheckedChange={(checked) => {
                            setNotificationPrefs(prev => ({
                              ...prev,
                              mobileNotifications: checked as boolean
                            }));
                          }}
                          className="border-[#555555]"
                        />
                        <Label htmlFor="mobile-notif-dd" className="cursor-pointer text-sm text-gray-200">
                          Notificaciones Móvil
                        </Label>
                      </div>
                      <Button
                        className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-semibold mt-6 h-8 text-sm"
                        onClick={async () => {
                          try {
                            const res = await fetch("/api/user/notification-preferences", {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              credentials: "include",
                              body: JSON.stringify(notificationPrefs),
                            });
                            if (res.ok) {
                              toast({ title: "Éxito", description: "Preferencias guardadas" });
                            } else {
                              toast({ title: "Error", description: "No se pudieron guardar las preferencias", variant: "destructive" });
                            }
                          } catch (error) {
                            toast({ title: "Error", description: "Error al guardar preferencias", variant: "destructive" });
                          }
                        }}
                      >
                        Guardar Preferencias
                      </Button>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>

          {/* Posts Feed - For all Comunidad section channels */}
          {posts.length > 0 || activeChannel?.section === "Comunidad" ? (
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 max-w-4xl mx-auto w-full">
              {/* Inicia una publicación - solo para Presentante */}
              {isPresentanteChannel && (
                <div className="border border-[#333333] rounded-lg p-4 bg-[#1a1a1a] flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user?.profileImageUrl || undefined} />
                    <AvatarFallback>{(user?.firstName?.charAt(0) || "U").toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Inicia una publicación"
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      className="flex-1 bg-[#232323] border border-[#333333] rounded px-3 py-2 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-cyan-500"
                      data-testid="new-post-input"
                    />
                    <Button
                      size="sm"
                      onClick={async () => {
                        if (!newPostContent.trim()) return;
                        setCreatingPost(true);
                        try {
                          const res = await fetch(`/api/community/channels/${activeChannel?.id}/posts`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            credentials: "include",
                            body: JSON.stringify({
                              title: "",
                              content: newPostContent,
                            }),
                          });
                          if (res.ok) {
                            setNewPostContent("");
                            // Refetch posts
                            const postsRes = await fetch(`/api/community/channels/${activeChannel?.id}/posts?limit=50&sort=${sortBy}`);
                            const postsData = await postsRes.json();
                            setPosts(Array.isArray(postsData) ? postsData : []);
                            toast({ title: "Éxito", description: "Publicación creada" });
                          }
                        } catch (error) {
                          toast({ title: "Error", description: "No se pudo crear la publicación", variant: "destructive" });
                        } finally {
                          setCreatingPost(false);
                        }
                      }}
                      disabled={creatingPost || !newPostContent.trim()}
                      className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold"
                      data-testid="create-post-button"
                    >
                      {creatingPost ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              )}
              {posts.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p>No hay anuncios. Vuelve pronto.</p>
                </div>
              ) : (
                posts.map((post) => {
                  const postCommentCount = postCommentCounts[post.post.id] || 0;
                  const postComments = allPostComments[post.post.id] || [];
                  const isExpanded = expandedPostId === post.post.id;
                  const isAccordionChannel = activeChannel?.slug === 'empieza-aqui';
                  
                  return (
                    <div
                      key={post.post.id}
                      className={cn(
                        "rounded-lg border transition-colors",
                        isAccordionChannel 
                          ? "border-[#333333] bg-[#1a1a1a]" 
                          : cn(
                              "p-4 border-[#333333] bg-[#1a1a1a] cursor-pointer hover:border-[#555555]",
                              selectedPost?.post.id === post.post.id && "border-cyan-500 bg-[#1a2a2a]"
                            )
                      )}
                      data-testid={`post-${post.post.id}`}
                    >
                      {/* Acordeón header - solo para Empieza aquí */}
                      {isAccordionChannel && (
                        <button
                          onClick={() => setExpandedPostId(isExpanded ? null : post.post.id)}
                          className="w-full text-left p-4 hover:bg-[#222222] transition-colors flex items-center justify-between"
                        >
                          <div>
                            <h3 className="font-bold text-white">{post.post.title}</h3>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(post.post.createdAt).toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}
                            </p>
                          </div>
                          <ChevronDown className={cn("h-5 w-5 transition-transform", isExpanded && "rotate-180")} />
                        </button>
                      )}
                      {/* Contenido - mostrar si no es accordion O si está expandido */}
                      {!isAccordionChannel || isExpanded ? (
                        <>
                          {!isAccordionChannel && (
                            <>
                              {/* Fecha */}
                              <p className="text-xs text-muted-foreground mb-3">
                                {new Date(post.post.createdAt).toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}
                              </p>

                              {/* Título */}
                              <h3 className="font-bold text-white mb-3">{post.post.title}</h3>
                            </>
                          )}

                          {isAccordionChannel && <div className="border-t border-[#333333] px-4 py-3" />}

                          {/* Renderizar bloques si existen */}
                          {post.post.contentBlocks && post.post.contentBlocks.length > 0 ? (
                            <div className={cn("space-y-3 mb-3", isAccordionChannel && "px-4")}>
                              {post.post.contentBlocks.map((block: any, idx: number) => {
                                if (block.type === "text") {
                                  return (
                                    <div key={idx} className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                                      {block.content && block.content.split(/(\bhttps?:\/\/[^\s]+)/g).map((part: string, i: number) => {
                                        if (part.match(/^\bhttps?:\/\//)) {
                                          return (
                                            <a
                                              key={i}
                                              href={part}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-cyan-500 hover:text-cyan-400 underline break-all"
                                            >
                                              {part}
                                            </a>
                                          );
                                        }
                                        return part;
                                      })}
                                    </div>
                                  );
                                } else if (block.type === "video") {
                                  const isYouTube = /youtu\.be\/|youtube\.com/i.test(block.url);
                                  const isVimeo = /vimeo\.com/i.test(block.url);
                                  
                                  if (isYouTube || isVimeo) {
                                    return (
                                      <div key={idx} className="w-full rounded overflow-hidden bg-black border-2 border-cyan-500">
                                        <div style={{ position: "relative", paddingBottom: "56.25%", height: 0 }}>
                                          <iframe
                                            style={{
                                              position: "absolute",
                                              top: 0,
                                              left: 0,
                                              width: "100%",
                                              height: "100%",
                                            }}
                                            src={block.url.replace(/youtu\.be\//, "youtube.com/embed/").replace(/vimeo\.com\//, "vimeo.com/video/")}
                                            frameBorder="0"
                                            allowFullScreen
                                            title="Video"
                                          ></iframe>
                                        </div>
                                      </div>
                                    );
                                  }
                                } else if (block.type === "image") {
                                  return (
                                    <img key={idx} src={block.url} alt="" className="w-full max-h-96 object-contain rounded border-2 border-cyan-500" />
                                  );
                                }
                                return null;
                              })}
                            </div>
                          ) : (
                            <>
                              {post.post.videoUrl && (() => {
                                const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(post.post.videoUrl);
                                const isYouTube = /youtu\.be\/|youtube\.com/i.test(post.post.videoUrl);
                                const isVimeo = /vimeo\.com/i.test(post.post.videoUrl);
                                
                                if (isImage) {
                                  return <img src={post.post.videoUrl} alt="" className="w-full max-h-96 object-contain rounded mb-3 border-2 border-cyan-500" />;
                                }
                                
                                if (isYouTube || isVimeo) {
                                  return (
                                    <div className="w-full mb-3 rounded overflow-hidden bg-black border-2 border-cyan-500">
                                      <div style={{ position: "relative", paddingBottom: "56.25%", height: 0 }}>
                                        <iframe
                                          style={{
                                            position: "absolute",
                                            top: 0,
                                            left: 0,
                                            width: "100%",
                                            height: "100%",
                                          }}
                                          src={post.post.videoUrl.replace(/youtu\.be\//, "youtube.com/embed/").replace(/vimeo\.com\//, "vimeo.com/video/")}
                                          frameBorder="0"
                                          allowFullScreen
                                          title="Video"
                                        ></iframe>
                                      </div>
                                    </div>
                                  );
                                }
                                
                                return null;
                              })()}

                              {post.post.imageUrl && (
                                <img src={post.post.imageUrl} alt="" className="w-full max-h-96 object-contain rounded mb-3" />
                              )}

                              {/* Contenido legacy - solo si no hay contentBlocks */}
                              {(!post.post.contentBlocks || post.post.contentBlocks.length === 0) && (
                                <div className={cn("text-sm text-muted-foreground mb-3 whitespace-pre-wrap break-words", isAccordionChannel && "px-4")}>
                                  {post.post.content.split(/(\bhttps?:\/\/[^\s]+)/g).map((part, idx) => {
                                    if (part.match(/^\bhttps?:\/\//)) {
                                      return (
                                        <a
                                          key={idx}
                                          href={part}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-cyan-500 hover:text-cyan-400 underline break-all"
                                        >
                                          {part}
                                        </a>
                                      );
                                    }
                                    return part;
                                  })}
                                </div>
                              )}
                            </>
                          )}
                        </>
                      ) : null}
                      {/* Header con nombre y hora - solo para canales que no son accordion */}
                      {!isAccordionChannel && (
                        <div className="flex items-center gap-2 mb-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={post.user?.profileImageUrl || undefined} />
                            <AvatarFallback>{(post.user?.firstName?.charAt(0) || "U").toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="text-sm">
                            <p className="font-semibold text-white">
                              {post.user?.firstName} {post.user?.lastName}{" "}
                              <span className="text-xs text-muted-foreground font-normal">
                                {new Date(post.post.createdAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </p>
                          </div>
                        </div>
                      )}
                      {/* Acciones - solo para canales que no son accordion */}
                      {!isAccordionChannel && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                          <div className="relative">
                            <button 
                              onClick={() => setOpenReactionPostId(openReactionPostId === post.post.id ? null : post.post.id)}
                              disabled={(userEmojis[post.post.id] || []).length >= 3}
                              className={cn(
                                "flex items-center gap-1 transition-colors",
                                (userEmojis[post.post.id] || []).length >= 3 
                                  ? "text-muted-foreground cursor-not-allowed opacity-50" 
                                  : "hover:text-cyan-500"
                              )}
                            >
                              <Smile className="h-4 w-4" />
                              Reaccionar
                            </button>
                          {/* Emoji selector popup - visible when open */}
                          {openReactionPostId === post.post.id && (
                            <div className="absolute bottom-full left-0 mb-2 bg-[#2a2a2a] border border-[#444444] rounded-lg p-2 grid grid-cols-5 gap-1 w-56 z-50 shadow-lg">
                              {["👍", "❤️", "😂", "😮", "🎉", "🔥", "🍊", "🌟", "👏", "🎯"].map((emoji) => {
                                const hasEmoji = (userEmojis[post.post.id] || []).includes(emoji);
                                const userReactionsCount = (userEmojis[post.post.id] || []).length;
                                const canAdd = hasEmoji || userReactionsCount < 3;
                                
                                return (
                                  <button
                                    key={emoji}
                                    onClick={() => {
                                      addReactionMutation.mutate({
                                        postId: post.post.id,
                                        emoji,
                                      });
                                    }}
                                    disabled={!canAdd}
                                    className={cn(
                                      "text-2xl transition-transform",
                                      hasEmoji ? "ring-2 ring-cyan-500 rounded-lg scale-110" : "",
                                      canAdd ? "hover:scale-125 cursor-pointer" : "opacity-30 cursor-not-allowed"
                                    )}
                                  >
                                    {emoji}
                                  </button>
                                );
                              })}
                            </div>
                            )}
                          </div>
                        
                        {/* Show all reactions */}
                        {(allReactions[post.post.id] || []).length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap">
                            {(allReactions[post.post.id] || []).map((reaction, idx) => {
                              const isUserReaction = (userEmojis[post.post.id] || []).includes(reaction.emoji);
                              return (
                                <button
                                  key={idx}
                                  onClick={() => {
                                    addReactionMutation.mutate({
                                      postId: post.post.id,
                                      emoji: reaction.emoji,
                                    });
                                  }}
                                  className={cn(
                                    "text-sm px-2 py-1 rounded-full transition-all cursor-pointer bg-[#292929]",
                                    isUserReaction 
                                      ? "text-white" 
                                      : "text-muted-foreground hover:text-white"
                                  )}
                                >
                                  {reaction.emoji} {reaction.count}
                                </button>
                              );
                            })}
                          </div>
                        )}
                        <button
                          onClick={() => {
                            if (selectedPost?.post.id === post.post.id) {
                              setSelectedPost(null);
                            } else {
                              setSelectedPost(post);
                            }
                          }}
                          className={cn(
                            "flex items-center gap-2 transition-colors",
                            selectedPost?.post.id === post.post.id ? "text-cyan-500" : "text-muted-foreground hover:text-cyan-500"
                          )}
                          data-testid={`view-comments-${post.post.id}`}
                        >
                          {postCommentCount > 0 && (
                            <div className="flex items-center -space-x-2">
                              {postComments.slice(0, 3).map((comment, idx) => (
                                <Avatar key={idx} className="h-5 w-5 border border-[#1a1a1a]">
                                  <AvatarImage src={comment.user?.profileImageUrl || undefined} />
                                  <AvatarFallback className="text-xs">{(comment.user?.firstName?.charAt(0) || "U").toUpperCase()}</AvatarFallback>
                                </Avatar>
                              ))}
                            </div>
                          )}
                          <span>{postCommentCount} respuesta{postCommentCount !== 1 ? "s" : ""}</span>
                        </button>
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

        {/* Right Sidebar - Comments (for all channels except empieza-aqui when post selected) */}
        {!isAccordionChannel && selectedPost && (
          <div className="hidden lg:flex w-1/3 flex-col border-l border-[#333333] bg-[#1a1a1a] overflow-hidden">
            {/* Header con fecha del post */}
            <div className="border-b border-[#333333] px-6 py-4 text-center">
              <p className="text-xs text-muted-foreground mb-3">
                {new Date(selectedPost.post.createdAt).toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>

            {/* Comments Header */}
            <div className="border-b border-[#333333] px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Comentarios</h2>
                <p className="text-xs text-muted-foreground mt-1">{comments.length} comentarios</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedPost(null)}
                className="h-8 w-8 p-0"
                data-testid="close-comments"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {comments.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  <p>Sin comentarios aún. ¡Sé el primero!</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.comment.id} className="flex gap-3">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={comment.user?.profileImageUrl || undefined} />
                      <AvatarFallback>{(comment.user?.firstName?.charAt(0) || "U").toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-white">
                          {comment.user?.firstName} {comment.user?.lastName}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {new Date(comment.comment.createdAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground break-words mt-1">{comment.comment.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Comment Input */}
            <div className="border-t border-[#333333] bg-[#1a1a1a] px-6 py-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Escribe un comentario..."
                  className="bg-[#2a2a2a] border-[#444444] text-white text-sm"
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendComment()}
                  data-testid="comment-input"
                />
                <Button
                  onClick={handleSendComment}
                  disabled={sendingComment || !commentInput.trim()}
                  className="bg-cyan-500 hover:bg-cyan-600 px-3"
                  size="sm"
                  data-testid="send-comment-button"
                >
                  {sendingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
      <MobileNav />
    </div>
  );
}
