import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, Send, Reply, Heart } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

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

  const { data: comments = [], isLoading, refetch } = useQuery<Comment[]>({
    queryKey: ['/api/lessons', lessonId, 'comments'],
  });

  const createCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest('POST', `/api/lessons/${lessonId}/comments`, { content, lessonId });
    },
    onSuccess: async () => {
      setNewComment("");
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

  const handleSubmitComment = () => {
    if (newComment.trim()) {
      createCommentMutation.mutate(newComment);
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
    <div className="mt-12 pt-8 border-t border-border" id="comments">
      <div className="flex items-center gap-2 mb-6">
        <MessageCircle className="h-5 w-5" />
        <h2 className="text-xl font-semibold">
          Comentarios ({comments.length})
        </h2>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <Textarea
            placeholder="Comparte tus dudas, ideas o experiencias sobre esta lección..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[120px] mb-3"
            data-testid="textarea-new-comment"
          />
          <Button
            onClick={handleSubmitComment}
            disabled={createCommentMutation.isPending || !newComment.trim()}
            data-testid="button-submit-comment"
            className="bg-[#faa318] text-white hover:bg-[#faa318]/90"
          >
            <Send className="h-4 w-4 mr-2" />
            {createCommentMutation.isPending ? 'Publicando...' : 'Publicar comentario'}
          </Button>
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
