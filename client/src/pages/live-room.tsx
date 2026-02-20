import { useState, useEffect, useRef, useCallback } from "react";
import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useSimpleAuth } from "@/hooks/use-simple-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ArrowLeft, 
  Radio, 
  Users, 
  Video, 
  VideoOff,
  Mic, 
  MicOff, 
  MessageSquare, 
  Hand,
  ScreenShare,
  ScreenShareOff,
  Smile,
  Grid3X3,
  Maximize2,
  PictureInPicture2,
  LogOut,
  Rows3,
  Square,
  Settings,
  LayoutGrid,
  ChevronRight,
  ChevronUp,
  Calendar as CalendarIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// Jitsi Meet types
declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

interface LiveParticipant {
  id: string;
  name: string;
  avatar?: string;
  isHost?: boolean;
  isMuted?: boolean;
  isVideoOff?: boolean;
  hasHandRaised?: boolean;
}

interface LiveEventDetails {
  id: string;
  title: string;
  hostName: string;
  hostRole?: string;
  hostAvatar?: string;
  streamUrl?: string;
  isRecording?: boolean;
  participants: LiveParticipant[];
  isLive: boolean;
  startTime?: string;
  endTime?: string;
}

export default function LiveRoom() {
  const [, params] = useRoute("/live/:eventId");
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useSimpleAuth();
  const [hasJoined, setHasJoined] = useState(false);
  
  // Jitsi API reference
  const jitsiApiRef = useRef<any>(null);
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  
  // Controls state
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [hasHandRaised, setHasHandRaised] = useState(false);
  
  // Panels state
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showViewOptions, setShowViewOptions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  
  // Participants list from Jitsi
  const [participants, setParticipants] = useState<LiveParticipant[]>([]);
  const [participantCount, setParticipantCount] = useState(1);
  
  // View mode: 'speaker-top' | 'speaker-side' | 'gallery'
  const [viewMode, setViewMode] = useState<'speaker-top' | 'speaker-side' | 'gallery'>('speaker-top');
  
  // Speaker tiles slider (how many participants to show)
  const [speakerTiles, setSpeakerTiles] = useState(5);

  // Fetch live event details - try from live-event API first, then fallback to events API
  const { data: eventDetails, isLoading: eventLoading, error: eventError } = useQuery<LiveEventDetails>({
    queryKey: ['/api/community/live-event', params?.eventId],
    queryFn: async () => {
      try {
        // Try live-event API first
        const res = await fetch(`/api/community/live-event/${params?.eventId}`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          // Ensure startTime and endTime are included
          return {
            ...data,
            startTime: data.startTime,
            endTime: data.endTime,
          };
        }
        
        // If not found, try events API as fallback
        const eventRes = await fetch(`/api/events/${params?.eventId}`, { credentials: 'include' });
        if (eventRes.ok) {
          const eventData = await eventRes.json();
          return {
            id: eventData.id,
            title: eventData.title,
            description: eventData.description,
            hostName: eventData.hostName,
            hostAvatar: eventData.hostAvatar,
            hostRole: eventData.hostRole,
            streamUrl: undefined,
            isRecording: false,
            isLive: eventData.isLive || false,
            startTime: eventData.startTime,
            endTime: eventData.endTime,
            participants: [],
          };
        }
        
        throw new Error('Event not found');
      } catch (error) {
        console.error('Error fetching event:', error);
        // Return fallback data with event ID
        return {
          id: params?.eventId || 'live-1',
          title: 'Evento en vivo',
          hostName: 'Host',
          hostRole: undefined,
          hostAvatar: undefined,
          streamUrl: undefined,
          isRecording: false,
          isLive: true,
          participants: [],
        };
      }
    },
    enabled: !!params?.eventId,
    retry: false,
  });

  // Generate unique room name based on event ID
  const getRoomName = useCallback(() => {
    const eventId = params?.eventId || 'comunidad-nocode';
    return `ExpertosNoCodeIA-${eventId}`;
  }, [params?.eventId]);

  // Load Jitsi Meet External API script
  const loadJitsiScript = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      if (window.JitsiMeetExternalAPI) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://meet.jit.si/external_api.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Jitsi script'));
      document.head.appendChild(script);
    });
  }, []);

  // Update participants list from Jitsi
  const updateParticipantsList = useCallback(() => {
    if (!jitsiApiRef.current) return;
    
    try {
      const participantsInfo = jitsiApiRef.current.getParticipantsInfo();
      const count = jitsiApiRef.current.getNumberOfParticipants();
      
      if (Array.isArray(participantsInfo)) {
        const mappedParticipants: LiveParticipant[] = participantsInfo.map((p: any, index: number) => ({
          id: p.participantId || `participant-${index}`,
          name: p.displayName || p.formattedDisplayName || 'Participante',
          avatar: p.avatarURL,
          isHost: index === 0,
          isMuted: p.isAudioMuted,
          isVideoOff: p.isVideoMuted,
          hasHandRaised: p.raisedHand,
        }));
        setParticipants(mappedParticipants);
      }
      
      setParticipantCount(count);
    } catch (error) {
      console.error('Error updating participants:', error);
    }
  }, []);

  // Initialize Jitsi Meet
  const initializeJitsi = useCallback(async () => {
    try {
      await loadJitsiScript();

      if (!jitsiContainerRef.current || jitsiApiRef.current) return;

      const roomName = getRoomName();
      const displayName = user?.firstName 
        ? `${user.firstName} ${user.lastName || ''}`.trim() 
        : 'Participante';

      const domain = 'meet.jit.si';
      const options = {
        roomName: roomName,
        width: '100%',
        height: '100%',
        parentNode: jitsiContainerRef.current,
        userInfo: {
          displayName: displayName,
          email: user?.email || '',
        },
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          prejoinPageEnabled: false,
          disableDeepLinking: true,
          enableClosePage: false,
          disableInviteFunctions: true,
          enableWelcomePage: false,
          enableLobbyChat: true,
          toolbarButtons: [],
          hideConferenceSubject: true,
          hideConferenceTimer: false,
          disableRemoteMute: false,
          remoteVideoMenu: {
            disableKick: true,
            disableGrantModerator: true,
          },
          fileRecordingsEnabled: false,
          liveStreamingEnabled: false,
          resolution: 720,
          constraints: {
            video: {
              height: { ideal: 720, max: 720, min: 180 }
            }
          },
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_BRAND_WATERMARK: false,
          BRAND_WATERMARK_LINK: '',
          SHOW_POWERED_BY: false,
          SHOW_PROMOTIONAL_CLOSE_PAGE: false,
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: false,
          FILM_STRIP_MAX_HEIGHT: 0,
          ENABLE_FEEDBACK_ANIMATION: false,
          DISABLE_FOCUS_INDICATOR: true,
          DISABLE_DOMINANT_SPEAKER_INDICATOR: false,
          TOOLBAR_ALWAYS_VISIBLE: false,
          TOOLBAR_TIMEOUT: 4000,
          VIDEO_LAYOUT_FIT: 'both',
          HIDE_INVITE_MORE_HEADER: true,
          MOBILE_APP_PROMO: false,
          TILE_VIEW_MAX_COLUMNS: 5,
          filmStripOnly: false,
          VERTICAL_FILMSTRIP: false,
        },
      };

      const api = new window.JitsiMeetExternalAPI(domain, options);
      jitsiApiRef.current = api;

      // Event listeners
      api.addListener('videoConferenceJoined', () => {
        console.log('Joined the conference');
        toast({
          title: "¡Conectado!",
          description: "Te has unido a la sala en vivo",
        });
        const currentUser: LiveParticipant = {
          id: 'current-user',
          name: displayName,
          isHost: false,
          isMuted: false,
          isVideoOff: false,
        };
        setParticipants(prev => {
          if (prev.some(p => p.id === 'current-user')) return prev;
          return [...prev, currentUser];
        });
        updateParticipantsList();
      });

      api.addListener('videoConferenceLeft', () => {
        console.log('Left the conference');
      });

      api.addListener('participantJoined', (participant: any) => {
        console.log('Participant joined:', participant);
        const newParticipant: LiveParticipant = {
          id: participant.id,
          name: participant.displayName || 'Participante',
          isMuted: true,
          isVideoOff: true,
        };
        setParticipants(prev => {
          if (prev.some(p => p.id === participant.id)) return prev;
          return [...prev, newParticipant];
        });
        updateParticipantsList();
      });

      api.addListener('participantLeft', (participant: any) => {
        console.log('Participant left:', participant);
        setParticipants(prev => prev.filter(p => p.id !== participant.id));
        updateParticipantsList();
      });

      api.addListener('audioMuteStatusChanged', (data: { muted: boolean }) => {
        setIsMuted(data.muted);
      });

      api.addListener('videoMuteStatusChanged', (data: { muted: boolean }) => {
        setIsVideoOff(data.muted);
      });

      api.addListener('screenSharingStatusChanged', (data: { on: boolean }) => {
        setIsScreenSharing(data.on);
      });

      api.addListener('raiseHandUpdated', (data: { handRaised: boolean }) => {
        setHasHandRaised(data.handRaised);
      });

      // Initialize with mock participants for demo
      const mockParticipants: LiveParticipant[] = [
        { id: 'host', name: eventDetails?.hostName || 'Rafael Araújo', isHost: true, isMuted: false, isVideoOff: false },
        { id: 'current-user', name: displayName, isHost: false, isMuted: false, isVideoOff: false },
        { id: 'p1', name: 'Lucas Gabriel Ro.', isHost: false, isMuted: true, isVideoOff: false },
        { id: 'p2', name: 'Augusto Reis', isHost: false, isMuted: true, isVideoOff: true },
        { id: 'p3', name: 'Karine De Paula B.', isHost: false, isMuted: false, isVideoOff: false },
        { id: 'p4', name: 'Utilis Pro', isHost: false, isMuted: true, isVideoOff: false },
      ];
      setParticipants(mockParticipants);
      setParticipantCount(mockParticipants.length);

    } catch (error) {
      console.error('Error initializing Jitsi:', error);
      toast({
        title: "Error",
        description: "No se pudo conectar a la sala de video",
        variant: "destructive",
      });
    }
  }, [loadJitsiScript, getRoomName, user, toast, updateParticipantsList, eventDetails?.hostName]);

  // Toggle microphone
  const toggleMic = useCallback(() => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand('toggleAudio');
    }
  }, []);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand('toggleVideo');
    }
  }, []);

  // Toggle screen sharing
  const toggleScreenShare = useCallback(() => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand('toggleShareScreen');
    }
  }, []);

  // Raise/lower hand
  const toggleHand = useCallback(() => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand('toggleRaiseHand');
    }
  }, []);

  // Toggle chat panel in Jitsi
  const toggleJitsiChat = useCallback(() => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand('toggleChat');
    }
    setShowChat(!showChat);
  }, [showChat]);

  // Toggle participants panel
  const toggleParticipantsPanel = useCallback(() => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand('toggleParticipantsPane');
    }
    setShowParticipants(!showParticipants);
  }, [showParticipants]);

  // Toggle tile view (gallery mode)
  const toggleTileView = useCallback(() => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand('toggleTileView');
    }
  }, []);

  // Send reaction
  const sendReaction = useCallback((emoji: string) => {
    if (jitsiApiRef.current) {
      const reactionMap: { [key: string]: string } = {
        '👍': 'thumbs_up',
        '👏': 'clap',
        '❤️': 'heart',
        '😂': 'smile',
        '🎉': 'party',
        '🔥': 'fire',
      };
      const reaction = reactionMap[emoji] || 'thumbs_up';
      jitsiApiRef.current.executeCommand('sendEndpointTextMessage', '', `reaction:${reaction}`);
    }
    toast({
      title: emoji,
      description: "Reacción enviada",
    });
    setShowReactions(false);
  }, [toast]);

  // Leave meeting
  const leaveMeeting = useCallback(() => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand('hangup');
      jitsiApiRef.current.dispose();
      jitsiApiRef.current = null;
    }
    setHasJoined(false);
    setParticipants([]);
    toast({
      title: "Has salido del evento",
      description: "Puedes volver a unirte en cualquier momento",
    });
  }, [toast]);

  // Fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  // Picture in Picture
  const togglePiP = useCallback(async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        // Try to find any video element and enable PiP
        const videos = document.querySelectorAll('video');
        if (videos.length > 0) {
          await (videos[0] as HTMLVideoElement).requestPictureInPicture();
        } else {
          toast({
            title: "Picture-in-Picture",
            description: "No hay video disponible para PiP",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Picture-in-Picture",
        description: "No se pudo activar PiP",
      });
    }
  }, [toast]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Acceso requerido",
        description: "Debes iniciar sesión para unirte al evento en vivo",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/simple-login";
      }, 500);
    }
  }, [isAuthenticated, isLoading, toast]);

  // Initialize Jitsi when joining
  useEffect(() => {
    if (hasJoined && jitsiContainerRef.current && !jitsiApiRef.current) {
      initializeJitsi();
    }
  }, [hasJoined, initializeJitsi]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
        jitsiApiRef.current = null;
      }
    };
  }, []);

  const handleJoinLive = () => {
    setHasJoined(true);
  };

  if (isLoading || eventLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Cargando evento...</div>
      </div>
    );
  }

  // Show error state if event not found and no fallback data
  if (eventError && !eventDetails) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
        <div className="w-full max-w-md mx-auto text-center">
          <div className="bg-card rounded-2xl p-8 border border-border">
            <h1 className="text-2xl font-bold text-foreground mb-4">Evento no encontrado</h1>
            <p className="text-gray-400 mb-6">
              El evento con ID {params?.eventId} no existe o no está disponible.
            </p>
            <Link href="/events">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a eventos
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const event = eventDetails;
  const visibleParticipants = event?.participants?.slice(0, 3) || [];
  const remainingCount = Math.max(0, (event?.participants?.length || 0) - 3);
  const firstParticipant = event?.participants?.[0];

  // Calculate event timing status
  const now = new Date();
  const eventStartTime = event?.startTime ? new Date(event.startTime) : null;
  const eventEndTime = event?.endTime ? new Date(event.endTime) : null;
  const isEventUpcoming = eventStartTime ? eventStartTime > now : false;
  const isEventPast = eventEndTime ? eventEndTime < now : false;
  const isEventCurrentlyLive = event?.isLive || (eventStartTime && eventEndTime ? now >= eventStartTime && now <= eventEndTime : false);

  // Participant colors for avatars
  const avatarColors = ['#22c55e', '#ec4899', '#f97316', '#06b6d4', '#8b5cf6', '#eab308', '#ef4444', '#14b8a6'];
  const getAvatarColor = (index: number) => avatarColors[index % avatarColors.length];

  // Get visible participants based on slider value
  const displayedParticipants = participants.slice(0, speakerTiles);

  // Pre-join lobby view
  if (!hasJoined) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
        <div className="w-full max-w-md mx-auto">
          {/* Event Card */}
          <div className="bg-card rounded-2xl p-8 text-center border border-border">
            {/* Live indicator - solo mostrar si está en vivo */}
            {isEventCurrentlyLive && !isEventPast && (
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="flex items-center gap-1 bg-red-500/20 text-red-400 text-sm px-3 py-1 rounded-full">
                  <Radio className="h-3 w-3 animate-pulse" />
                  EN VIVO
                </span>
              </div>
            )}
            
            {/* Mensaje para evento futuro */}
            {isEventUpcoming && (
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="flex items-center gap-1 bg-blue-500/20 text-blue-400 text-sm px-3 py-1 rounded-full">
                  <CalendarIcon className="h-3 w-3" />
                  PRÓXIMAMENTE
                </span>
              </div>
            )}
            
            {/* Mensaje para evento pasado */}
            {isEventPast && (
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="flex items-center gap-1 bg-gray-500/20 text-gray-400 text-sm px-3 py-1 rounded-full">
                  FINALIZADO
                </span>
              </div>
            )}
            
            {/* Event Title */}
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {event?.title}
            </h1>
            
            {/* Host Info */}
            <p className="text-gray-400 mb-6">
              Hosted by <span className="text-foreground font-medium">{event?.hostName}</span>
              {event?.hostRole && ` - ${event.hostRole}`}
            </p>
            
            {/* Mostrar fecha/hora si el evento es futuro */}
            {isEventUpcoming && eventStartTime && (
              <div className="bg-muted rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-400 mb-1">El evento comenzará el:</p>
                <p className="text-foreground font-semibold">
                  {format(eventStartTime, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                </p>
                <p className="text-cyan-400 text-sm mt-1">
                  {format(eventStartTime, "h:mm a", { locale: es })}
                </p>
              </div>
            )}
            
            {/* Participants Avatars - solo mostrar si hay participantes y el evento está en vivo */}
            {visibleParticipants.length > 0 && isEventCurrentlyLive && !isEventPast && (
              <div className="flex items-center justify-center mb-3">
                <div className="flex -space-x-2">
                  {visibleParticipants.map((participant, idx) => (
                    <Avatar 
                      key={participant.id} 
                      className="h-10 w-10 border-2 border-card"
                    >
                      <AvatarImage src={participant.avatar} />
                      <AvatarFallback 
                        className="text-foreground text-xs font-bold"
                        style={{ backgroundColor: getAvatarColor(idx) }}
                      >
                        {participant.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {remainingCount > 0 && (
                    <div className="h-10 w-10 rounded-full bg-background border-2 border-card flex items-center justify-center text-foreground text-xs font-medium">
                      +{remainingCount}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Participants Count - solo mostrar si está en vivo */}
            {isEventCurrentlyLive && !isEventPast && visibleParticipants.length > 0 && (
              <p className="text-gray-400 text-sm mb-6">
                {firstParticipant?.name} {(event?.participants?.length || 1) > 1 && `& ${(event?.participants?.length || 1) - 1} others`} are in this live
              </p>
            )}
            
            {/* Room name info */}
            <div className="bg-muted rounded-lg p-3 mb-4">
              <p className="text-xs text-gray-400 mb-1">Sala de video:</p>
              <p className="text-cyan-400 font-mono text-sm">{getRoomName()}</p>
            </div>
            
            {/* Join Button - deshabilitar si el evento es futuro o pasado */}
            <Button
              onClick={handleJoinLive}
              disabled={isEventUpcoming || isEventPast}
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-semibold py-6 text-lg rounded-full mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isEventUpcoming ? "El evento aún no ha comenzado" : isEventPast ? "El evento ha finalizado" : "Unirse al Live"}
            </Button>
            
            {/* Powered by Jitsi */}
            <p className="text-xs text-gray-500">
              Powered by Jitsi Meet • 100% Gratis
            </p>
          </div>
          
          {/* Back Link */}
          <div className="text-center mt-6">
            <Link href="/community">
              <span className="text-gray-400 hover:text-foreground transition-colors flex items-center justify-center gap-2 cursor-pointer">
                <ArrowLeft className="h-4 w-4" />
                Volver a la comunidad
              </span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Participant Thumbnail Component
  const ParticipantThumbnail = ({ participant, index, size = 'normal' }: { participant: LiveParticipant; index: number; size?: 'normal' | 'small' | 'large' }) => {
    const sizeClasses = {
      small: 'w-full h-14',
      normal: 'w-28 h-20',
      large: 'w-full h-full min-h-[100px]',
    }[size];
    
    const avatarSize = {
      small: 'h-8 w-8',
      normal: 'h-10 w-10',
      large: 'h-14 w-14',
    }[size];
    
    const textSize = {
      small: 'text-xs',
      normal: 'text-sm',
      large: 'text-lg',
    }[size];
    
    return (
      <div 
        className={cn(
          "relative flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all",
          sizeClasses,
          participant.isHost 
            ? "border-green-500" 
            : participant.id === 'current-user'
              ? "border-cyan-500" 
              : "border-border"
        )}
      >
        {/* Video placeholder or avatar */}
        <div 
          className="w-full h-full flex items-center justify-center"
          style={{ backgroundColor: participant.isVideoOff ? '#2a2a2a' : getAvatarColor(index) + '40' }}
        >
          <Avatar className={avatarSize}>
            <AvatarImage src={participant.avatar} />
            <AvatarFallback 
              className={cn("text-foreground font-bold", textSize)}
              style={{ backgroundColor: getAvatarColor(index) }}
            >
              {participant.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
        
        {/* Host indicator */}
        {participant.isHost && (
          <div className="absolute top-1 left-1 bg-green-500 rounded-full p-0.5">
            <div className="w-2 h-2 bg-white rounded-full" />
          </div>
        )}
        
        {/* Mute indicator */}
        {participant.isMuted && (
          <div className="absolute top-1 right-1 bg-red-500 rounded-full p-0.5">
            <MicOff className="h-2.5 w-2.5 text-foreground" />
          </div>
        )}
        
        {/* Hand raised indicator */}
        {participant.hasHandRaised && (
          <div className="absolute top-1 left-1 bg-yellow-500 rounded-full p-0.5">
            <Hand className="h-2.5 w-2.5 text-black" />
          </div>
        )}
        
        {/* Name label */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-1 py-0.5 flex items-center gap-1">
          {participant.isMuted && <MicOff className="h-2.5 w-2.5 text-red-400 flex-shrink-0" />}
          <p className="text-[10px] text-foreground truncate flex-1">
            {participant.name.length > 12 ? participant.name.slice(0, 10) + '...' : participant.name}
          </p>
        </div>
      </div>
    );
  };

  // Live room view (after joining)
  return (
    <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden">
      {/* Main Layout based on viewMode */}
      <div className="flex-1 flex overflow-hidden">
        {/* Side participants (speaker-side mode) */}
        {viewMode === 'speaker-side' && (
          <div className="w-20 flex-shrink-0 bg-card border-r border-border p-1.5 flex flex-col gap-1.5 overflow-y-auto">
            {displayedParticipants.map((participant, idx) => (
              <ParticipantThumbnail 
                key={participant.id} 
                participant={participant} 
                index={idx}
                size="small"
              />
            ))}
            {participants.length > speakerTiles && (
              <div className="flex-shrink-0 w-full h-10 rounded-lg bg-muted border border-border flex items-center justify-center">
                <span className="text-[10px] text-gray-400">+{participants.length - speakerTiles}</span>
              </div>
            )}
          </div>
        )}
        
        {/* Main content area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top participants strip (speaker-top mode) */}
          {viewMode === 'speaker-top' && (
            <div className="flex-shrink-0 bg-card border-b border-border p-2">
              <div className="flex items-center gap-2 overflow-x-auto">
                {displayedParticipants.map((participant, idx) => (
                  <ParticipantThumbnail 
                    key={participant.id} 
                    participant={participant} 
                    index={idx}
                  />
                ))}
                {participants.length > speakerTiles && (
                  <div className="flex-shrink-0 w-28 h-20 rounded-lg bg-muted border-2 border-border flex items-center justify-center">
                    <span className="text-sm text-gray-400">+{participants.length - speakerTiles} más</span>
                  </div>
                )}
                {displayedParticipants.length > 6 && (
                  <div className="flex-shrink-0 w-8 h-20 flex items-center justify-center">
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Gallery mode - grid of all participants */}
          {viewMode === 'gallery' ? (
            <div className="flex-1 p-4 overflow-auto">
              <div 
                className="grid gap-2 h-full"
                style={{
                  gridTemplateColumns: `repeat(${Math.min(Math.ceil(Math.sqrt(displayedParticipants.length)), 4)}, 1fr)`,
                }}
              >
                {displayedParticipants.map((participant, idx) => (
                  <ParticipantThumbnail 
                    key={participant.id} 
                    participant={participant} 
                    index={idx}
                    size="large"
                  />
                ))}
              </div>
            </div>
          ) : (
            /* Main Jitsi Container (speaker modes) */
            <div className="flex-1 relative">
              <div 
                ref={jitsiContainerRef} 
                className="absolute inset-0"
                style={{ width: '100%', height: '100%' }}
              />
              
              {/* Overlay controls - Top Right */}
              <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-black/60 hover:bg-black/80 text-foreground backdrop-blur-sm"
                  onClick={togglePiP}
                >
                  <PictureInPicture2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-black/60 hover:bg-black/80 text-foreground backdrop-blur-sm"
                  onClick={toggleFullscreen}
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Event title overlay - Top Left */}
              <div className="absolute top-4 left-4 z-10">
                <div className="bg-black/60 backdrop-blur-sm rounded-lg px-4 py-2">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 bg-red-500 text-foreground text-xs px-2 py-0.5 rounded">
                      <Radio className="h-2.5 w-2.5 animate-pulse" />
                      LIVE
                    </span>
                    <span className="text-foreground text-sm font-medium">{event?.title}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Bottom Control Bar */}
      <div className="flex-shrink-0 bg-card border-t border-border px-4 py-3 z-20">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          {/* Left controls */}
          <div className="flex items-center gap-1">
            {/* Raise Hand */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleHand}
              className={cn(
                "h-10 w-10 rounded-full",
                hasHandRaised ? "bg-yellow-500 text-black hover:bg-yellow-600" : "bg-muted text-foreground hover:bg-background"
              )}
              title="Levantar mano"
            >
              <Hand className="h-5 w-5" />
            </Button>
            
            {/* Reactions */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowReactions(!showReactions)}
                className="h-10 w-10 rounded-full bg-muted text-foreground hover:bg-background"
                title="Reacciones"
              >
                <Smile className="h-5 w-5" />
              </Button>
              
              {showReactions && (
                <div className="absolute bottom-full left-0 mb-2 bg-muted border border-border rounded-lg p-2 flex gap-1 z-50">
                  {['👍', '❤️', '😂', '👏', '🎉', '🔥'].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => sendReaction(emoji)}
                      className="text-xl hover:scale-125 transition-transform p-1"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Center controls */}
          <div className="flex items-center gap-2">
            {/* Microphone */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMic}
              className={cn(
                "h-12 w-12 rounded-full",
                isMuted ? "bg-red-500 text-foreground hover:bg-red-600" : "bg-muted text-foreground hover:bg-background"
              )}
              title={isMuted ? "Activar micrófono" : "Desactivar micrófono"}
            >
              {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
            
            {/* Camera */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleVideo}
              className={cn(
                "h-12 w-12 rounded-full",
                isVideoOff ? "bg-red-500 text-foreground hover:bg-red-600" : "bg-muted text-foreground hover:bg-background"
              )}
              title={isVideoOff ? "Activar cámara" : "Desactivar cámara"}
            >
              {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
            </Button>
            
            {/* Screen Share */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleScreenShare}
              className={cn(
                "h-12 w-12 rounded-full",
                isScreenSharing ? "bg-cyan-500 text-black hover:bg-cyan-600" : "bg-muted text-foreground hover:bg-background"
              )}
              title={isScreenSharing ? "Dejar de compartir" : "Compartir pantalla"}
            >
              {isScreenSharing ? <ScreenShareOff className="h-5 w-5" /> : <ScreenShare className="h-5 w-5" />}
            </Button>
          </div>
          
          {/* Right controls */}
          <div className="flex items-center gap-2">
            {/* Chat */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleJitsiChat}
              className={cn(
                "h-10 w-10 rounded-full",
                showChat ? "bg-cyan-500 text-black" : "bg-muted text-foreground hover:bg-background"
              )}
              title="Chat"
            >
              <MessageSquare className="h-5 w-5" />
            </Button>
            
            {/* Participants */}
            <Button
              variant="ghost"
              onClick={toggleParticipantsPanel}
              className={cn(
                "h-10 rounded-full px-3 gap-1",
                showParticipants ? "bg-cyan-500 text-black" : "bg-muted text-foreground hover:bg-background"
              )}
              title="Participantes"
            >
              <Users className="h-4 w-4" />
              <span className="text-sm">{participantCount}</span>
            </Button>
            
            {/* View Options */}
            <div className="relative">
              <Button
                variant="ghost"
                onClick={() => setShowViewOptions(!showViewOptions)}
                className={cn(
                  "h-10 rounded-full px-3 gap-1",
                  showViewOptions ? "bg-cyan-500 text-black" : "bg-muted text-foreground hover:bg-background"
                )}
                title="Vista"
              >
                <LayoutGrid className="h-4 w-4" />
                <span className="text-sm">View</span>
                <ChevronUp className={cn("h-3 w-3 transition-transform", showViewOptions && "rotate-180")} />
              </Button>
              
              {showViewOptions && (
                <div className="absolute bottom-full right-0 mb-2 bg-muted border border-border rounded-xl p-4 w-80 z-50 shadow-xl">
                  {/* View mode options */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <button
                      onClick={() => setViewMode('speaker-top')}
                      className={cn(
                        "flex flex-col items-center gap-2 p-3 rounded-lg border transition-all",
                        viewMode === 'speaker-top' 
                          ? "border-cyan-500 bg-cyan-500/10" 
                          : "border-border hover:bg-background hover:border-border"
                      )}
                    >
                      <div className="w-12 h-8 border border-current rounded flex flex-col">
                        <div className="h-2 border-b border-current flex gap-px p-px">
                          <div className="flex-1 bg-current rounded-sm opacity-60" />
                          <div className="flex-1 bg-current rounded-sm opacity-60" />
                          <div className="flex-1 bg-current rounded-sm opacity-60" />
                        </div>
                        <div className="flex-1" />
                      </div>
                      <span className="text-xs">Speaker - top</span>
                    </button>
                    <button
                      onClick={() => setViewMode('speaker-side')}
                      className={cn(
                        "flex flex-col items-center gap-2 p-3 rounded-lg border transition-all",
                        viewMode === 'speaker-side' 
                          ? "border-cyan-500 bg-cyan-500/10" 
                          : "border-border hover:bg-background hover:border-border"
                      )}
                    >
                      <div className="w-12 h-8 border border-current rounded flex">
                        <div className="w-3 border-r border-current flex flex-col gap-px p-px">
                          <div className="flex-1 bg-current rounded-sm opacity-60" />
                          <div className="flex-1 bg-current rounded-sm opacity-60" />
                          <div className="flex-1 bg-current rounded-sm opacity-60" />
                        </div>
                        <div className="flex-1" />
                      </div>
                      <span className="text-xs">Speaker - side</span>
                    </button>
                    <button
                      onClick={() => { 
                        setViewMode('gallery');
                        toggleTileView();
                      }}
                      className={cn(
                        "flex flex-col items-center gap-2 p-3 rounded-lg border transition-all",
                        viewMode === 'gallery' 
                          ? "border-cyan-500 bg-cyan-500/10" 
                          : "border-border hover:bg-background hover:border-border"
                      )}
                    >
                      <div className="w-12 h-8 border border-current rounded grid grid-cols-2 gap-px p-1">
                        <div className="bg-current rounded-sm opacity-60" />
                        <div className="bg-current rounded-sm opacity-60" />
                        <div className="bg-current rounded-sm opacity-60" />
                        <div className="bg-current rounded-sm opacity-60" />
                      </div>
                      <span className="text-xs">Gallery</span>
                    </button>
                  </div>
                  
                  {/* Speaker tiles slider */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm text-gray-400">Speaker tiles</label>
                      <span className="text-sm text-cyan-400">{speakerTiles}</span>
                    </div>
                    <input 
                      type="range" 
                      min="2" 
                      max="10" 
                      value={speakerTiles}
                      onChange={(e) => setSpeakerTiles(parseInt(e.target.value))}
                      className="w-full h-1 bg-[#444] rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>2</span>
                      <span>10</span>
                    </div>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-border bg-transparent hover:bg-background text-foreground"
                      onClick={() => {
                        toggleFullscreen();
                        setShowViewOptions(false);
                      }}
                    >
                      <Maximize2 className="h-4 w-4 mr-1" />
                      Go full screen
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-border bg-transparent hover:bg-background text-foreground"
                      onClick={() => {
                        togglePiP();
                        setShowViewOptions(false);
                      }}
                    >
                      <PictureInPicture2 className="h-4 w-4 mr-1" />
                      Picture-in-picture
                    </Button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Settings */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (jitsiApiRef.current) {
                  jitsiApiRef.current.executeCommand('toggleSettings');
                }
              }}
              className="h-10 w-10 rounded-full bg-muted text-foreground hover:bg-background"
              title="Configuración"
            >
              <Settings className="h-5 w-5" />
            </Button>
            
            {/* Leave */}
            <Button
              onClick={leaveMeeting}
              className="bg-red-500 hover:bg-red-600 text-foreground font-semibold px-4 rounded-full gap-1"
            >
              <LogOut className="h-4 w-4" />
              Dejar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
