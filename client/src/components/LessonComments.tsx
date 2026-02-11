import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, Send, Reply, Heart, AlertCircle, Mail, Paperclip, X, File, Image as ImageIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { useSimpleAuth } from "@/hooks/use-simple-auth";
import { useLocation } from "wouter";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  userId: string;
  lessonId: string;
  parentCommentId: string | null;
  isAdminReviewed: boolean;
  depth: number;
  replyCount: number;
  likeCount: number;
  isLikedByCurrentUser?: boolean;
  metadata?: {
    attachmentUrl?: string;
    attachmentType?: 'image' | 'document';
    fileName?: string;
  };
  user: {
    firstName: string;
    lastName: string;
    profileImageUrl: string | null;
  };
  replies: Comment[];
}

interface LessonCommentsProps {
  lessonId: string;
}

interface CommentItemProps {
  comment: Comment;
  depth?: number;
  replyTo: string | null;
  setReplyTo: (id: string | null) => void;
  replyContents: Record<string, string>;
  setReplyContent: (commentId: string, content: string) => void;
  getReplyContent: (commentId: string) => string;
  handleSubmitReply: (parentId: string) => void;
  toggleLikeMutation: any;
  createReplyMutation: any;
  setReplyContents: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

const CommentItem = ({ 
  comment, 
  depth = 0, 
  replyTo, 
  setReplyTo,
  replyContents,
  getReplyContent, 
  setReplyContent, 
  handleSubmitReply, 
  toggleLikeMutation, 
  createReplyMutation,
  setReplyContents
}: CommentItemProps) => {
  const initials = `${comment.user.firstName[0]}${comment.user.lastName[0]}`.toUpperCase();
  const isReplying = replyTo === comment.id;

  return (
    <div 
      className={`${depth > 0 ? 'ml-8 mt-4 border-l-2 border-border pl-4' : 'mb-6'}`}
      data-testid={`comment-${comment.id}`}
    >
      <div className="flex gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={comment.user.profileImageUrl || undefined} />
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-medium text-sm" data-testid={`comment-author-${comment.id}`}>
              {comment.user.firstName} {comment.user.lastName}
            </span>
            <span className="text-xs text-muted-foreground" data-testid={`comment-time-${comment.id}`}>
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: es })}
            </span>
          </div>

          <p className="text-sm mb-2 whitespace-pre-wrap" data-testid={`comment-content-${comment.id}`}>
            {comment.content}
          </p>

          {/* Attachment display */}
          {comment.metadata?.attachmentUrl && (
            <div className="mt-2 mb-2">
              {comment.metadata.attachmentType === 'image' ? (
                <a 
                  href={comment.metadata.attachmentUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block"
                >
                  <img 
                    src={comment.metadata.attachmentUrl} 
                    alt={comment.metadata.fileName || "Adjunto"} 
                    className="max-w-full max-h-64 rounded-lg border border-border cursor-pointer hover:opacity-90 transition-opacity"
                  />
                </a>
              ) : (
                <a 
                  href={comment.metadata.attachmentUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  <File className="h-4 w-4" />
                  <span className="text-sm">{comment.metadata.fileName || "Documento adjunto"}</span>
                </a>
              )}
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className={`h-7 px-2 text-xs ${comment.isLikedByCurrentUser ? 'text-red-500' : ''}`}
              onClick={() => toggleLikeMutation.mutate(comment.id)}
              disabled={toggleLikeMutation.isPending}
              data-testid={`button-like-${comment.id}`}
            >
              <Heart 
                className={`h-3 w-3 mr-1 ${comment.isLikedByCurrentUser ? 'fill-current' : ''}`}
              />
              {comment.likeCount > 0 && <span>{comment.likeCount}</span>}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setReplyTo(isReplying ? null : comment.id)}
              data-testid={`button-reply-${comment.id}`}
            >
              <Reply className="h-3 w-3 mr-1" />
              Responder
            </Button>
          </div>

          {isReplying && (
            <div className="mt-3 space-y-2" data-testid={`reply-form-${comment.id}`}>
              <Textarea
                placeholder="Escribe tu respuesta..."
                value={getReplyContent(comment.id)}
                onChange={(e) => setReplyContent(comment.id, e.target.value)}
                className="min-h-[80px] text-sm"
                data-testid={`textarea-reply-${comment.id}`}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleSubmitReply(comment.id)}
                  disabled={createReplyMutation.isPending || !getReplyContent(comment.id).trim()}
                  data-testid={`button-submit-reply-${comment.id}`}
                >
                  <Send className="h-3 w-3 mr-1" />
                  {createReplyMutation.isPending ? 'Enviando...' : 'Enviar'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setReplyTo(null);
                    setReplyContents(prev => {
                      const newContents = { ...prev };
                      delete newContents[comment.id];
                      return newContents;
                    });
                  }}
                  data-testid={`button-cancel-reply-${comment.id}`}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4">
              {comment.replies.map((reply) => (
                <CommentItem 
                  key={reply.id} 
                  comment={reply} 
                  depth={depth + 1}
                  replyTo={replyTo}
                  setReplyTo={setReplyTo}
                  replyContents={replyContents}
                  getReplyContent={getReplyContent}
                  setReplyContent={setReplyContent}
                  handleSubmitReply={handleSubmitReply}
                  toggleLikeMutation={toggleLikeMutation}
                  createReplyMutation={createReplyMutation}
                  setReplyContents={setReplyContents}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export function LessonComments({ lessonId }: LessonCommentsProps) {
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContents, setReplyContents] = useState<Record<string, string>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const { data: comments = [], isLoading, refetch } = useQuery<Comment[]>({
    queryKey: ['/api/lessons', lessonId, 'comments'],
  });

  const uploadAttachmentMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/comments/upload-attachment', {
        method: 'POST',
        body: formData,
        headers: {
          // Don't set Content-Type, let browser set it with boundary
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al subir el archivo');
      }

      return response.json();
    },
  });

  const createCommentMutation = useMutation({
    mutationFn: async ({ content, attachmentUrl }: { content: string; attachmentUrl?: string | null }) => {
      return apiRequest('POST', `/api/lessons/${lessonId}/comments`, { content, lessonId, attachmentUrl });
    },
    onSuccess: async () => {
      setNewComment("");
      setSelectedFile(null);
      setAttachmentUrl(null);
      // Force refetch instead of invalidation
      await refetch();
    },
  });

  const createReplyMutation = useMutation({
    mutationFn: async ({ parentId, content }: { parentId: string; content: string }) => {
      return apiRequest('POST', `/api/comments/${parentId}/replies`, { content, lessonId });
    },
    onSuccess: async (_, variables) => {
      setReplyTo(null);
      setReplyContents(prev => {
        const newContents = { ...prev };
        delete newContents[variables.parentId];
        return newContents;
      });
      // Force refetch instead of invalidation
      await refetch();
    },
  });

  const toggleLikeMutation = useMutation({
    mutationFn: async (commentId: string) => {
      return apiRequest('POST', `/api/comments/${commentId}/like`, {});
    },
    onSuccess: async () => {
      // Force refetch to update like counts and state
      await refetch();
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "El archivo es demasiado grande. El tamaño máximo es 10MB.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setIsUploading(true);

    try {
      const result = await uploadAttachmentMutation.mutateAsync(file);
      setAttachmentUrl(result.attachmentUrl);
      toast({
        title: "Archivo adjuntado",
        description: "El archivo se ha adjuntado correctamente.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al subir el archivo",
        variant: "destructive",
      });
      setSelectedFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAttachment = () => {
    setSelectedFile(null);
    setAttachmentUrl(null);
  };

  const handleSubmitComment = async () => {
    if (newComment.trim() || attachmentUrl) {
      createCommentMutation.mutate({ content: newComment.trim(), attachmentUrl });
    }
  };

  const handleSubmitReply = (parentId: string) => {
    const content = replyContents[parentId] || "";
    if (content.trim()) {
      createReplyMutation.mutate({ parentId, content });
    }
  };

  const setReplyContent = (commentId: string, content: string) => {
    setReplyContents(prev => ({ ...prev, [commentId]: content }));
  };

  const getReplyContent = (commentId: string) => {
    return replyContents[commentId] || "";
  };

  return (
    <div className="lg:mt-0 mt-12 lg:pt-0 pt-8 lg:border-t-0 border-t border-border" id="comments">
      <div className="flex items-center gap-2 mb-4 lg:mb-6">
        <MessageCircle className="h-5 w-5" />
        <h2 className="text-lg lg:text-xl font-semibold">
          Comentarios ({comments.length})
        </h2>
      </div>

      <Card className="mb-4 lg:mb-6">
        <CardContent className="pt-4 lg:pt-6">
          <Textarea
            placeholder="Comparte tus dudas, ideas o experiencias sobre esta lección..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[100px] lg:min-h-[120px] mb-3 text-sm"
            data-testid="textarea-new-comment"
          />
          
          {/* File attachment section */}
          <div className="mb-3">
            <input
              type="file"
              id="comment-attachment"
              accept="image/*,.pdf,.doc,.docx,.txt"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isUploading || createCommentMutation.isPending}
            />
            <div className="flex items-center gap-2">
              <label
                htmlFor="comment-attachment"
                className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg cursor-pointer hover:bg-muted transition-colors text-sm"
              >
                <Paperclip className="h-4 w-4" />
                {isUploading ? 'Subiendo...' : 'Adjuntar archivo'}
              </label>
              
              {selectedFile && (
                <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg text-sm">
                  <File className="h-4 w-4" />
                  <span className="truncate max-w-[200px]">{selectedFile.name}</span>
                  <button
                    onClick={handleRemoveAttachment}
                    className="ml-2 hover:text-destructive transition-colors"
                    type="button"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
            
            {attachmentUrl && (
              <div className="mt-2">
                {attachmentUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                  <div className="relative inline-block">
                    <img 
                      src={attachmentUrl} 
                      alt="Vista previa" 
                      className="max-w-[200px] max-h-[150px] rounded-lg border border-border"
                    />
                    <button
                      onClick={handleRemoveAttachment}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                      type="button"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg text-sm">
                    <File className="h-4 w-4" />
                    <span>{selectedFile?.name || 'Documento adjunto'}</span>
                    <button
                      onClick={handleRemoveAttachment}
                      className="ml-2 hover:text-destructive transition-colors"
                      type="button"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSubmitComment}
              disabled={createCommentMutation.isPending || (!newComment.trim() && !attachmentUrl) || isUploading}
              data-testid="button-submit-comment"
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 text-sm"
            >
              <Send className="h-4 w-4 mr-2" />
              {createCommentMutation.isPending ? 'Publicando...' : 'Comentar'}
            </Button>
            {(selectedFile || attachmentUrl) && (
              <Button
                onClick={handleRemoveAttachment}
                variant="ghost"
                size="sm"
                className="text-sm"
                type="button"
              >
                Cancelar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="h-8 w-8 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-muted rounded" />
                <div className="h-12 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Sé el primero en comentar esta lección</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem 
              key={comment.id} 
              comment={comment}
              replyTo={replyTo}
              setReplyTo={setReplyTo}
              replyContents={replyContents}
              setReplyContent={setReplyContent}
              getReplyContent={getReplyContent}
              handleSubmitReply={handleSubmitReply}
              toggleLikeMutation={toggleLikeMutation}
              createReplyMutation={createReplyMutation}
              setReplyContents={setReplyContents}
            />
          ))}
        </div>
      )}
    </div>
  );
}
