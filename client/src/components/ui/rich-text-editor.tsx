import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import FontFamily from '@tiptap/extension-font-family';
import FontSize from '@tiptap/extension-font-size';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import UnderlineExtension from '@tiptap/extension-underline';
import Strike from '@tiptap/extension-strike';
import ListItem from '@tiptap/extension-list-item';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import Youtube from '@tiptap/extension-youtube';
import Placeholder from '@tiptap/extension-placeholder';
import { Node, Mark, mergeAttributes } from '@tiptap/core';
import { Button } from '@/components/ui/button';
import { VideoPlayer } from '@/components/ui/video-player';
import { Separator } from '@/components/ui/separator';
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify,
  List,
  ListOrdered,
  Image as ImageIcon,
  Link as LinkIcon,
  Undo,
  Redo,
  Quote,
  Code,
  Minus,
  Video,
  Youtube as YoutubeIcon,
  Indent,
  Outdent,
  Minus as MinusIcon,
  Plus as PlusIcon,
  Type,
  FileCode
} from 'lucide-react';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

// Line Height Extension - Extends TextStyle similar to FontSize
// Note: This extends TextStyle but we still need TextStyle as a separate extension
// for FontFamily and FontSize to work. Tiptap will handle the extension properly.
const LineHeight = TextStyle.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      lineHeight: {
        default: null,
        parseHTML: element => {
          const lineHeight = element.style.lineHeight;
          if (lineHeight) {
            return lineHeight;
          }
          return null;
        },
        renderHTML: attributes => {
          if (!attributes.lineHeight) {
            return {};
          }
          return {
            style: `line-height: ${attributes.lineHeight}`,
          };
        },
      },
    };
  },
  addCommands() {
    return {
      ...this.parent?.(),
      setLineHeight: (lineHeight: string) => ({ chain }) => {
        return chain()
          .setMark('textStyle', { lineHeight })
          .run();
      },
      unsetLineHeight: () => ({ chain }) => {
        return chain()
          .setMark('textStyle', { lineHeight: null })
          .removeEmptyTextStyle()
          .run();
      },
    };
  },
});

// Paragraph Spacing Extension - Custom paragraph with spacing support
const ParagraphSpacing = Node.create({
  name: 'paragraph',
  priority: 1000,
  group: 'block',
  content: 'inline*',
  parseHTML() {
    return [
      {
        tag: 'p',
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return ['p', mergeAttributes(HTMLAttributes), 0];
  },
  addAttributes() {
    return {
      style: {
        default: null,
        parseHTML: element => {
          const marginTop = element.style.marginTop || '';
          const marginBottom = element.style.marginBottom || '';
          if (marginTop || marginBottom) {
            return `margin-top: ${marginTop}; margin-bottom: ${marginBottom};`;
          }
          return null;
        },
        renderHTML: attributes => {
          if (!attributes.style) {
            return {};
          }
          return {
            style: attributes.style,
          };
        },
      },
    };
  },
});

// Custom Video extension for regular video files
const VideoExtension = Node.create({
  name: 'video',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      controls: {
        default: true,
      },
      width: {
        default: null,
      },
      height: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'video',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['video', mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ({ node, HTMLAttributes }) => {
      const container = document.createElement('div');
      container.className = 'video-wrapper my-4';
      
      const video = document.createElement('video');
      video.src = node.attrs.src;
      video.controls = node.attrs.controls;
      video.style.width = '100%';
      video.style.maxWidth = '600px';
      video.style.height = 'auto';
      video.className = 'rounded-lg bg-black';
      
      container.appendChild(video);
      
      return {
        dom: container,
      };
    };
  },
});

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({ content, onChange, placeholder = "Escribe tu contenido aquí...", className }: RichTextEditorProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [, forceUpdate] = useState({});
  const { toast } = useToast();
  // Track if update is from internal editor change to prevent loops
  const isInternalUpdate = useRef(false);
  const lastContentRef = useRef<string>('');

  const uploadImage = useCallback(async (file: File): Promise<string> => {
    setIsUploading(true);
    try {
      // Get auth token
      const token = localStorage.getItem('simpleAuthToken');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Get upload URL from working endpoint
      const uploadResponse = await fetch('/api/upload-image-url', {
        method: 'POST',
        headers,
      });
      
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('Failed to get upload URL. Status:', uploadResponse.status);
        console.error('Response:', errorText);
        throw new Error(`Error al obtener URL de subida: ${uploadResponse.status}`);
      }
      
      // First read the response as text, then try to parse as JSON
      const responseText = await uploadResponse.text();
      let uploadData;
      try {
        uploadData = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse JSON response:', responseText);
        console.error('Parse error:', parseError);
        throw new Error('Error: el servidor devolvió una respuesta inválida');
      }
      
      const { uploadURL, publicUrl } = uploadData;
      
      // Upload file directly to Google Cloud Storage
      if (uploadURL) {
        const uploadHeaders: Record<string, string> = {
          'Content-Type': file.type,
        };
        if (token) {
          uploadHeaders['Authorization'] = `Bearer ${token}`;
        }
        const fileUploadResponse = await fetch(uploadURL, {
          method: 'PUT',
          body: file,
          headers: uploadHeaders,
          credentials: 'include',
        });
        
        if (!fileUploadResponse.ok) {
          const errorText = await fileUploadResponse.text();
          console.error('Upload failed. Status:', fileUploadResponse.status);
          console.error('Error response:', errorText);
          throw new Error(`Error al subir imagen: ${fileUploadResponse.status}`);
        }
      }
      
      // Set ACL and get final URL  
      const aclHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        aclHeaders['Authorization'] = `Bearer ${token}`;
      }

      const aclResponse = await fetch('/api/lesson-images', {
        method: 'PUT',
        headers: aclHeaders,
        body: JSON.stringify({ imageURL: publicUrl || uploadURL }),
      });
      
      if (!aclResponse.ok) {
        throw new Error('Error al configurar imagen');
      }
      
      const { url } = await aclResponse.json();
      return url;
    } catch (error) {
      console.error('Error uploading image:', error);
      let errorMessage = "No se pudo subir la imagen";
      
      if (error instanceof Error) {
        errorMessage = error.message;
        console.error('Error details:', error.message, error.stack);
      } else {
        console.error('Unknown error type:', typeof error, error);
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsUploading(false);
    }
  }, [toast]);

  const fontSizeOptions = ['12px','14px','16px','18px','20px','24px','28px','32px','36px','48px'];
  const adjustFontSize = (direction: 'up' | 'down') => {
    if (!editor) return;
    const currentSize = editor.getAttributes('textStyle').fontSize || '16px';
    const currentIndex = fontSizeOptions.indexOf(currentSize);
    const safeIndex = currentIndex === -1 ? fontSizeOptions.indexOf('16px') : currentIndex;
    const nextIndex = direction === 'up'
      ? Math.min(safeIndex + 1, fontSizeOptions.length - 1)
      : Math.max(safeIndex - 1, 0);
    const nextSize = fontSizeOptions[nextIndex];
    if (nextSize === '16px') {
      editor.chain().focus().unsetFontSize().run();
    } else {
      editor.chain().focus().setFontSize(nextSize).run();
    }
    setTimeout(() => {
      const html = editor.getHTML();
      onChange(html);
    }, 100);
  };

  const editor: any = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: false,
        orderedList: false,
        listItem: false,
        link: false, // Disable default link to avoid conflicts
        strike: false, // Disable default strike to use custom
        underline: false, // Disable default underline to use custom extension
        paragraph: false, // Disable default paragraph to use custom one
      }),
      ParagraphSpacing,
      BulletList.configure({
        HTMLAttributes: {
          class: 'prose-bullet-list',
        },
      }),
      OrderedList.configure({
        HTMLAttributes: {
          class: 'prose-ordered-list',
        },
      }),
      ListItem,
      Image.configure({
        HTMLAttributes: {
          class: 'prose-image',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'prose-link',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      // TextStyle must come first as it's the base for other extensions
      TextStyle,
      // LineHeight extends TextStyle, so it needs to come after
      LineHeight,
      // FontFamily and FontSize depend on TextStyle
      FontFamily.configure({
        types: ['textStyle'],
      }),
      FontSize.configure({
        types: ['textStyle'],
      }),
      Color,
      UnderlineExtension,
      Strike,
      Youtube.configure({
        width: 640,
        height: 480,
        ccLanguage: 'es',
        modestBranding: true,
      }),
      VideoExtension,
      Placeholder.configure({
        placeholder: placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/905561d3-723c-4e00-9362-19164772151b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'rich-text-editor.tsx:369',message:'onUpdate triggered',data:{htmlLength:html.length,htmlPreview:html.substring(0,100),lastContentLength:lastContentRef.current.length,isInternalUpdate:isInternalUpdate.current,editorFocused:editor.isFocused},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      // Only trigger onChange if content actually changed and it's not from an internal update
      if (html !== lastContentRef.current && !isInternalUpdate.current) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/905561d3-723c-4e00-9362-19164772151b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'rich-text-editor.tsx:372',message:'onUpdate calling onChange',data:{htmlLength:html.length,htmlPreview:html.substring(0,100)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        lastContentRef.current = html;
        isInternalUpdate.current = true;
        // Use requestAnimationFrame to ensure the update happens after React renders
        requestAnimationFrame(() => {
          onChange(html);
          // Reset flag after a short delay
          setTimeout(() => {
            isInternalUpdate.current = false;
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/905561d3-723c-4e00-9362-19164772151b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'rich-text-editor.tsx:380',message:'isInternalUpdate reset to false',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
            // #endregion
          }, 50);
        });
      } else {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/905561d3-723c-4e00-9362-19164772151b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'rich-text-editor.tsx:372-else',message:'onUpdate skipped',data:{htmlMatchesLast:html===lastContentRef.current,isInternalUpdate:isInternalUpdate.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
      }
    },
    onSelectionUpdate: ({ editor }) => {
      // Force UI update when selection changes to update button states
      forceUpdate({});
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none min-h-[200px] p-4 focus:outline-none',
      },
      handlePaste: (view, event, slice) => {
        const items = Array.from(event.clipboardData?.items || []);
        const imageItem = items.find(item => item.type.startsWith('image/'));
        
        if (imageItem) {
          event.preventDefault();
          const file = imageItem.getAsFile();
          if (file) {
            // Insert placeholder image immediately
            const placeholderUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkNhcmdhbmRvIGltYWdlbi4uLjwvdGV4dD48L3N2Zz4=';
            editor?.chain().focus().setImage({ src: placeholderUrl }).run();
            
            // Upload image and replace placeholder
            uploadImage(file).then(url => {
              // More robust approach: find and replace the placeholder image node
              const { schema } = editor.state;
              const { tr } = editor.state;
              let modified = false;
              
              editor.state.doc.descendants((node: any, pos: number) => {
                if (node.type === schema.nodes.image && node.attrs.src === placeholderUrl) {
                  tr.setNodeMarkup(pos, undefined, { ...node.attrs, src: url });
                  modified = true;
                  return false; // Stop after finding the first match
                }
              });
              
              if (modified) {
                editor.view.dispatch(tr);
              }
            }).catch(console.error);
          }
          return true;
        }
        
        return false;
      },
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer) {
          const files = Array.from(event.dataTransfer.files);
          const imageFile = files.find(file => file.type.startsWith('image/'));
          
          if (imageFile) {
            event.preventDefault();
            uploadImage(imageFile).then(url => {
              const { schema } = view.state;
              const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
              if (coordinates) {
                const node = schema.nodes.image.create({ src: url });
                const transaction = view.state.tr.insert(coordinates.pos, node);
                view.dispatch(transaction);
              }
            }).catch(console.error);
            return true;
          }
        }
        return false;
      },
      handleKeyDown: (view: any, event: KeyboardEvent): boolean => {
        // Handle Tab for list indentation
        if (event.key === 'Tab') {
          event.preventDefault();
          
          if (event.shiftKey) {
            // Shift+Tab: reduce indentation
            return editor?.chain().focus().liftListItem('listItem').run() || false;
          } else {
            // Tab: increase indentation
            return editor?.chain().focus().sinkListItem('listItem').run() || false;
          }
        }
        
        return false;
      },
    },
  });

  const addImage = useCallback(() => {
    const url = window.prompt('URL de la imagen:');
    if (url) {
      editor?.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const addLink = useCallback(() => {
    const previousUrl = editor?.getAttributes('link').href;
    const url = window.prompt('URL del enlace:', previousUrl);
    
    if (url === null) {
      return;
    }
    
    if (url === '') {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    
    editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const addYouTubeVideo = useCallback(() => {
    const url = window.prompt('URL del video de YouTube (ej: https://www.youtube.com/watch?v=...):');
    if (url) {
      editor?.chain().focus().setYoutubeVideo({ src: url }).run();
    }
  }, [editor]);

  const addVideo = useCallback(() => {
    const url = window.prompt('URL del video (MP4, WebM, etc.):');
    if (url) {
      editor?.chain().focus().insertContent({
        type: 'video',
        attrs: {
          src: url,
          controls: true,
        },
      }).run();
    }
  }, [editor]);

  // Update editor content when prop changes (only when editor is not focused to avoid conflicts)
  useEffect(() => {
    if (!editor) return;
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/905561d3-723c-4e00-9362-19164772151b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'rich-text-editor.tsx:514',message:'useEffect triggered',data:{contentLength:content?.length||0,contentPreview:content?.substring(0,100)||'',isInternalUpdate:isInternalUpdate.current,editorFocused:editor.isFocused,lastContentLength:lastContentRef.current.length},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    // Skip update if this is an internal update or editor is focused
    if (isInternalUpdate.current || editor.isFocused) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/905561d3-723c-4e00-9362-19164772151b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'rich-text-editor.tsx:518',message:'useEffect skipped',data:{isInternalUpdate:isInternalUpdate.current,editorFocused:editor.isFocused},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      return;
    }
    
    const currentContent = editor.getHTML();
    const propContent = content || '';
    
    // CRITICAL FIX: Never overwrite editor content if it's longer than prop content
    // This prevents stale parent content from overwriting user edits
    // The editor content is the source of truth when it's more recent
    if (currentContent.length > propContent.length && currentContent.length > 0) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/905561d3-723c-4e00-9362-19164772151b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'rich-text-editor.tsx:530-stale',message:'useEffect skipping stale content - editor longer',data:{currentLength:currentContent.length,propLength:propContent.length,reason:'editor content is longer'},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      // Update lastContentRef to prevent future overwrites
      lastContentRef.current = currentContent;
      return;
    }
    
    // Only update if content is actually different from external source
    // Use a more robust comparison that handles whitespace differences
    const normalizeContent = (html: string) => html.trim().replace(/\s+/g, ' ');
    const normalizedContent = normalizeContent(propContent);
    const normalizedCurrent = normalizeContent(currentContent);
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/905561d3-723c-4e00-9362-19164772151b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'rich-text-editor.tsx:530',message:'useEffect comparing content',data:{normalizedContentMatch:normalizedContent===normalizedCurrent,contentMatchesLast:content===lastContentRef.current,currentContentLength:currentContent.length,contentLength:propContent.length,currentContentExact:currentContent===propContent},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    
    // CRITICAL: If normalized content matches but exact content doesn't, 
    // and editor content is longer or different, don't overwrite
    // This handles cases where formatting changes (like bold, lists) that normalize to same but are different
    if (normalizedContent === normalizedCurrent && currentContent !== propContent) {
      // Content is semantically similar but structurally different (formatting changes)
      // If editor content is longer or has more structure, preserve it
      if (currentContent.length >= propContent.length) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/905561d3-723c-4e00-9362-19164772151b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'rich-text-editor.tsx:530-format',message:'useEffect skipping - preserving formatting',data:{currentLength:currentContent.length,propLength:propContent.length,reason:'formatting difference detected'},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        lastContentRef.current = currentContent;
        return;
      }
    }
    
    // Only update if content is truly different AND not matching lastContentRef
    // This ensures we don't overwrite with stale content
    if (normalizedContent !== normalizedCurrent && content !== lastContentRef.current) {
      // Additional safety check: if current editor content is longer, don't overwrite
      if (currentContent.length > propContent.length && currentContent.length > 0) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/905561d3-723c-4e00-9362-19164772151b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'rich-text-editor.tsx:530-recent',message:'useEffect skipping - editor content more recent',data:{currentLength:currentContent.length,propLength:propContent.length},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        lastContentRef.current = currentContent;
        return;
      }
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/905561d3-723c-4e00-9362-19164772151b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'rich-text-editor.tsx:530-if',message:'useEffect updating editor content',data:{contentLength:propContent.length,currentContentLength:currentContent.length,contentPreview:propContent.substring(0,100),currentPreview:currentContent.substring(0,100)},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      // Mark as internal update to prevent triggering onUpdate
      isInternalUpdate.current = true;
      lastContentRef.current = propContent;
      
      // Only update if the change is significant and the editor is not currently being edited
      editor.commands.setContent(propContent, false, { preserveWhitespace: 'full' });
      
      // Reset flag after update
      setTimeout(() => {
        isInternalUpdate.current = false;
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/905561d3-723c-4e00-9362-19164772151b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'rich-text-editor.tsx:540',message:'useEffect reset isInternalUpdate',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
      }, 100);
    } else if (normalizedContent === normalizedCurrent && currentContent === propContent) {
      // Content matches exactly, just update lastContentRef to stay in sync
      lastContentRef.current = currentContent;
    }
  }, [editor, content]);

  if (!editor) {
    return <div className="h-64 bg-slate-800 rounded-lg animate-pulse" />;
  }

  return (
    <div className={`border border-slate-600 rounded-lg bg-slate-800 ${className}`}>
      <div className="max-h-[700px] overflow-y-auto">
        {/* Toolbar */}
        <div className="sticky top-0 z-10 border-b border-slate-600 p-2 flex flex-wrap gap-1 bg-slate-800">
        {/* Text formatting */}
        <Button
          type="button"
          variant={editor.isActive('bold') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/905561d3-723c-4e00-9362-19164772151b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'rich-text-editor.tsx:557',message:'Bold button clicked',data:{isActive:editor.isActive('bold'),editorFocused:editor.isFocused,contentBefore:editor.getHTML().substring(0,100)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
            // #endregion
            editor.chain().focus().toggleBold().run();
            // #region agent log
            setTimeout(() => {
              fetch('http://127.0.0.1:7242/ingest/905561d3-723c-4e00-9362-19164772151b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'rich-text-editor.tsx:557-after',message:'Bold button after toggle',data:{isActive:editor.isActive('bold'),contentAfter:editor.getHTML().substring(0,100)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
            }, 10);
            // #endregion
          }}
          disabled={!editor.can().chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant={editor.isActive('italic') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant={editor.isActive('underline') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          disabled={!editor.can().chain().focus().toggleUnderline().run()}
        >
          <Underline className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant={editor.isActive('strike') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={!editor.can().chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant={editor.isActive('code') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleCode().run()}
          disabled={!editor.can().chain().focus().toggleCode().run()}
          title="Código inline"
        >
          <Code className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant={editor.isActive('codeBlock') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => {
            const { from, to, empty } = editor.state.selection;
            
            if (!empty) {
              // Si hay texto seleccionado, extraer todo el texto
              const selectedText = editor.state.doc.textBetween(from, to, '\n');
              
              // Reemplazar la selección con un bloque de código único
              // Usar insertContent con HTML para asegurar que sea un solo bloque
              editor.chain()
                .focus()
                .deleteSelection()
                .insertContent(`<pre><code>${selectedText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`)
                .run();
            } else {
              // Si no hay selección, simplemente toggle el codeBlock
              editor.chain().focus().toggleCodeBlock().run();
            }
          }}
          disabled={!editor.can().chain().focus().toggleCodeBlock().run()}
          title="Bloque de código"
        >
          <FileCode className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* Typography */}
        <select
          value={editor.getAttributes('textStyle').fontFamily || 'Satoshi, sans-serif'}
          onChange={(e) => {
            if (e.target.value === 'Satoshi, sans-serif') {
              editor.chain().focus().unsetFontFamily().run();
            } else {
              editor.chain().focus().setFontFamily(e.target.value).run();
            }
            // Force update to trigger onChange
            setTimeout(() => {
              const html = editor.getHTML();
              onChange(html);
            }, 100);
          }}
          className="px-2 py-1 text-xs bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="Satoshi, sans-serif">Satoshi (default)</option>
          <option value="Inter">Inter</option>
          <option value="Arial, sans-serif">Arial</option>
          <option value="Georgia, serif">Georgia</option>
          <option value="Times New Roman, serif">Times</option>
          <option value="Helvetica, sans-serif">Helvetica</option>
          <option value="Courier New, monospace">Courier</option>
          <option value="Verdana, sans-serif">Verdana</option>
        </select>

        <select
          value={editor.getAttributes('textStyle').fontSize || '16px'}
          onChange={(e) => {
            if (e.target.value === '16px') {
              editor.chain().focus().unsetFontSize().run();
            } else {
              editor.chain().focus().setFontSize(e.target.value).run();
            }
            // Force update to trigger onChange
            setTimeout(() => {
              const html = editor.getHTML();
              onChange(html);
            }, 100);
          }}
          className="px-2 py-1 text-xs bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="12px">12px</option>
          <option value="14px">14px</option>
          <option value="16px">16px (normal)</option>
          <option value="18px">18px</option>
          <option value="20px">20px</option>
          <option value="24px">24px</option>
          <option value="28px">28px</option>
          <option value="32px">32px</option>
          <option value="36px">36px</option>
          <option value="48px">48px</option>
        </select>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => adjustFontSize('down')}
          title="Disminuir tamaño de letra"
          className="h-7 px-2"
        >
          <MinusIcon className="h-3 w-3" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => adjustFontSize('up')}
          title="Aumentar tamaño de letra"
          className="h-7 px-2"
        >
          <PlusIcon className="h-3 w-3" />
        </Button>

        <select
          value={editor.getAttributes('textStyle')?.lineHeight || 'normal'}
          onChange={(e) => {
            if (e.target.value === 'normal') {
              editor.chain().focus().unsetLineHeight().run();
            } else {
              editor.chain().focus().setLineHeight(e.target.value).run();
            }
            // Force update to trigger onChange
            setTimeout(() => {
              const html = editor.getHTML();
              onChange(html);
            }, 100);
          }}
          className="px-2 py-1 text-xs bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          title="Altura de línea"
        >
          <option value="normal">Altura: Normal</option>
          <option value="1">Altura: Compacta (1)</option>
          <option value="1.2">Altura: 1.2</option>
          <option value="1.4">Altura: 1.4</option>
          <option value="1.5">Altura: 1.5</option>
          <option value="1.6">Altura: 1.6</option>
          <option value="1.8">Altura: 1.8</option>
          <option value="2">Altura: 2</option>
          <option value="2.5">Altura: 2.5</option>
        </select>

        <Separator orientation="vertical" className="h-6" />

        {/* Alignment */}
        <Button
          type="button"
          variant={editor.isActive({ textAlign: 'left' }) ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant={editor.isActive({ textAlign: 'center' }) ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant={editor.isActive({ textAlign: 'right' }) ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
        >
          <AlignRight className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant={editor.isActive({ textAlign: 'justify' }) ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        >
          <AlignJustify className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* Paragraph Spacing Controls */}
        <div className="flex items-center gap-1 border border-slate-600 rounded px-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              const { from, to } = editor.state.selection;
              const { tr } = editor.state;
              
              editor.state.doc.nodesBetween(from, to, (node: any, pos: number) => {
                if (node.type.name === 'paragraph') {
                  const currentStyle = node.attrs.style || '';
                  const currentMargin = currentStyle.match(/margin-bottom:\s*([^;]+)/)?.[1] || '0';
                  const marginValue = parseFloat(currentMargin) || 0;
                  const newMargin = Math.max(0, marginValue - 4);
                  const style = newMargin > 0 ? `margin-bottom: ${newMargin}px;` : '';
                  
                  tr.setNodeMarkup(pos, undefined, {
                    ...node.attrs,
                    style: style || null,
                  });
                }
              });
              
              editor.view.dispatch(tr);
              setTimeout(() => {
                const html = editor.getHTML();
                onChange(html);
              }, 100);
            }}
            title="Reducir espacio entre párrafos"
            className="h-7 px-2"
          >
            <MinusIcon className="h-3 w-3" />
          </Button>
          <span className="text-xs text-slate-400 px-1" title="Espaciado entre párrafos">
            <Type className="h-3 w-3" />
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              const { from, to } = editor.state.selection;
              const { tr } = editor.state;
              
              editor.state.doc.nodesBetween(from, to, (node: any, pos: number) => {
                if (node.type.name === 'paragraph') {
                  const currentStyle = node.attrs.style || '';
                  const currentMargin = currentStyle.match(/margin-bottom:\s*([^;]+)/)?.[1] || '0';
                  const marginValue = parseFloat(currentMargin) || 0;
                  const newMargin = marginValue + 4;
                  const style = `margin-bottom: ${newMargin}px;`;
                  
                  tr.setNodeMarkup(pos, undefined, {
                    ...node.attrs,
                    style: style,
                  });
                }
              });
              
              editor.view.dispatch(tr);
              setTimeout(() => {
                const html = editor.getHTML();
                onChange(html);
              }, 100);
            }}
            title="Aumentar espacio entre párrafos"
            className="h-7 px-2"
          >
            <PlusIcon className="h-3 w-3" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Lists */}
        <Button
          type="button"
          variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/905561d3-723c-4e00-9362-19164772151b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'rich-text-editor.tsx:826',message:'BulletList button clicked',data:{isActive:editor.isActive('bulletList'),editorFocused:editor.isFocused,contentBefore:editor.getHTML().substring(0,100)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
            // #endregion
            editor.chain().focus().toggleBulletList().run();
            // #region agent log
            setTimeout(() => {
              fetch('http://127.0.0.1:7242/ingest/905561d3-723c-4e00-9362-19164772151b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'rich-text-editor.tsx:826-after',message:'BulletList button after toggle',data:{isActive:editor.isActive('bulletList'),contentAfter:editor.getHTML().substring(0,100)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
            }, 10);
            // #endregion
          }}
        >
          <List className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        {/* List Indentation */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().sinkListItem('listItem').run()}
          disabled={!editor.can().sinkListItem('listItem')}
          title="Aumentar sangría"
        >
          <Indent className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().liftListItem('listItem').run()}
          disabled={!editor.can().liftListItem('listItem')}
          title="Reducir sangría"
        >
          <Outdent className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* Block elements */}
        <Button
          type="button"
          variant={editor.isActive('blockquote') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* Media */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={addImage}
          disabled={isUploading}
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant={editor.isActive('link') ? 'default' : 'ghost'}
          size="sm"
          onClick={addLink}
          title="Agregar enlace"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={addYouTubeVideo}
          title="Insertar video de YouTube"
          className="text-slate-300 hover:text-white hover:bg-slate-700"
        >
          <YoutubeIcon className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={addVideo}
          title="Insertar video"
          className="text-slate-300 hover:text-white hover:bg-slate-700"
        >
          <Video className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* Undo/Redo */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
        >
          <Undo className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

        {/* Editor content */}
        <EditorContent 
          editor={editor} 
          className="min-h-[300px] text-white"
        />
      </div>
    </div>
  );
}