import { useState, useEffect } from "react";
import { useSimpleAuth } from "@/hooks/use-simple-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Loader2, Menu } from "lucide-react";
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

interface Message {
  message: {
    id: string;
    content: string;
    createdAt: string;
    userId: string;
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageInput, setMessageInput] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [channelsSidebarOpen, setChannelsSidebarOpen] = useState(true);

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

  // Fetch messages when channel changes
  useEffect(() => {
    if (!activeChannel) return;

    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/community/channels/${activeChannel.id}/messages?limit=50`);
        const data = await res.json();
        setMessages(data);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [activeChannel]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !activeChannel) return;

    setSendingMessage(true);
    try {
      const token = localStorage.getItem("authToken");
      const headers: any = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/community/channels/${activeChannel.id}/messages`, {
        method: "POST",
        headers,
        body: JSON.stringify({ content: messageInput }),
      });

      if (res.ok) {
        setMessageInput("");
        const newRes = await fetch(`/api/community/channels/${activeChannel.id}/messages?limit=50`);
        const data = await newRes.json();
        setMessages(data);
      } else {
        toast({ title: "Error", description: "No se pudo enviar el mensaje", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast({ title: "Error", description: "No se pudo enviar el mensaje", variant: "destructive" });
    } finally {
      setSendingMessage(false);
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
    <div className="min-h-screen bg-background flex overflow-hidden">
      {/* Left Sidebar - Main Navigation */}
      <Sidebar />

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

      {/* Right Content - Messages */}
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

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>No hay mensajes. ¡Sé el primero en escribir!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.message.id} className="flex gap-3">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={msg.user?.profileImageUrl || undefined} />
                  <AvatarFallback>{(msg.user?.firstName?.charAt(0) || "U").toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-white">
                      {msg.user?.firstName} {msg.user?.lastName}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {new Date(msg.message.createdAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground break-words">{msg.message.content}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Message Input */}
        <div className="border-t border-[#333333] bg-[#1a1a1a] px-6 py-4">
          <div className="flex gap-3">
            <Input
              placeholder="Escribe un mensaje..."
              className="bg-[#2a2a2a] border-[#444444] text-white"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              data-testid="message-input"
            />
            <Button
              onClick={handleSendMessage}
              disabled={sendingMessage || !messageInput.trim()}
              className="bg-cyan-500 hover:bg-cyan-600"
              data-testid="send-message-button"
            >
              {sendingMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      <MobileNav />
    </div>
  );
}
