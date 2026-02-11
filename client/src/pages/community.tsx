import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useSimpleAuth } from "@/hooks/use-simple-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Loader2, Menu, Heart, MessageCircle, X, Smile, ChevronDown, MoreVertical, Bell, Plus, Trash2, Pin, Paperclip, Music, AtSign, Trophy, Medal, Award, HelpCircle, Lock, Radio } from "lucide-react";
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
import { Card, CardContent } from "@/components/ui/card";

interface Channel {
  id: string;
  slug: string;
  name: string;
  description?: string;
  icon: string;
  section: string;
  isReadOnly?: boolean;
}

interface LiveEvent {
  id: string;
  title: string;
  hostName: string;
  hostAvatar?: string;
  joinUrl: string;
  isLive: boolean;
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
  reactions?: Array<{
    emoji: string;
    count: number;
    users?: string[];
  }>;
}

interface Message {
  id: string;
  channelId: string;
  userId: string;
  content: string;
  isPinned?: boolean;
  attachments?: Array<{type: string; url: string; name?: string}>;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
  } | null;
}

// Global storage for drafts - using a data attribute on document.body
const DRAFT_ATTR = 'data-community-drafts';

function getDraftsFromBody(): Record<string, string> {
  try {
    const data = document.body.getAttribute(DRAFT_ATTR);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

function saveDraftsToBody(drafts: Record<string, string>) {
  document.body.setAttribute(DRAFT_ATTR, JSON.stringify(drafts));
}

function setDraft(channelId: string, value: string) {
  const drafts = getDraftsFromBody();
  drafts[channelId] = value;
  saveDraftsToBody(drafts);
}

function getDraft(channelId: string): string {
  const drafts = getDraftsFromBody();
  return drafts[channelId] || "";
}

function deleteDraft(channelId: string) {
  const drafts = getDraftsFromBody();
  if (drafts[channelId]) {
    delete drafts[channelId];
    saveDraftsToBody(drafts);
  }
}


export default function Community() {
  const { isAuthenticated, user } = useSimpleAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeChannel, setActiveChannelState] = useState<Channel | null>(null);
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
  const [isDudasChannel, setIsDudasChannel] = useState(false);
  const [pinnedPosts, setPinnedPosts] = useState<Post[]>([]);
  const [commentReactions, setCommentReactions] = useState<{ [commentId: string]: { emoji: string; count: number; users: string[] }[] }>({});
  const [openReactionCommentId, setOpenReactionCommentId] = useState<string | null>(null);
  const [userCommentEmojis, setUserCommentEmojis] = useState<{ [commentId: string]: string[] }>({});
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const messageInputRef = useRef("");
  const activeChannelRef = useRef<Channel | null>(null);
  
  // Keep activeChannelRef in sync
  useEffect(() => {
    activeChannelRef.current = activeChannel;
  }, [activeChannel]);
  
  // Custom handler for changing channel
  const setActiveChannel = (channel: Channel | null) => {
    setActiveChannelState(channel);
  };
  const lastChannelIdRef = useRef<string | null>(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [isRedesChatChannel, setIsRedesChatChannel] = useState(false);
  const [isLeaderboardChannel, setIsLeaderboardChannel] = useState(false);
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<"7_days" | "30_days" | "all_time">("7_days");
  const [pointsInfoOpen, setPointsInfoOpen] = useState(false);
  const [onlineMembers, setOnlineMembers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [liveEvent, setLiveEvent] = useState<LiveEvent | null>(null);

  // Query for live events
  const { data: liveEventData } = useQuery({
    queryKey: ['/api/community/live-event'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/community/live-event', { credentials: 'include' });
        if (!res.ok) return null;
        return res.json();
      } catch {
        return null;
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds to check for live events
  });

  // Update live event state when data changes
  useEffect(() => {
    if (liveEventData && liveEventData.isLive) {
      // Real live event from API
      setLiveEvent({
        id: liveEventData.id,
        title: liveEventData.title,
        hostName: liveEventData.hostName,
        hostAvatar: liveEventData.hostAvatar,
        joinUrl: liveEventData.joinUrl || `/live/${liveEventData.id}`,
        isLive: true,
      });
    } else {
      // No live event currently
      setLiveEvent(null);
    }
  }, [liveEventData]);

  // Leaderboard constants
  const LEVELS = [
    { level: 1, points: 0 },
    { level: 2, points: 100 },
    { level: 3, points: 200 },
    { level: 4, points: 400 },
    { level: 5, points: 1200 },
    { level: 6, points: 2400 },
    { level: 7, points: 4800 },
    { level: 8, points: 7200 },
    { level: 9, points: 10400 },
  ];

  const getPointsForNextLevel = (currentLevel: number, currentPoints: number): number => {
    const nextLevel = LEVELS.find(l => l.level === currentLevel + 1);
    if (!nextLevel) return 0;
    return Math.max(0, nextLevel.points - currentPoints);
  };

  // Leaderboard queries
  const { data: leaderboard, isLoading: leaderboardLoading } = useQuery({
    queryKey: ['/api/community/leaderboard', leaderboardPeriod],
    enabled: isLeaderboardChannel,
    queryFn: async () => {
      const response = await fetch(`/api/community/leaderboard?period=${leaderboardPeriod}`);
      if (!response.ok) throw new Error('Failed to fetch leaderboard');
      return response.json();
    },
  });

  const { data: userStats } = useQuery({
    queryKey: ['/api/community/users/stats', user?.id],
    enabled: !!user?.id && isLeaderboardChannel,
    queryFn: async () => {
      const response = await fetch(`/api/community/users/${user?.id}/stats`);
      if (!response.ok) throw new Error('Failed to fetch user stats');
      return response.json();
    },
  });
  const [messageReactions, setMessageReactions] = useState<{ [messageId: string]: { emoji: string; count: number; users: string[] }[] }>({});
  const [userMessageEmojis, setUserMessageEmojis] = useState<{ [messageId: string]: string[] }>({});
  const [openReactionMessageId, setOpenReactionMessageId] = useState<string | null>(null);
  const [showMessageEmojiToolbar, setShowMessageEmojiToolbar] = useState(false);
  const [selectedProfileUser, setSelectedProfileUser] = useState<any | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [activeProfileTab, setActiveProfileTab] = useState("about");
  const [profileUserStats, setProfileUserStats] = useState<any | null>(null);
  const [loadingUserStats, setLoadingUserStats] = useState(false);
  const isAccordionChannel = activeChannel?.slug === 'empieza-aqui';

  // Fetch user posts and comments
  const { data: userPosts, isLoading: loadingUserPosts } = useQuery({
    queryKey: ['/api/community/users/posts', selectedProfileUser?.id],
    enabled: !!selectedProfileUser?.id && activeProfileTab === "posts",
    queryFn: async () => {
      const response = await fetch(`/api/community/users/${selectedProfileUser.id}/posts`);
      if (!response.ok) throw new Error('Failed to fetch user posts');
      return response.json();
    },
  });

  const { data: userComments, isLoading: loadingUserComments } = useQuery({
    queryKey: ['/api/community/users/comments', selectedProfileUser?.id],
    enabled: !!selectedProfileUser?.id && activeProfileTab === "comments",
    queryFn: async () => {
      const response = await fetch(`/api/community/users/${selectedProfileUser.id}/comments`);
      if (!response.ok) throw new Error('Failed to fetch user comments');
      return response.json();
    },
  });

  const { data: userRewards, isLoading: loadingUserRewards } = useQuery({
    queryKey: ['/api/community/users/rewards', selectedProfileUser?.id],
    enabled: !!selectedProfileUser?.id && activeProfileTab === "rewards",
    queryFn: async () => {
      const response = await fetch(`/api/community/users/${selectedProfileUser.id}/rewards`);
      if (!response.ok) throw new Error('Failed to fetch user rewards');
      return response.json();
    },
  });

  // Function to open user profile
  const handleOpenProfile = async (user: any) => {
    setSelectedProfileUser(user);
    setProfileDialogOpen(true);
    setActiveProfileTab("about");
    setProfileUserStats(null);
    setLoadingUserStats(true);
    
    // Fetch user statistics
    try {
      const response = await fetch(`/api/community/users/${user.id}/stats`);
      if (response.ok) {
        const stats = await response.json();
        setProfileUserStats(stats);
        // Merge stats with user data
        setSelectedProfileUser((prev: any) => ({ ...prev, ...stats }));
      }
    } catch (error) {
      console.error("Error fetching user stats:", error);
    } finally {
      setLoadingUserStats(false);
    }
  };

  // Store post ID to navigate to after channel loads
  const postToNavigateRef = useRef<string | null>(null);

  // Function to navigate to post from comment
  const handleNavigateToPost = async (commentItem: any) => {
    if (!commentItem.post || !commentItem.channel) return;
    
    // Close profile dialog
    setProfileDialogOpen(false);
    
    // Find the channel
    const targetChannel = channels.find(c => c.id === commentItem.channel.id || c.slug === commentItem.channel.slug);
    if (!targetChannel) {
      toast({ title: "Error", description: "No se pudo encontrar el canal", variant: "destructive" });
      return;
    }
    
    // Store the post ID to navigate to
    postToNavigateRef.current = commentItem.post.id;
    
    // Switch to the channel (this will trigger the useEffect that loads posts)
    setActiveChannel(targetChannel);
  };

  // Effect to navigate to post after channel and posts are loaded
  useEffect(() => {
    if (!postToNavigateRef.current || !activeChannel || posts.length === 0) return;
    
    const targetPostId = postToNavigateRef.current;
    const targetPost = posts.find((p: Post) => p.post.id === targetPostId);
    
    if (targetPost) {
      setSelectedPost(targetPost);
      postToNavigateRef.current = null; // Clear the ref
      
      // Scroll to the post after a short delay
      setTimeout(() => {
        const postElement = document.querySelector(`[data-testid="post-${targetPost.post.id}"]`);
        if (postElement) {
          postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    }
  }, [activeChannel, posts]);

  // Function to calculate time since last seen
  const getTimeSinceLastSeen = (lastLoginAt: string | null | undefined): string => {
    if (!lastLoginAt) return "Nunca";
    const now = Date.now();
    const lastSeen = new Date(lastLoginAt).getTime();
    const diffMinutes = Math.floor((now - lastSeen) / 60000);
    
    if (diffMinutes < 1) return "Hace menos de un minuto";
    if (diffMinutes < 60) return `Hace ${diffMinutes} minutos`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `Hace ${diffHours} horas`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `Hace ${diffDays} días`;
    const diffMonths = Math.floor(diffDays / 30);
    return `Hace ${diffMonths} meses`;
  };


  // Group comments by date (oldest to newest)
  const groupCommentsByDate = (comments: Comment[]) => {
    const sorted = [...comments].reverse(); // Reverse to show oldest first
    const grouped: { [date: string]: Comment[] } = {};
    sorted.forEach(comment => {
      const date = new Date(comment.comment.createdAt).toLocaleDateString("es-ES", { 
        year: "numeric", 
        month: "long", 
        day: "numeric" 
      });
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(comment);
    });
    // Sort the dates in ascending order (oldest to newest)
    const sortedKeys = Object.keys(grouped).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    const orderedGrouped: { [date: string]: Comment[] } = {};
    sortedKeys.forEach(date => {
      orderedGrouped[date] = grouped[date];
    });
    return orderedGrouped;
  };

  // Group messages by date (oldest to newest) and separate pinned messages
  const groupMessagesByDate = (msgs: Message[]) => {
    const pinned = msgs.filter(m => m.isPinned);
    const unpinned = msgs.filter(m => !m.isPinned);
    
    const grouped: { [date: string]: Message[] } = {};
    unpinned.forEach(message => {
      if (!message.createdAt) return;
      const dateObj = new Date(message.createdAt);
      if (isNaN(dateObj.getTime())) return; // Skip invalid dates
      
      const date = dateObj.toLocaleDateString("es-ES", { 
        year: "numeric", 
        month: "long", 
        day: "numeric" 
      });
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(message);
    });
    
    const sortedKeys = Object.keys(grouped).sort((a, b) => {
      const dateA = new Date(a).getTime();
      const dateB = new Date(b).getTime();
      if (isNaN(dateA) || isNaN(dateB)) return 0;
      return dateA - dateB;
    });
    const orderedGrouped: { [date: string]: Message[] } = {};
    sortedKeys.forEach(date => {
      orderedGrouped[date] = grouped[date];
    });
    
    return { pinned, grouped: orderedGrouped };
  };

  // Mutation for adding/removing reactions
  const addReactionMutation = useMutation({
    mutationFn: async ({ postId, emoji }: { postId: string; emoji: string }) => {
      const token = localStorage.getItem('simpleAuthToken');
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      const res = await fetch(`/api/community/posts/${postId}/reactions`, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({ emoji }),
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to add reaction: ${res.status} ${errorText}`);
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

  
  // Restore draft when channel changes
  useEffect(() => {
    if (!activeChannel) return;
    
    const savedDraft = getDraft(activeChannel.id);
    setMessageInput(savedDraft);
    messageInputRef.current = savedDraft;
  }, [activeChannel?.id]);

  // Fetch content when channel changes
  useEffect(() => {
    if (!activeChannel) return;

    // Check if this channel should show posts (all "Comunidad" section channels show posts EXCEPT redes-chat and leaderboard)
    // Also include "Cursos de Salas" section channels (like "Dudas - Vibe Coding")
    const isChatChannel = activeChannel.slug === "redes-chat";
    const isLeaderboard = activeChannel.slug === "leaderboard" || activeChannel.slug === "clasificacion";
    const hasPostsFeed = !isChatChannel && !isLeaderboard && (activeChannel.section === "Comunidad" || activeChannel.section === "Cursos de Salas");
    const isAnuncios = activeChannel.slug === "anuncios";
    const isPresentante = activeChannel.slug === "presentante" || activeChannel.slug === "comparte-proyecto";
    const isDudas = activeChannel?.slug?.startsWith('dudas-') || activeChannel?.section === 'Cursos de Salas';
    setIsAnunciosChannel(isAnuncios);
    setIsPresentanteChannel(isPresentante);
    setIsDudasChannel(isDudas);
    setIsLeaderboardChannel(isLeaderboard);
    setIsRedesChatChannel(isChatChannel);

    const fetchContent = async () => {
      try {
        if (isChatChannel) {
          // Fetch all users FIRST - this is needed for the sidebar
          try {
            console.log("Fetching all users for sidebar...");
            const usersRes = await fetch("/api/community/users", {
              headers: {
                'Content-Type': 'application/json',
              },
            });
            
            if (!usersRes.ok) {
              const errorText = await usersRes.text();
              console.error("Failed to fetch users:", usersRes.status, usersRes.statusText, errorText);
              setAllUsers([]);
            } else {
              const contentType = usersRes.headers.get("content-type");
              if (!contentType || !contentType.includes("application/json")) {
                const text = await usersRes.text();
                console.error("Response is not JSON, got:", text.substring(0, 200));
                setAllUsers([]);
              } else {
                const allUsersData = await usersRes.json();
                const usersArray = Array.isArray(allUsersData) ? allUsersData : [];
                // Remove duplicates by ID
                const uniqueUsers = usersArray.filter((u: any, index: number, self: any[]) => 
                  index === self.findIndex((user: any) => user.id === u.id)
                );
                console.log("Fetched users:", usersArray.length, "unique:", uniqueUsers.length);
                // Set users immediately, we'll sort them after getting online status
                setAllUsers(uniqueUsers);
              }
            }
          } catch (error) {
            console.error("Error fetching all users:", error);
            if (error instanceof Error) {
              console.error("Error details:", error.message, error.stack);
            }
            setAllUsers([]);
          }
          
          // Fetch messages for chat channels
          const res = await fetch(`/api/community/channels/${activeChannel.id}/messages?limit=100`);
          const data = await res.json();
          const rawMessages = Array.isArray(data) ? data : [];
          // Transform messages from { message: {...}, user: {...} } to flat structure
          const messagesData = rawMessages.map((item: any) => ({
            ...item.message,
            user: item.user
          }));
          setMessages(messagesData);
          // Get unique users from messages and include current user
          const uniqueUsers = messagesData.map((msg: any) => msg.user).filter((u: any, i: number, arr: any[]) => u && arr.findIndex(x => x?.id === u.id) === i);
          // Always include current user as online
          const onlineUsers = user && !uniqueUsers.find((u: any) => u?.id === user.id) 
            ? [user as any, ...uniqueUsers] 
            : uniqueUsers.length > 0 ? uniqueUsers : (user ? [user as any] : []);
          setOnlineMembers(onlineUsers);
          
          // Now update allUsers with online status and sort
          setAllUsers(prevUsers => {
            if (prevUsers.length === 0) return prevUsers;
            // Remove duplicates again (just in case)
            const uniqueUsers = prevUsers.filter((u, index, self) => 
              index === self.findIndex(user => user.id === u.id)
            );
            const onlineUserIds = new Set(onlineUsers.map(u => u?.id));
            const sortedUsers = [...uniqueUsers].sort((a, b) => {
              const aIsOnline = onlineUserIds.has(a.id);
              const bIsOnline = onlineUserIds.has(b.id);
              if (aIsOnline !== bIsOnline) {
                return aIsOnline ? -1 : 1; // Online users first
              }
              // Then sort alphabetically by name
              const aName = `${a.firstName || ''} ${a.lastName || ''}`.trim();
              const bName = `${b.firstName || ''} ${b.lastName || ''}`.trim();
              return aName.localeCompare(bName);
            });
            console.log("Updated allUsers with online status:", sortedUsers.length, "online:", onlineUsers.length);
            return sortedUsers;
          });
        } else if (hasPostsFeed) {
          // Fetch posts for all channels with sorting
          const res = await fetch(`/api/community/channels/${activeChannel.id}/posts?limit=50&sort=${sortBy}`);
          const data = await res.json();
          const postsData = Array.isArray(data) ? data : [];
          setPosts(postsData);
          setSelectedPost(null);
          setComments([]);
          
          // Fetch pinned posts for Dudas channels
          if (isDudas) {
            try {
              const pinnedRes = await fetch(`/api/community/channels/${activeChannel.id}/pinned-posts`);
              if (pinnedRes.ok) {
                const pinnedData = await pinnedRes.json();
                setPinnedPosts(Array.isArray(pinnedData) ? pinnedData : []);
              } else {
                setPinnedPosts([]);
              }
            } catch (error) {
              console.error("Error fetching pinned posts:", error);
              setPinnedPosts([]);
            }
          } else {
            setPinnedPosts([]);
          }
          
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
          setMessages([]);
          setOnlineMembers([]);
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
        // First, fetch community post comments
        const res = await fetch(`/api/community/posts/${selectedPost.post.id}/comments`);
        const data = await res.json();
        let comments = Array.isArray(data) ? data : [];
        
        // Check if post has lesson metadata - if so, add the original question as first comment
        const contentBlocks = selectedPost.post.contentBlocks || [];
        const metadataBlock = contentBlocks.find((block: any) => block.type === "metadata" && block.lessonId);
        
        if (metadataBlock && metadataBlock.lessonId) {
          // Add the original post content as the first "comment" in the thread
          // This represents the question asked from the lesson
          const originalQuestion = {
            comment: {
              id: `post-${selectedPost.post.id}`, // Use a unique ID for the post
              content: selectedPost.post.content,
              createdAt: selectedPost.post.createdAt,
              userId: selectedPost.post.userId,
              postId: selectedPost.post.id,
              isOriginalPost: true, // Mark as original post
            },
            user: selectedPost.user || null,
          };
          
          // Put the original question first, then the replies
          comments = [originalQuestion, ...comments];
        }
        
        setComments(comments);
        
        // Load reactions for each comment
        const reactionsMap: { [commentId: string]: { emoji: string; count: number; users: string[] }[] } = {};
        for (const comment of comments) {
          try {
            // Only fetch reactions for community comments (not lesson comments)
            if (!comment.comment.lessonId) {
              const reactionsRes = await fetch(`/api/community/comments/${comment.comment.id}/reactions`);
              const reactions = await reactionsRes.json();
              reactionsMap[comment.comment.id] = Array.isArray(reactions) ? reactions : [];
            }
          } catch (error) {
            console.error("Error fetching reactions:", error);
            reactionsMap[comment.comment.id] = [];
          }
        }
        setCommentReactions(reactionsMap);
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
        const errorData = await res.json();
        if (errorData.requiresEmailVerification || errorData.message?.includes('verificar tu email')) {
          toast({
            title: "Email no verificado",
            description: "Debes verificar tu email para comentar. Revisa tu bandeja de entrada o ve a tu perfil.",
            variant: "destructive",
          });
          setLocation('/profile');
        } else {
          toast({
            title: "Error",
            description: errorData.message || "No se pudo publicar el comentario",
            variant: "destructive",
          });
        }
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
      <div className={cn("md:ml-16 lg:ml-[250px] min-h-screen flex overflow-hidden transition-all", !isAccordionChannel && selectedPost && "lg:mr-[420px]")}>
        {/* Middle Sidebar - Channels (fixed) */}
        <div className={cn(
          "hidden lg:flex fixed left-[250px] top-0 w-[280px] h-screen bg-[#2a2a2a] overflow-y-auto flex-col transition-all duration-300 z-40",
          !channelsSidebarOpen && "lg:hidden"
        )}>
          {/* User Profile Section */}
          <div className="p-4 flex items-center gap-3 bg-[#232323] mt-[0px] mb-[0px] pl-[16px] pr-[16px] pt-[12px] pb-[12px]">
            <Avatar className="h-10 w-10">
              <AvatarImage src={(user as any)?.profileImageUrl || undefined} />
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

          {/* Live Event Section */}
          {liveEvent && liveEvent.isLive && (
            <div className="p-3 bg-[#1a1a1a] border-t border-[#333333]">
              <div className="bg-gradient-to-br from-[#2a2a4a] to-[#1a1a2e] rounded-lg p-3 border border-[#3a3a5a]">
                {/* Host info with LIVE badge */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="relative">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={liveEvent.hostAvatar} />
                      <AvatarFallback className="bg-[#4a4a6a] text-white text-xs">
                        {liveEvent.hostName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-300 truncate">{liveEvent.hostName}</span>
                      <span className="flex items-center gap-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                        <Radio className="h-2.5 w-2.5 animate-pulse" />
                        LIVE
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Event title */}
                <h4 className="text-sm font-medium text-white mb-3 line-clamp-2">
                  {liveEvent.title}
                </h4>
                
                {/* Join button */}
                <a 
                  href={liveEvent.joinUrl}
                  className="block w-full bg-cyan-500 hover:bg-cyan-600 text-black text-sm font-semibold py-2 px-4 rounded-lg text-center transition-colors"
                >
                  Join
                </a>
              </div>
            </div>
          )}

          </div>

        {/* Center Content - Posts Feed */}
        <div className={cn(
          "flex-1 flex flex-col overflow-hidden lg:ml-[280px]",
          selectedPost && isAnunciosChannel ? "lg:w-1/2" : "",
          isRedesChatChannel && "lg:mr-[420px]"
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

            {/* Sorting and Menu - for Anuncios, Presentante and Dudas channels */}
            {(isAnunciosChannel || isPresentanteChannel || isDudasChannel) && (
              <div className="flex items-center gap-2">
                {/* Sort Dropdown - for Anuncios and Dudas */}
                {(isAnunciosChannel || isDudasChannel) && (
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
                )}

                {/* New post button - for Presentante and Dudas */}
                {(isPresentanteChannel || isDudasChannel) && (
                  <Button
                    onClick={() => {
                      // Focus on the input if it exists
                      const input = document.querySelector('[data-testid="new-post-input"]') as HTMLInputElement;
                      if (input) input.focus();
                    }}
                    className="bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-1 h-8 text-sm"
                    data-testid="header-new-post-button"
                  >
                    Nueva publicación
                  </Button>
                )}

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

          {/* Content Feed - Posts OR Chat OR Leaderboard depending on channel type */}
          {isLeaderboardChannel ? (
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="max-w-6xl mx-auto">
                {/* User's Personal Progress Card */}
                {user && (
                  <Card className="bg-[#1a1a1a] border-[#333333] mb-6">
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row items-start gap-6">
                        {/* Left side: Avatar with name and points below */}
                        <div className="flex flex-col items-center sm:items-start">
                          <div className="relative mb-3">
                            <Avatar className="h-20 w-20">
                              <AvatarImage src={(user as any)?.profileImageUrl || undefined} />
                              <AvatarFallback className="bg-[#333333] text-white text-2xl">
                                {(user?.firstName?.charAt(0) || "U").toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            {/* Badge de nivel en el avatar */}
                            <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-white text-xs font-bold rounded-full h-7 w-7 flex items-center justify-center border-2 border-[#1a1a1a]">
                              {userStats?.level || 1}
                            </div>
                          </div>
                          <h3 className="text-lg font-bold text-white text-center sm:text-left mb-1">
                            {user.firstName} {user.lastName}
                          </h3>
                          <p className="text-sm text-muted-foreground text-center sm:text-left">
                            {userStats?.points || 0} puntos
                          </p>
                        </div>

                        {/* Right side: Level info and levels grid */}
                        <div className="flex-1 w-full">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="flex items-center gap-2">
                              <Trophy className="h-6 w-6 text-yellow-500" />
                              <span className="text-white font-semibold text-lg">Nivel {userStats?.level || 1}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mb-6">
                            <span className="text-sm text-muted-foreground">
                              {userStats ? getPointsForNextLevel(userStats.level || 1, userStats.points || 0) : 0} puntos para subir de nivel
                            </span>
                            <HelpCircle 
                              className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-cyan-500 transition-colors" 
                              onClick={() => setPointsInfoOpen(true)}
                            />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {LEVELS.map((level) => {
                              const currentLevel = userStats?.level || 1;
                              const isUnlocked = currentLevel >= level.level;
                              const isCurrent = currentLevel === level.level;
                              return (
                                <div
                                  key={level.level}
                                  className={cn(
                                    "flex items-center gap-2 text-sm",
                                    isUnlocked ? "text-white" : "text-muted-foreground"
                                  )}
                                >
                                  {isCurrent ? (
                                    <div className="bg-yellow-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0">
                                      {level.level}
                                    </div>
                                  ) : isUnlocked ? (
                                    <Award className="h-4 w-4 text-green-500 flex-shrink-0" />
                                  ) : (
                                    <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                  )}
                                  <span className="flex-1">Nivel {level.level}: {level.points} puntos</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Period Filters */}
                <div className="flex items-center gap-4 mb-6 flex-wrap">
                  <Button
                    variant={leaderboardPeriod === "7_days" ? "default" : "outline"}
                    onClick={() => setLeaderboardPeriod("7_days")}
                    className={cn(
                      leaderboardPeriod === "7_days"
                        ? "bg-cyan-500 hover:bg-cyan-600 text-white border-cyan-500"
                        : "border-[#333333] text-white hover:bg-[#232323] bg-transparent"
                    )}
                  >
                    7 días
                  </Button>
                  <Button
                    variant={leaderboardPeriod === "30_days" ? "default" : "outline"}
                    onClick={() => setLeaderboardPeriod("30_days")}
                    className={cn(
                      leaderboardPeriod === "30_days"
                        ? "bg-cyan-500 hover:bg-cyan-600 text-white border-cyan-500"
                        : "border-[#333333] text-white hover:bg-[#232323] bg-transparent"
                    )}
                  >
                    30 días
                  </Button>
                  <Button
                    variant={leaderboardPeriod === "all_time" ? "default" : "outline"}
                    onClick={() => setLeaderboardPeriod("all_time")}
                    className={cn(
                      leaderboardPeriod === "all_time"
                        ? "bg-cyan-500 hover:bg-cyan-600 text-white border-cyan-500"
                        : "border-[#333333] text-white hover:bg-[#232323] bg-transparent"
                    )}
                  >
                    Todo el tiempo
                  </Button>
                  <a
                    href="#"
                    className="text-sm text-cyan-500 hover:text-cyan-400 ml-auto cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      setPointsInfoOpen(true);
                    }}
                  >
                    ¿Cómo funcionan los puntos?
                  </a>
                </div>

                {/* Leaderboard List */}
                {leaderboardLoading ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>Cargando clasificación...</p>
                  </div>
                ) : leaderboard && leaderboard.length > 0 ? (
                  <div className="space-y-3">
                    {leaderboard.map((member: any, index: number) => {
                      const rank = index + 1;
                      const isCurrentUser = member.userId === user?.id;
                      const getRankBadge = (rank: number) => {
                        if (rank === 1) {
                          return <div className="bg-yellow-500 text-white text-sm font-bold rounded-full h-8 w-8 flex items-center justify-center border-2 border-yellow-600">1</div>;
                        } else if (rank === 2) {
                          return <div className="bg-gray-400 text-white text-sm font-bold rounded-full h-8 w-8 flex items-center justify-center border-2 border-gray-500">2</div>;
                        } else if (rank === 3) {
                          return <div className="bg-amber-700 text-white text-sm font-bold rounded-full h-8 w-8 flex items-center justify-center border-2 border-amber-800">3</div>;
                        } else {
                          return <div className="bg-[#404040] text-gray-400 text-sm font-bold rounded-full h-8 w-8 flex items-center justify-center">{rank}</div>;
                        }
                      };
                      return (
                        <Card
                          key={member.userId}
                          className={cn(
                            "bg-[#1a1a1a] border-[#333333] hover:bg-[#232323] transition-colors",
                            isCurrentUser && "border-cyan-500 border-2"
                          )}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                              <div className="flex-shrink-0">
                                {getRankBadge(rank)}
                              </div>
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={member.profileImageUrl || undefined} />
                                <AvatarFallback className="bg-[#333333] text-white">
                                  {(member.firstName?.charAt(0) || "U").toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-white font-semibold truncate">
                                  {member.firstName} {member.lastName}
                                </h3>
                                {member.shortDescription && (
                                  <p className="text-sm text-muted-foreground truncate">
                                    {member.shortDescription}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="text-right">
                                  <p className="text-white font-semibold">+ {member.points || 0}</p>
                                  <p className="text-xs text-muted-foreground">Nivel {member.level || 1}</p>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No hay usuarios en la clasificación aún.</p>
                  </div>
                )}
              </div>
            </div>
          ) : isRedesChatChannel ? (
            <div className="flex-1 w-full flex flex-col">
              {/* Messages Feed - Always centered */}
              {messages.length === 0 ? (
                <div className="flex-1 flex justify-center items-center">
                  <div className="max-w-3xl px-6 text-muted-foreground text-center">
                    <p>No hay mensajes. ¡Sé el primero en escribir!</p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto px-6 py-6 w-full flex flex-col">
                  <div className="w-full max-w-3xl mx-auto space-y-4">
                    {/* Pinned Messages Section */}
                    {groupMessagesByDate(messages).pinned.length > 0 && (
                      <div className="space-y-3 pb-4 border-b border-[#444444]">
                        <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400">
                          <Pin className="h-3 w-3" />
                          <span>Mensajes fijados</span>
                        </div>
                        {groupMessagesByDate(messages).pinned.map((message) => (
                          <div key={message.id} className="rounded-lg border border-[#444444] bg-[#252525] p-3">
                            <div className="flex items-start gap-3">
                              <Avatar className="h-6 w-6 flex-shrink-0">
                                <AvatarImage src={message.user?.profileImageUrl || undefined} />
                                <AvatarFallback>{(message.user?.firstName?.charAt(0) || "U").toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-white text-sm">
                                    {message.user?.firstName} {message.user?.lastName}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(message.createdAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                                  </p>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap break-words">{message.content}</p>
                              </div>
                              {(user as any)?.isAdmin && (
                                <div className="flex gap-1 flex-shrink-0">
                                  <button
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      try {
                                        const res = await fetch(`/api/community/messages/${message.id}/pin`, {
                                          method: "PATCH",
                                          headers: { "Content-Type": "application/json" },
                                          credentials: "include",
                                          body: JSON.stringify({ isPinned: false }),
                                        });
                                        if (res.ok) {
                                          setMessages(messages.map(m => m.id === message.id ? { ...m, isPinned: false } : m));
                                          toast({ title: "Éxito", description: "Mensaje desf ijado" });
                                        }
                                      } catch (error) {
                                        toast({ title: "Error", description: "No se pudo desfijar el mensaje", variant: "destructive" });
                                      }
                                    }}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                    data-testid={`unpin-message-${message.id}`}
                                  >
                                    <Pin className="h-3 w-3 text-muted-foreground hover:text-cyan-400" />
                                  </button>
                                  <button
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      if (confirm("¿Eliminar este mensaje?")) {
                                        try {
                                          const res = await fetch(`/api/community/messages/${message.id}`, {
                                            method: "DELETE",
                                            credentials: "include",
                                          });
                                          if (res.ok) {
                                            setMessages(messages.filter(m => m.id !== message.id));
                                            toast({ title: "Éxito", description: "Mensaje eliminado" });
                                          }
                                        } catch (error) {
                                          toast({ title: "Error", description: "No se pudo eliminar el mensaje", variant: "destructive" });
                                        }
                                      }
                                    }}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                    data-testid={`delete-message-${message.id}`}
                                  >
                                    <Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-500" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Regular Messages Grouped by Date */}
                    {Object.entries(groupMessagesByDate(messages).grouped).map(([date, dateMessages]) => (
                      <div key={date} className="space-y-3">
                        <div className="flex items-center justify-center gap-3">
                          <div className="flex-1 border-t border-[#333333]"></div>
                          <span className="text-xs text-muted-foreground px-3 py-1 rounded-full bg-[#1a1a1a] border border-[#333333]">
                            {date}
                          </span>
                          <div className="flex-1 border-t border-[#333333]"></div>
                        </div>
                        {dateMessages.map((message) => (
                          <div key={message.id} className="rounded-lg border border-[#333333] bg-[#1a1a1a] p-4 group">
                            <div className="flex items-start gap-3 mb-2">
                              <Avatar 
                                className="h-8 w-8 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => message.user && handleOpenProfile(message.user)}
                              >
                                <AvatarImage src={message.user?.profileImageUrl || undefined} />
                                <AvatarFallback>{(message.user?.firstName?.charAt(0) || "U").toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p 
                                    className="font-semibold text-white cursor-pointer hover:underline"
                                    onClick={() => message.user && handleOpenProfile(message.user)}
                                  >
                                    {message.user?.firstName} {message.user?.lastName}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(message.createdAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                                  </p>
                                </div>
                                <p className="text-sm mt-1 whitespace-pre-wrap break-words text-[#ffffff]">{message.content}</p>
                              </div>
                              {(user as any)?.isAdmin && (
                                <div className="flex gap-1 flex-shrink-0">
                                  <button
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      try {
                                        const res = await fetch(`/api/community/messages/${message.id}/pin`, {
                                          method: "PATCH",
                                          headers: { "Content-Type": "application/json" },
                                          credentials: "include",
                                          body: JSON.stringify({ isPinned: true }),
                                        });
                                        if (res.ok) {
                                          setMessages(messages.map(m => m.id === message.id ? { ...m, isPinned: true } : m));
                                          toast({ title: "Éxito", description: "Mensaje fijado" });
                                        }
                                      } catch (error) {
                                        toast({ title: "Error", description: "No se pudo fijar el mensaje", variant: "destructive" });
                                      }
                                    }}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                    data-testid={`pin-message-${message.id}`}
                                  >
                                    <Pin className="h-4 w-4 text-muted-foreground hover:text-cyan-400" />
                                  </button>
                                  <button
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      if (confirm("¿Eliminar este mensaje?")) {
                                        try {
                                          const res = await fetch(`/api/community/messages/${message.id}`, {
                                            method: "DELETE",
                                            credentials: "include",
                                          });
                                          if (res.ok) {
                                            setMessages(messages.filter(m => m.id !== message.id));
                                            toast({ title: "Éxito", description: "Mensaje eliminado" });
                                          }
                                        } catch (error) {
                                          toast({ title: "Error", description: "No se pudo eliminar el mensaje", variant: "destructive" });
                                        }
                                      }
                                    }}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                    data-testid={`delete-message-${message.id}`}
                                  >
                                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-500" />
                                  </button>
                                </div>
                              )}
                            </div>
                            {/* Message reactions */}
                            <div className="flex items-center gap-2 text-xs text-muted-foreground ml-11 flex-wrap">
                              <div className="relative">
                                <button 
                                  onClick={() => setOpenReactionMessageId(openReactionMessageId === message.id ? null : message.id)}
                                  disabled={(userMessageEmojis[message.id] || []).length >= 3}
                                  className={cn(
                                    "flex items-center gap-1 transition-colors",
                                    (userMessageEmojis[message.id] || []).length >= 3 
                                      ? "text-muted-foreground cursor-not-allowed opacity-50" 
                                      : "hover:text-cyan-500"
                                  )}
                                >
                                  <Smile className="h-3 w-3" />
                                </button>
                                {openReactionMessageId === message.id && (
                                  <div className="absolute bottom-full left-0 mb-2 bg-[#2a2a2a] border border-[#444444] rounded-lg p-2 grid grid-cols-5 gap-1 w-40 z-50 shadow-lg">
                                    {["👍", "❤️", "😂", "😮", "🎉"].map((emoji) => (
                                      <button
                                        key={emoji}
                                        onClick={async () => {
                                          const currentEmojis = userMessageEmojis[message.id] || [];
                                          if (!currentEmojis.includes(emoji)) {
                                            setUserMessageEmojis({
                                              ...userMessageEmojis,
                                              [message.id]: [...currentEmojis, emoji]
                                            });
                                          }
                                          setOpenReactionMessageId(null);
                                        }}
                                        className="text-lg hover:scale-125 transition-transform cursor-pointer"
                                      >
                                        {emoji}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                              {(userMessageEmojis[message.id] || []).length > 0 && (
                                <div className="flex gap-1">
                                  {(userMessageEmojis[message.id] || []).map((emoji) => (
                                    <span key={emoji} className="text-sm px-1.5 py-0.5 rounded-full bg-[#292929]">{emoji}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Message Input with Toolbar */}
              <div className="flex-shrink-0 border-t border-[#333333] flex justify-center w-full bg-[#1a1a1a]">
                <div className="flex flex-col w-full px-6 py-2 max-w-3xl bg-[#1a1a1a]">
                  {/* Text Input with Integrated Toolbar */}
                  <div className="flex flex-col border border-[#333333] rounded-lg bg-[#1a1a1a] p-2">
                    {/* Textarea - Full width on top */}
                    <textarea
                      placeholder="Escribe un mensaje... (Shift+Enter para nueva línea)"
                      value={messageInput}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        setMessageInput(newValue);
                        messageInputRef.current = newValue;
                        if (activeChannel) {
                          setDraft(activeChannel.id, newValue);
                        }
                        // Auto-expand textarea
                        setTimeout(() => {
                          const textarea = e.target as HTMLTextAreaElement;
                          textarea.style.height = "auto";
                          const newHeight = Math.min(textarea.scrollHeight, 120);
                          textarea.style.height = newHeight + "px";
                        }, 0);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey && messageInput.trim()) {
                          e.preventDefault();
                          (async () => {
                            setSendingMessage(true);
                            try {
                              const res = await fetch(`/api/community/channels/${activeChannel?.id}/messages`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                credentials: "include",
                                body: JSON.stringify({ content: messageInput }),
                              });
                              if (res.ok) {
                                const newMessage = await res.json();
                                setMessages([...messages, newMessage]);
                                setMessageInput("");
                                messageInputRef.current = "";
                                if (activeChannel) {
                                  deleteDraft(activeChannel.id);
                                }
                                toast({ title: "Éxito", description: "Mensaje enviado" });
                              } else {
                                const error = await res.json();
                                toast({ title: "Error", description: error.message || "No se pudo enviar el mensaje", variant: "destructive" });
                              }
                            } catch (error) {
                              toast({ title: "Error", description: "No se pudo enviar el mensaje", variant: "destructive" });
                            } finally {
                              setSendingMessage(false);
                            }
                          })();
                        }
                      }}
                      disabled={sendingMessage}
                      className="w-full bg-transparent border-0 text-white text-left resize-none min-h-[24px] max-h-[120px] overflow-y-auto outline-none text-sm"
                      rows={1}
                      data-testid="message-input"
                    />
                    
                    {/* Toolbar and Send Button - Bottom row */}
                    <div className="flex items-center gap-3 mt-1">
                      {/* Toolbar - Left side */}
                      <div className="flex gap-1 flex-shrink-0 relative">
                        <div className="relative">
                          <button 
                            onClick={() => setShowMessageEmojiToolbar(!showMessageEmojiToolbar)}
                            className="p-1 hover:bg-[#292929] rounded transition-colors" 
                            data-testid="toolbar-emoji" 
                            title="Emoticones"
                          >
                            <Smile className="h-4 w-4 text-muted-foreground hover:text-cyan-400" />
                          </button>
                          {showMessageEmojiToolbar && (
                            <div className="absolute bottom-full left-0 mb-2 bg-[#2a2a2a] border border-[#444444] rounded-lg p-2 grid grid-cols-5 gap-1 w-40 z-50 shadow-lg">
                              {["👍", "❤️", "😂", "😮", "🎉", "🔥", "👀", "💯", "🙏", "😍", "😱", "😭", "🤔", "👌", "🚀"].map((emoji) => (
                                <button
                                  key={emoji}
                                  onClick={() => {
                                    const newValue = messageInput + emoji;
                                    setMessageInput(newValue);
                                    messageInputRef.current = newValue;
                                    setShowMessageEmojiToolbar(false);
                                  }}
                                  className="text-lg hover:scale-125 transition-transform cursor-pointer"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <button 
                          onClick={() => toast({ title: "Próximamente", description: "Adjuntar archivos está en desarrollo", variant: "default" })}
                          className="p-1 hover:bg-[#292929] rounded transition-colors" 
                          data-testid="toolbar-attachments" 
                          title="Archivos"
                        >
                          <Paperclip className="h-4 w-4 text-muted-foreground hover:text-cyan-400" />
                        </button>
                        <button 
                          onClick={() => toast({ title: "Próximamente", description: "Cargar imágenes está en desarrollo", variant: "default" })}
                          className="p-1 hover:bg-[#292929] rounded transition-colors" 
                          data-testid="toolbar-image" 
                          title="Imagen"
                        >
                          <Plus className="h-4 w-4 text-muted-foreground hover:text-cyan-400" />
                        </button>
                        <button 
                          onClick={() => toast({ title: "Próximamente", description: "Grabar audio está en desarrollo", variant: "default" })}
                          className="p-1 hover:bg-[#292929] rounded transition-colors" 
                          data-testid="toolbar-audio" 
                          title="Audio"
                        >
                          <Music className="h-4 w-4 text-muted-foreground hover:text-cyan-400" />
                        </button>
                        <button 
                          onClick={() => toast({ title: "Próximamente", description: "Mencionar usuarios está en desarrollo", variant: "default" })}
                          className="p-1 hover:bg-[#292929] rounded transition-colors" 
                          data-testid="toolbar-mention" 
                          title="Mencionar"
                        >
                          <AtSign className="h-4 w-4 text-muted-foreground hover:text-cyan-400" />
                        </button>
                      </div>
                      
                      {/* Send Button - Right side */}
                      <Button
                        size="sm"
                        onClick={async () => {
                          if (!messageInput.trim()) return;
                          setSendingMessage(true);
                          try {
                            const res = await fetch(`/api/community/channels/${activeChannel?.id}/messages`, {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              credentials: "include",
                              body: JSON.stringify({ content: messageInput }),
                            });
                            if (res.ok) {
                              const newMessage = await res.json();
                              setMessages([...messages, newMessage]);
                              setMessageInput("");
                              messageInputRef.current = "";
                              if (activeChannel) {
                                deleteDraft(activeChannel.id);
                              }
                              toast({ title: "Éxito", description: "Mensaje enviado" });
                            }
                          } catch (error) {
                            toast({ title: "Error", description: "No se pudo enviar el mensaje", variant: "destructive" });
                          } finally {
                            setSendingMessage(false);
                          }
                        }}
                        disabled={sendingMessage || !messageInput.trim()}
                        className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold flex-shrink-0 ml-auto"
                        data-testid="send-message-button"
                      >
                        {sendingMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : posts.length > 0 || activeChannel?.section === "Comunidad" ? (
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 max-w-4xl mx-auto w-full">

              {/* Inicia una publicación - para Presentante y Dudas */}
              {(isPresentanteChannel || isDudasChannel) && (
                <div className="border border-[#333333] rounded-lg p-3 bg-[#1a1a1a] flex items-center gap-3 w-full">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={(user as any)?.profileImageUrl || undefined} />
                    <AvatarFallback>{(user?.firstName?.charAt(0) || "U").toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <input
                    type="text"
                    placeholder="Inicia una publicación"
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newPostContent.trim()) {
                        e.preventDefault();
                        const button = e.currentTarget.parentElement?.querySelector('[data-testid="create-post-button"]') as HTMLButtonElement;
                        button?.click();
                      }
                    }}
                    className="flex-1 bg-transparent border-0 outline-none text-sm text-white placeholder-muted-foreground focus:ring-0"
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
                    className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold flex-shrink-0"
                    data-testid="create-post-button"
                  >
                    {creatingPost ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  </Button>
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
                      {/* Header para Presentante y Dudas - estilo chat */}
                      {!isAccordionChannel && (isPresentanteChannel || isDudasChannel) && !(post.post as any)?.isAdminPost && (
                        <div className="bg-[#232323] rounded-lg p-3 mb-3 relative">
                          <div className="flex items-start gap-3">
                            <Avatar className="h-10 w-10 flex-shrink-0">
                              <AvatarImage src={(post.user as any)?.profileImageUrl || undefined} />
                              <AvatarFallback>{(post.user?.firstName?.charAt(0) || "U").toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold text-white">
                                  {post.user?.firstName} {post.user?.lastName}
                                </p>
                                {/* Show "Pregunta" badge if post has lesson metadata */}
                                {(() => {
                                  const contentBlocks = post.post.contentBlocks || [];
                                  const metadataBlock = contentBlocks.find((block: any) => block.type === "metadata" && block.lessonId);
                                  return metadataBlock ? (
                                    <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded">Pregunta</span>
                                  ) : null;
                                })()}
                                <span className="text-xs text-muted-foreground">
                                  {new Date(post.post.createdAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                                </span>
                              </div>
                            </div>
                            {(user as any)?.isAdmin && (
                              <div className="flex gap-2 flex-shrink-0">
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                      const res = await fetch(`/api/community/posts/${post.post.id}/toggle-pin`, {
                                        method: "POST",
                                        credentials: "include",
                                      });
                                      if (res.ok) {
                                        // Refetch posts
                                        const postsRes = await fetch(`/api/community/channels/${activeChannel?.id}/posts?limit=50&sort=${sortBy}`);
                                        const postsData = await postsRes.json();
                                        setPosts(Array.isArray(postsData) ? postsData : []);
                                        toast({ title: "Éxito", description: (post.post as any)?.isPinned ? "Publicación desfijada" : "Publicación fijada" });
                                      } else {
                                        toast({ title: "Error", description: "No se pudo fijar/desfijar la publicación", variant: "destructive" });
                                      }
                                    } catch (error) {
                                      toast({ title: "Error", description: "Error al fijar/desfijar la publicación", variant: "destructive" });
                                    }
                                  }}
                                  className="p-1 hover:bg-[#333333] rounded transition-colors"
                                  title={(post.post as any)?.isPinned ? "Desfijar publicación" : "Fijar publicación"}
                                >
                                  <Pin className={cn("h-4 w-4", (post.post as any)?.isPinned ? "text-cyan-500 fill-cyan-500" : "text-muted-foreground")} />
                                </button>
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    if (confirm("¿Eliminar esta publicación?")) {
                                      try {
                                        const res = await fetch(`/api/admin/community/posts/${post.post.id}`, {
                                          method: "DELETE",
                                          credentials: "include",
                                        });
                                        if (res.ok) {
                                          // Refetch posts
                                          const postsRes = await fetch(`/api/community/channels/${activeChannel?.id}/posts?limit=50&sort=${sortBy}`);
                                          const postsData = await postsRes.json();
                                          setPosts(Array.isArray(postsData) ? postsData : []);
                                          toast({ title: "Éxito", description: "Publicación eliminada" });
                                        } else {
                                          toast({ title: "Error", description: "No se pudo eliminar la publicación", variant: "destructive" });
                                        }
                                      } catch (error) {
                                        toast({ title: "Error", description: "Error al eliminar la publicación", variant: "destructive" });
                                      }
                                    }
                                  }}
                                  className="p-1 hover:bg-[#333333] rounded transition-colors"
                                  data-testid={`delete-post-${post.post.id}`}
                                >
                                  <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-500" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      {/* Contenido - mostrar si no es accordion O si está expandido */}
                      {!isAccordionChannel || isExpanded ? (
                        <>
                          {!isAccordionChannel && !isPresentanteChannel && !isDudasChannel && (
                            <>
                              {/* Fecha - solo para no Presentante ni Dudas */}
                              <p className="text-xs text-muted-foreground mb-3">
                                {new Date(post.post.createdAt).toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}
                              </p>

                              {/* Título */}
                              <h3 className="font-bold text-white mb-3">{post.post.title}</h3>
                            </>
                          )}
                          {(isPresentanteChannel || isDudasChannel) && (
                            <>
                              {/* Título - para Presentante y Dudas */}
                              <div className="flex items-center justify-between mb-3">
                                <h3 className="font-bold text-white">{post.post.title}</h3>
                                {(user as any)?.isAdmin && (post.post as any)?.isAdminPost && (
                                  <div className="flex gap-2">
                                    <button
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        try {
                                          const res = await fetch(`/api/community/posts/${post.post.id}/toggle-pin`, {
                                            method: "POST",
                                            credentials: "include",
                                          });
                                          if (res.ok) {
                                            const postsRes = await fetch(`/api/community/channels/${activeChannel?.id}/posts?limit=50&sort=${sortBy}`);
                                            const postsData = await postsRes.json();
                                            setPosts(Array.isArray(postsData) ? postsData : []);
                                            toast({ title: "Éxito", description: (post.post as any)?.isPinned ? "Publicación desfijada" : "Publicación fijada" });
                                          } else {
                                            toast({ title: "Error", description: "No se pudo fijar/desfijar la publicación", variant: "destructive" });
                                          }
                                        } catch (error) {
                                          toast({ title: "Error", description: "Error al fijar/desfijar la publicación", variant: "destructive" });
                                        }
                                      }}
                                      className="p-1 hover:bg-[#333333] rounded transition-colors flex-shrink-0"
                                      title={(post.post as any)?.isPinned ? "Desfijar publicación" : "Fijar publicación"}
                                    >
                                      <Pin className={cn("h-4 w-4", (post.post as any)?.isPinned ? "text-cyan-500 fill-cyan-500" : "text-muted-foreground")} />
                                    </button>
                                    <button
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        if (confirm("¿Eliminar esta publicación?")) {
                                          try {
                                            const res = await fetch(`/api/admin/community/posts/${post.post.id}`, {
                                              method: "DELETE",
                                              credentials: "include",
                                            });
                                            if (res.ok) {
                                              const postsRes = await fetch(`/api/community/channels/${activeChannel?.id}/posts?limit=50&sort=${sortBy}`);
                                              const postsData = await postsRes.json();
                                              setPosts(Array.isArray(postsData) ? postsData : []);
                                              toast({ title: "Éxito", description: "Publicación eliminada" });
                                            } else {
                                              toast({ title: "Error", description: "No se pudo eliminar la publicación", variant: "destructive" });
                                            }
                                          } catch (error) {
                                            toast({ title: "Error", description: "Error al eliminar la publicación", variant: "destructive" });
                                          }
                                        }
                                      }}
                                      className="p-1 hover:bg-[#333333] rounded transition-colors flex-shrink-0"
                                      title="Eliminar publicación"
                                    >
                                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-500" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </>
                          )}

                          {isAccordionChannel && <div className="border-t border-[#333333] px-4 py-3" />}


                          {/* Renderizar bloques si existen */}
                          {post.post.contentBlocks && post.post.contentBlocks.length > 0 ? (
                            <div className={cn("space-y-3 mb-3", isAccordionChannel && "px-4")}>
                              {(() => {
                                const nonMetadataBlocks = post.post.contentBlocks.filter((block: any) => block.type !== "metadata");
                                const hasTextBlocks = nonMetadataBlocks.some((block: any) => block.type === "text" && block.content);
                                
                                // If no text blocks but there's post content, show it
                                if (!hasTextBlocks && post.post.content) {
                                  const isHtml = /<[^>]+>/.test(post.post.content);
                                  return isHtml ? (
                                    <div 
                                      className="prose prose-invert prose-sm max-w-none text-muted-foreground [&_a]:text-cyan-500 [&_a]:hover:text-cyan-400 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1 [&_p]:mb-2 [&_strong]:text-white [&_h1]:text-white [&_h2]:text-white [&_h3]:text-white"
                                      dangerouslySetInnerHTML={{ __html: post.post.content }}
                                    />
                                  ) : (
                                    <div className="text-sm text-white whitespace-pre-wrap break-words">
                                      {post.post.content.split(/(\bhttps?:\/\/[^\s]+)/g).map((part: string, i: number) => {
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
                                }
                                
                                // Otherwise render the content blocks (excluding metadata)
                                return post.post.contentBlocks
                                  .filter((block: any) => block.type !== "metadata")
                                  .map((block: any, idx: number) => {
                                if (block.type === "text") {
                                  // Check if content is HTML (contains HTML tags)
                                  const isHtml = block.content && /<[^>]+>/.test(block.content);
                                  
                                  if (isHtml) {
                                    return (
                                      <div 
                                        key={idx} 
                                        className="prose prose-invert prose-sm max-w-none text-muted-foreground [&_a]:text-cyan-500 [&_a]:hover:text-cyan-400 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1 [&_p]:mb-2 [&_strong]:text-white [&_h1]:text-white [&_h2]:text-white [&_h3]:text-white"
                                        dangerouslySetInnerHTML={{ __html: block.content }}
                                      />
                                    );
                                  }
                                  
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
                                  });
                              })()}
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
                              {(!post.post.contentBlocks || post.post.contentBlocks.length === 0 || post.post.contentBlocks.every((block: any) => block.type === "metadata")) && (() => {
                                // Check if content is HTML (contains HTML tags)
                                const isHtml = post.post.content && /<[^>]+>/.test(post.post.content);
                                
                                return isHtml ? (
                                  <div 
                                    className={cn("prose prose-invert prose-sm max-w-none text-muted-foreground mb-3 [&_a]:text-cyan-500 [&_a]:hover:text-cyan-400 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1 [&_p]:mb-2 [&_strong]:text-white [&_h1]:text-white [&_h2]:text-white [&_h3]:text-white", isAccordionChannel && "px-4")}
                                    dangerouslySetInnerHTML={{ __html: post.post.content }}
                                  />
                                ) : (
                                  <div className={cn("text-sm text-muted-foreground mb-3 whitespace-pre-line break-words leading-relaxed", isAccordionChannel && "px-4")}>
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
                                );
                              })()}
                            </>
                          )}
                        </>
                      ) : null}
                      {/* Header con nombre y fecha - solo para canales que no son accordion (no Presentante ni Dudas) */}
                      {!isAccordionChannel && !isPresentanteChannel && !isDudasChannel && (
                        <div className="flex flex-col gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={post.user?.profileImageUrl || undefined} />
                              <AvatarFallback>{(post.user?.firstName?.charAt(0) || "U").toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <p className="font-semibold text-white">
                              {post.user?.firstName} {post.user?.lastName}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(post.post.createdAt).toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}
                          </p>
                        </div>
                      )}
                      {/* Acciones - solo para canales que no son accordion y no son posts de admin */}
                      {!isAccordionChannel && !(post.post as any)?.isAdminPost && (
                        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground flex-wrap">
                          <div className="flex items-center gap-2 flex-wrap">
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
                        <button
                          onClick={() => {
                            if (selectedPost?.post.id !== post.post.id) {
                              setSelectedPost(post);
                            }
                          }}
                          className={cn(
                            "flex items-center gap-1 transition-colors",
                            selectedPost?.post.id === post.post.id ? "text-cyan-500" : "text-muted-foreground hover:text-cyan-500"
                          )}
                        >
                          <MessageCircle className="h-4 w-4" />
                          Responder
                        </button>
                        {(user as any)?.isAdmin && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  const res = await fetch(`/api/community/posts/${post.post.id}/toggle-pin`, {
                                    method: "POST",
                                    credentials: "include",
                                  });
                                  if (res.ok) {
                                    // Refetch posts
                                    const postsRes = await fetch(`/api/community/channels/${activeChannel?.id}/posts?limit=50&sort=${sortBy}`);
                                    const postsData = await postsRes.json();
                                    setPosts(Array.isArray(postsData) ? postsData : []);
                                    toast({ title: "Éxito", description: (post.post as any)?.isPinned ? "Publicación desfijada" : "Publicación fijada" });
                                  } else {
                                    toast({ title: "Error", description: "No se pudo fijar/desfijar la publicación", variant: "destructive" });
                                  }
                                } catch (error) {
                                  toast({ title: "Error", description: "Error al fijar/desfijar la publicación", variant: "destructive" });
                                }
                              }}
                              className={cn(
                                "flex items-center gap-1 transition-colors",
                                (post.post as any)?.isPinned ? "text-cyan-500" : "text-muted-foreground hover:text-cyan-500"
                              )}
                              title={(post.post as any)?.isPinned ? "Desfijar publicación" : "Fijar publicación"}
                            >
                              <Pin className={cn("h-4 w-4", (post.post as any)?.isPinned && "fill-current")} />
                              {(post.post as any)?.isPinned ? "Fijado" : "Fijar"}
                            </button>
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (confirm("¿Eliminar esta publicación?")) {
                                  try {
                                    const res = await fetch(`/api/admin/community/posts/${post.post.id}`, {
                                      method: "DELETE",
                                      credentials: "include",
                                    });
                                    if (res.ok) {
                                      // Refetch posts
                                      const postsRes = await fetch(`/api/community/channels/${activeChannel?.id}/posts?limit=50&sort=${sortBy}`);
                                      const postsData = await postsRes.json();
                                      setPosts(Array.isArray(postsData) ? postsData : []);
                                      toast({ title: "Éxito", description: "Publicación eliminada" });
                                    } else {
                                      toast({ title: "Error", description: "No se pudo eliminar la publicación", variant: "destructive" });
                                    }
                                  } catch (error) {
                                    toast({ title: "Error", description: "Error al eliminar la publicación", variant: "destructive" });
                                  }
                                }
                              }}
                              className="flex items-center gap-1 text-muted-foreground hover:text-red-500 transition-colors"
                              title="Eliminar publicación"
                            >
                              <Trash2 className="h-4 w-4" />
                              Eliminar
                            </button>
                          </div>
                        )}
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
              <p>Este canal no tiene contenido configurado.</p>
            </div>
          )}
        </div>

        {/* Right Sidebar - Comments/Thread (for all channels except empieza-aqui when post selected) */}
        {!isAccordionChannel && selectedPost && (() => {
          const contentBlocks = selectedPost.post.contentBlocks || [];
          const metadataBlock = contentBlocks.find((block: any) => block.type === "metadata" && block.lessonId);
          const isQuestionThread = !!metadataBlock;
          
          return (
          <div className="hidden lg:fixed right-0 top-0 h-screen w-[420px] lg:flex flex-col bg-[#1a1a1a] overflow-hidden z-40">
            {/* Comments/Thread Header */}
            <div className="flex-shrink-0 px-6 py-4 flex items-center justify-between bg-[#232323]">
              <div>
                <h2 className="text-lg font-bold text-white">{isQuestionThread ? "Hilo" : "Comentarios"}</h2>
                <p className="text-xs text-muted-foreground mt-1">{comments.length} {isQuestionThread ? "mensajes" : "comentarios"}</p>
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

            {/* Comments List - scrollable, stuck to input, grouped by date */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-[#232323] scrollbar-thin">
              {comments.length === 0 ? (
                <div className="flex items-center justify-center text-muted-foreground text-sm">
                  <p>Sin comentarios aún. ¡Sé el primero!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(groupCommentsByDate(comments)).map(([date, groupedComments]) => (
                    <div key={date} className="space-y-3">
                      {/* Date separator */}
                      <div className="text-center">
                        <span className="text-xs bg-[#333333] px-3 py-1 rounded-full text-muted-foreground">
                          {date}
                        </span>
                      </div>
                      {/* Comments in this date group */}
                      {groupedComments.map((comment) => {
                        const isOriginalPost = (comment.comment as any).isOriginalPost;
                        return (
                        <div key={comment.comment.id} className={cn(
                          "rounded-lg p-3 border",
                          isOriginalPost 
                            ? "bg-[#1a2a2a] border-cyan-500/30" 
                            : "bg-[#1f1f1f] border-[#333333]"
                        )}>
                          <div className="flex gap-2">
                            <Avatar className="h-8 w-8 flex-shrink-0">
                              <AvatarImage src={comment.user?.profileImageUrl || undefined} />
                              <AvatarFallback className="text-xs">{(comment.user?.firstName?.charAt(0) || "U").toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm font-semibold text-white">
                                  {comment.user?.firstName} {comment.user?.lastName}
                                </p>
                                {isOriginalPost && (
                                  <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded">Pregunta</span>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {new Date(comment.comment.createdAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                                </span>
                              </div>
                              <p className={cn(
                                "text-sm break-words",
                                isOriginalPost ? "text-white" : "text-muted-foreground"
                              )}>{comment.comment.content}</p>
                              
                              {/* Emoji reactions - Only show for actual comments, not original post */}
                              {!isOriginalPost && (
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <div className="relative">
                                  <button 
                                    onClick={() => setOpenReactionCommentId(openReactionCommentId === comment.comment.id ? null : comment.comment.id)}
                                    disabled={(userCommentEmojis[comment.comment.id] || []).length >= 3}
                                    className={cn(
                                      "flex items-center gap-1 text-xs transition-colors",
                                      (userCommentEmojis[comment.comment.id] || []).length >= 3 
                                        ? "text-muted-foreground cursor-not-allowed opacity-50" 
                                        : "hover:text-cyan-500"
                                    )}
                                  >
                                    <Smile className="h-4 w-4" />
                                  </button>
                                  {/* Emoji selector popup */}
                                  {openReactionCommentId === comment.comment.id && (
                                    <div className="absolute bottom-full left-0 mb-2 bg-[#2a2a2a] border border-[#444444] rounded-lg p-2 grid grid-cols-5 gap-1 w-56 z-50 shadow-lg">
                                      {["👍", "❤️", "😂", "😮", "🎉", "🔥", "🍊", "🌟", "👏", "🎯"].map((emoji) => {
                                        const hasEmoji = (userCommentEmojis[comment.comment.id] || []).includes(emoji);
                                        const userReactionsCount = (userCommentEmojis[comment.comment.id] || []).length;
                                        const canAdd = hasEmoji || userReactionsCount < 3;
                                        
                                        return (
                                          <button
                                            key={emoji}
                                            onClick={async () => {
                                              try {
                                                const token = localStorage.getItem('simpleAuthToken');
                                                const headers: Record<string, string> = { "Content-Type": "application/json" };
                                                if (token) {
                                                  headers["Authorization"] = `Bearer ${token}`;
                                                }
                                                
                                                await fetch(`/api/community/comments/${comment.comment.id}/reactions`, {
                                                  method: "POST",
                                                  headers,
                                                  credentials: "include",
                                                  body: JSON.stringify({ emoji }),
                                                });
                                                setOpenReactionCommentId(null);
                                                // Refresh comments
                                                const res = await fetch(`/api/community/posts/${selectedPost?.post.id}/comments`);
                                                const data = await res.json();
                                                const comments = Array.isArray(data) ? data : [];
                                                setComments(comments);
                                                
                                                // Reload reactions
                                                const reactionsMap: { [commentId: string]: { emoji: string; count: number; users: string[] }[] } = {};
                                                for (const c of comments) {
                                                  try {
                                                    const reactionsRes = await fetch(`/api/community/comments/${c.comment.id}/reactions`);
                                                    const reactions = await reactionsRes.json();
                                                    reactionsMap[c.comment.id] = Array.isArray(reactions) ? reactions : [];
                                                  } catch (error) {
                                                    console.error("Error fetching reactions:", error);
                                                    reactionsMap[c.comment.id] = [];
                                                  }
                                                }
                                                setCommentReactions(reactionsMap);
                                              } catch (error) {
                                                console.error("Error adding reaction:", error);
                                              }
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
                                
                                {/* Show all reactions - Only for actual comments, not original post */}
                                {!isOriginalPost && (commentReactions[comment.comment.id] || []).length > 0 && (
                                  <div className="flex items-center gap-1 flex-wrap">
                                    {(commentReactions[comment.comment.id] || []).map((reaction, idx) => (
                                      <button
                                        key={idx}
                                        onClick={async () => {
                                          try {
                                            const token = localStorage.getItem('simpleAuthToken');
                                            const headers: Record<string, string> = { "Content-Type": "application/json" };
                                            if (token) {
                                              headers["Authorization"] = `Bearer ${token}`;
                                            }
                                            
                                            await fetch(`/api/community/comments/${comment.comment.id}/reactions`, {
                                              method: "POST",
                                              headers,
                                              credentials: "include",
                                              body: JSON.stringify({ emoji: reaction.emoji }),
                                            });
                                            // Refresh comments
                                            const res = await fetch(`/api/community/posts/${selectedPost?.post.id}/comments`);
                                            const data = await res.json();
                                            const comments = Array.isArray(data) ? data : [];
                                            setComments(comments);
                                            
                                            // Reload reactions
                                            const reactionsMap: { [commentId: string]: { emoji: string; count: number; users: string[] }[] } = {};
                                            for (const c of comments) {
                                              try {
                                                const reactionsRes = await fetch(`/api/community/comments/${c.comment.id}/reactions`);
                                                const reactions = await reactionsRes.json();
                                                reactionsMap[c.comment.id] = Array.isArray(reactions) ? reactions : [];
                                              } catch (error) {
                                                console.error("Error fetching reactions:", error);
                                                reactionsMap[c.comment.id] = [];
                                              }
                                            }
                                            setCommentReactions(reactionsMap);
                                          } catch (error) {
                                            console.error("Error adding reaction:", error);
                                          }
                                        }}
                                        className={cn(
                                          "text-sm px-2 py-1 rounded-full transition-all cursor-pointer bg-[#292929]",
                                          (userCommentEmojis[comment.comment.id] || []).includes(reaction.emoji)
                                            ? "text-white" 
                                            : "text-muted-foreground hover:text-white"
                                        )}
                                        data-testid={`reaction-${comment.comment.id}-${reaction.emoji}`}
                                      >
                                        {reaction.emoji} {reaction.count}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                              )}
                            </div>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Comment Input */}
            <div className="flex-shrink-0 px-6 py-4 bg-[#232323]">
              <div className="flex gap-2">
                <Input
                  placeholder="Escribe un comentario..."
                  className="border-[#444444] text-white text-sm bg-[#181818]"
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
          );
        })()}


        {/* Right Sidebar - Members (for Redes de Chat) */}
        {isRedesChatChannel && (() => {
          // Remove duplicates from allUsers first
          const uniqueAllUsers = allUsers.filter((u, index, self) => 
            index === self.findIndex(user => user.id === u.id)
          );
          
          // Separate users into online and offline
          const onlineUserIds = new Set(onlineMembers.map(m => m?.id).filter(Boolean));
          const onlineUsersList = uniqueAllUsers.filter(u => u.id && onlineUserIds.has(u.id));
          const offlineUsersList = uniqueAllUsers.filter(u => u.id && !onlineUserIds.has(u.id));
          
          console.log("Sidebar render:", {
            allUsersCount: allUsers.length,
            onlineMembersCount: onlineMembers.length,
            onlineUsersListCount: onlineUsersList.length,
            offlineUsersListCount: offlineUsersList.length
          });
          
          return (
          <div className="hidden lg:fixed right-0 top-0 h-screen w-[420px] lg:flex flex-col bg-[#1a1a1a] overflow-hidden z-40 border-l border-[#333333]">
              {/* Header */}
            <div className="flex-shrink-0 px-6 py-4 bg-[#232323] border-b border-[#333333]">
                <h2 className="text-lg font-bold text-white">Detalles</h2>
            </div>

            {/* Channel Description */}
            <div className="flex-shrink-0 px-6 py-4 border-b border-[#333333]">
                <p className="text-sm text-muted-foreground">
                  Canal para debates sobre el universo NoCode e Inteligencia Artificial.
                </p>
                <p className="text-sm text-yellow-500 flex items-center gap-1 mt-2">
                  <span>⚠️</span>
                  <span>Este no es un canal de soporte</span>
                </p>
            </div>

            {/* Members List - scrollable */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 scrollbar-thin">
                {/* Debug info - remove after fixing */}
                {allUsers.length === 0 && (
                  <div className="text-xs text-yellow-500 mb-4">
                    Cargando usuarios... (Total: {allUsers.length}, Online: {onlineMembers.length})
                  </div>
                )}
                
                {/* Online Users */}
                <div>
                  <h3 className="text-sm font-semibold text-white mb-3">EN LÍNEA ({onlineUsersList.length})</h3>
                  {onlineUsersList.length === 0 ? (
                <p className="text-xs text-muted-foreground">No hay miembros en línea</p>
              ) : (
                    <div className="space-y-1">
                      {onlineUsersList.map((member) => (
                        <div 
                          key={member?.id} 
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#232323] transition-colors cursor-pointer"
                          onClick={() => handleOpenProfile(member)}
                        >
                          <div className="relative">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={member?.profileImageUrl || undefined} />
                      <AvatarFallback>{(member?.firstName?.charAt(0) || "U").toUpperCase()}</AvatarFallback>
                    </Avatar>
                            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-[#1a1a1a]"></div>
                          </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">
                        {member?.firstName} {member?.lastName}
                      </p>
                    </div>
                          {member?.isAdmin && (
                            <span className="text-xs bg-[#404040] text-muted-foreground px-2 py-0.5 rounded flex items-center gap-1">
                              <span>👤</span>
                              <span>ADMINISTRADOR</span>
                            </span>
                          )}
                  </div>
                      ))}
                    </div>
              )}
            </div>

                {/* Offline Users */}
                <div>
                  <h3 className="text-sm font-semibold text-white mb-3">FUERA DE LÍNEA ({offlineUsersList.length})</h3>
                  {offlineUsersList.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No hay miembros fuera de línea</p>
                  ) : (
                    <div className="space-y-1">
                      {offlineUsersList.map((member) => (
                        <div 
                          key={member?.id} 
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#232323] transition-colors cursor-pointer"
                          onClick={() => handleOpenProfile(member)}
                        >
                          <div className="relative">
                            <Avatar className="h-8 w-8 flex-shrink-0">
                              <AvatarImage src={member?.profileImageUrl || undefined} />
                              <AvatarFallback>{(member?.firstName?.charAt(0) || "U").toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-gray-500 border-2 border-[#1a1a1a]"></div>
          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate">
                              {member?.firstName} {member?.lastName}
                            </p>
                          </div>
                          {member?.isAdmin && (
                            <span className="text-xs bg-[#404040] text-muted-foreground px-2 py-0.5 rounded flex items-center gap-1">
                              <span>👤</span>
                              <span>ADMINISTRADOR</span>
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
      </div>
      <MobileNav />

      {/* Profile Dialog */}
      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent className="w-[95vw] sm:w-[90vw] max-w-4xl h-[90vh] max-h-[90vh] overflow-hidden flex flex-col bg-[#1a1a1a] border-[#333333] text-white p-0 sm:p-6 m-0 translate-x-[-50%] translate-y-[-50%] left-[50%] top-[50%]">
          {selectedProfileUser && (
            <div className="flex flex-col h-full overflow-hidden">
              <DialogHeader className="pb-4 px-4 sm:px-0 flex-shrink-0">
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <div className="relative flex-shrink-0">
                    <Avatar className="h-24 w-24 sm:h-28 sm:w-28">
                      <AvatarImage src={selectedProfileUser.profileImageUrl || undefined} />
                      <AvatarFallback className="bg-[#333333] text-white text-3xl sm:text-4xl">
                        {(selectedProfileUser.firstName?.charAt(0) || "U").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {/* Badge de nivel */}
                    <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white text-xs sm:text-sm font-bold rounded-full h-7 w-7 sm:h-8 sm:w-8 flex items-center justify-center border-2 border-[#1a1a1a]">
                      {selectedProfileUser.level || 1}
                    </div>
                  </div>
                  <div className="flex-1 w-full min-w-0">
                    <DialogTitle className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2 break-words">
                      {selectedProfileUser.firstName} {selectedProfileUser.lastName}
                    </DialogTitle>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                      <p className="whitespace-nowrap">
                        Visto por última vez {getTimeSinceLastSeen(selectedProfileUser.lastLoginAt)}
                      </p>
                      <span className="hidden sm:inline">•</span>
                      <p>
                        Miembro desde el {selectedProfileUser.createdAt ? 
                          new Date(selectedProfileUser.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
                          : 'N/A'}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      {selectedProfileUser.isAdmin && (
                        <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                          ⭐ PRO
                        </span>
                      )}
                      <span className="bg-green-500 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                        ⭐ Promotor
                      </span>
                      <Button className="bg-green-500 hover:bg-green-600 text-white text-xs px-2 py-1 h-auto">
                        Mensaje
                      </Button>
                      <Button variant="outline" size="icon" className="border-[#333333] hover:bg-[#232323] h-auto w-auto p-1">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              {/* Tabs */}
              <div className="border-b border-[#333333] mb-4 px-4 sm:px-0 flex-shrink-0 overflow-x-auto">
                <div className="flex gap-2 sm:gap-4 min-w-max">
                  <button 
                    className={cn(
                      "pb-2 px-2 sm:px-1 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap",
                      activeProfileTab === "about" 
                        ? "border-b-2 border-white text-white" 
                        : "text-muted-foreground hover:text-white"
                    )}
                    onClick={() => setActiveProfileTab("about")}
                  >
                    Acerca de
                  </button>
                  <button 
                    className={cn(
                      "pb-2 px-2 sm:px-1 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap",
                      activeProfileTab === "posts" 
                        ? "border-b-2 border-white text-white" 
                        : "text-muted-foreground hover:text-white"
                    )}
                    onClick={() => setActiveProfileTab("posts")}
                  >
                    Publicaciones <span className="hidden sm:inline">{selectedProfileUser.postsCount || 0}</span>
                  </button>
                  <button 
                    className={cn(
                      "pb-2 px-2 sm:px-1 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap",
                      activeProfileTab === "comments" 
                        ? "border-b-2 border-white text-white" 
                        : "text-muted-foreground hover:text-white"
                    )}
                    onClick={() => setActiveProfileTab("comments")}
                  >
                    Comentarios <span className="hidden sm:inline">{selectedProfileUser.commentsCount || 0}</span>
                  </button>
                  <button 
                    className={cn(
                      "pb-2 px-2 sm:px-1 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap",
                      activeProfileTab === "spaces" 
                        ? "border-b-2 border-white text-white" 
                        : "text-muted-foreground hover:text-white"
                    )}
                    onClick={() => setActiveProfileTab("spaces")}
                  >
                    Espacios <span className="hidden sm:inline">18</span>
                  </button>
                  <button 
                    className={cn(
                      "pb-2 px-2 sm:px-1 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap",
                      activeProfileTab === "rewards" 
                        ? "border-b-2 border-white text-white" 
                        : "text-muted-foreground hover:text-white"
                    )}
                    onClick={() => setActiveProfileTab("rewards")}
                  >
                    Recompensas
                  </button>
                </div>
              </div>

              {/* Contenido del tab activo - Scrollable */}
              <div className="flex-1 overflow-y-auto px-4 sm:px-0">
                {activeProfileTab === "about" && (
                  <div className="space-y-4 pb-4">
                    {/* Nivel y puntos */}
                    {loadingUserStats ? (
                      <div className="text-center py-4 text-muted-foreground">
                        <p>Cargando estadísticas...</p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-500 text-white text-sm sm:text-base font-bold rounded-full h-10 w-10 sm:h-12 sm:w-12 flex items-center justify-center flex-shrink-0">
                          {selectedProfileUser.level || 1}
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm sm:text-base">Nivel {selectedProfileUser.level || 1}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {selectedProfileUser.points || 0} puntos • {getPointsForNextLevel(selectedProfileUser.level || 1, selectedProfileUser.points || 0)} para subir de nivel
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Etiquetas */}
                    <div className="flex flex-wrap gap-2">
                      {selectedProfileUser.isAdmin && (
                        <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">⭐ PRO</span>
                      )}
                      <span className="bg-green-500 text-white text-xs px-2 py-1 rounded">⭐ Promotor</span>
                    </div>

                    {/* Descripción corta */}
                    <div>
                      <h3 className="text-white font-medium mb-2 text-sm sm:text-base">Descripción corta</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground break-words">
                        {selectedProfileUser.shortDescription || 'No hay descripción disponible'}
                      </p>
                    </div>

                    {/* Bio */}
                    <div>
                      <h3 className="text-white font-medium mb-2 text-sm sm:text-base">Bio</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground break-words whitespace-pre-wrap">
                        {selectedProfileUser.bio || 'No hay biografía disponible'}
                      </p>
                    </div>
                  </div>
                )}

                {activeProfileTab === "posts" && (
                  <div className="space-y-4 pb-4">
                    {loadingUserPosts ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm sm:text-base">Cargando publicaciones...</p>
                      </div>
                    ) : userPosts && userPosts.length > 0 ? (
                      userPosts.map((item: any) => (
                        <div
                          key={item.post.id}
                          className="rounded-lg border border-[#333333] bg-[#1a1a1a] p-4 hover:border-[#555555] transition-colors"
                        >
                          <div className="flex items-start gap-3 mb-3">
                            <div className="flex-1">
                              <h3 className="font-bold text-white text-sm sm:text-base mb-2">{item.post.title}</h3>
                              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3 mb-2">
                                {item.post.content}
                              </p>
                              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                                {item.channel && (
                                  <span>📢 {item.channel.name}</span>
                                )}
                                <span>📅 {new Date(item.post.createdAt).toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm sm:text-base">No hay publicaciones aún</p>
                      </div>
                    )}
                  </div>
                )}

                {activeProfileTab === "comments" && (
                  <div className="space-y-4 pb-4">
                    {loadingUserComments ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm sm:text-base">Cargando comentarios...</p>
                      </div>
                    ) : userComments && userComments.length > 0 ? (
                      userComments.map((item: any) => (
                        <div
                          key={item.comment.id}
                          onClick={() => handleNavigateToPost(item)}
                          className="rounded-lg border border-[#333333] bg-[#1a1a1a] p-4 hover:border-cyan-500 hover:bg-[#1a2a2a] transition-colors cursor-pointer"
                        >
                          <div className="flex items-start gap-3 mb-2">
                            <div className="flex-1">
                              <p className="text-xs sm:text-sm text-white mb-2 break-words">
                                {item.comment.content}
                              </p>
                              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                                {item.post && (
                                  <span className="font-medium">📝 {item.post.title}</span>
                                )}
                                {item.channel && (
                                  <span>📢 {item.channel.name}</span>
                                )}
                                <span>📅 {new Date(item.comment.createdAt).toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm sm:text-base">No hay comentarios aún</p>
                      </div>
                    )}
                  </div>
                )}

                {activeProfileTab === "spaces" && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm sm:text-base">Los espacios se mostrarán aquí</p>
                  </div>
                )}

                {activeProfileTab === "rewards" && (
                  <div className="space-y-3 pb-4">
                    {loadingUserRewards ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm sm:text-base">Cargando recompensas...</p>
                      </div>
                    ) : userRewards && userRewards.length > 0 ? (
                      <div className="space-y-2">
                        {userRewards.map((reward: any) => {
                          const isPositive = reward.points > 0;
                          const date = new Date(reward.createdAt);
                          const formattedDate = date.toLocaleDateString("es-ES", { 
                            year: "numeric", 
                            month: "long", 
                            day: "numeric" 
                          });
                          const actionText = isPositive ? "Recompensado" : "Revocado";
                          
                          // Map activity types to Spanish descriptions
                          const activityDescriptions: { [key: string]: string } = {
                            message: "Mensaje en chat",
                            post: "Publicación creada",
                            comment: "Comentario en publicación",
                            reaction: "Curtiu uma publicação", // Mantener el texto original como en la imagen
                          };
                          
                          // Preferir la descripción del backend, si no existe usar el mapeo
                          const description = reward.description || activityDescriptions[reward.activityType] || `Actividad: ${reward.activityType}`;
                          
                          return (
                            <div
                              key={reward.id}
                              className="flex items-start gap-3 p-3 rounded-lg border border-[#333333] bg-[#1a1a1a] hover:border-[#555555] transition-colors"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={cn(
                                    "text-sm sm:text-base font-semibold",
                                    isPositive ? "text-green-500" : "text-red-500"
                                  )}>
                                    {isPositive ? "+" : ""}{reward.points} puntos
                                  </span>
                                </div>
                                <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                                  {actionText} el {formattedDate}
                                </p>
                                {description && (
                                  <p className="text-xs sm:text-sm text-muted-foreground">
                                    • {description}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm sm:text-base">No hay recompensas aún</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Points Info Dialog */}
      <Dialog open={pointsInfoOpen} onOpenChange={setPointsInfoOpen}>
        <DialogContent className="max-w-lg bg-[#1a1a1a] border-[#333333] text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white">
              ¿Cómo funcionan los puntos?
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 mt-4">
            {/* 1 me gusta = 1 punto */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-white">1 me gusta = 1 punto</h3>
              <p className="text-sm text-muted-foreground">
                Recibir un "me gusta" en una publicación o comentario te otorga 1 punto. 
                Esto fomenta que los miembros hagan contribuciones valiosas y recompensa a otros 
                por dar "me gusta" a las publicaciones.
              </p>
            </div>

            {/* Recompensas */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-white">Recompensas</h3>
              <p className="text-sm text-muted-foreground">
                Los administradores de la comunidad pueden otorgar puntos ocasionalmente. 
                Estas recompensas son visibles en tu perfil.
              </p>
            </div>

            {/* Niveles */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-white">Niveles</h3>
              <p className="text-sm text-muted-foreground">
                A medida que acumulas puntos, avanzarás por los niveles del 1 al 9. 
                Tu nivel actual se muestra en tu avatar y los puntos necesarios para el siguiente 
                nivel se muestran en tu página de perfil.
              </p>
            </div>

            {/* Tabla de niveles */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white">Progresión de Niveles</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {LEVELS.map((level) => {
                  const currentLevel = userStats?.level || 1;
                  const isUnlocked = currentLevel >= level.level;
                  const isCurrent = currentLevel === level.level;
                  
                  return (
                    <div
                      key={level.level}
                      className={cn(
                        "p-3 rounded border",
                        isCurrent
                          ? "bg-yellow-500/20 border-yellow-500 text-white"
                          : isUnlocked
                          ? "bg-green-500/10 border-green-500/50 text-white"
                          : "bg-[#2a2a2a] border-[#333333] text-muted-foreground"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {isCurrent ? (
                          <Trophy className="h-5 w-5 text-yellow-500" />
                        ) : isUnlocked ? (
                          <Award className="h-5 w-5 text-green-500" />
                        ) : (
                          <Lock className="h-5 w-5 text-muted-foreground" />
                        )}
                        <div>
                          <p className="font-semibold">Nivel {level.level}</p>
                          <p className="text-xs">{level.points} puntos</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
