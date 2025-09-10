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
import ListItem from '@tiptap/extension-list-item';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import Youtube from '@tiptap/extension-youtube';
import { Node, mergeAttributes } from '@tiptap/core';
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
  Outdent
} from 'lucide-react';
import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

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
      
      const { uploadURL } = uploadData;
      
      // Upload file directly to Google Cloud Storage
      const fileUploadResponse = await fetch(uploadURL, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });
      
      if (!fileUploadResponse.ok) {
        const errorText = await fileUploadResponse.text();
        console.error('Upload failed. Status:', fileUploadResponse.status);
        console.error('Error response:', errorText);
        throw new Error(`Error al subir imagen: ${fileUploadResponse.status}`);
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
        body: JSON.stringify({ imageURL: uploadURL }),
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

  const editor: any = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: false,
        orderedList: false,
        listItem: false,
        link: false, // Disable default link to avoid conflicts
        strike: false, // Disable default strike to use custom
        underline: false, // Disable default underline to use custom extension
      }),
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
      FontFamily.configure({
        types: ['textStyle'],
      }),
      FontSize.configure({
        types: ['textStyle'],
      }),
      Color,
      TextStyle,
      UnderlineExtension,
      Youtube.configure({
        width: 640,
        height: 480,
        ccLanguage: 'es',
        modestBranding: true,
      }),
      VideoExtension,
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (html !== content) {
        // Small delay to prevent conflicts with external content updates
        setTimeout(() => onChange(html), 10);
      }
    },
    onSelectionUpdate: ({ editor }) => {
      // Force UI update when selection changes to update button states
      forceUpdate({});
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none min-h-[300px] p-4 focus:outline-none',
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

  // Update editor content when prop changes
  useEffect(() => {
    if (editor && content !== undefined) {
      const currentContent = editor.getHTML();
      // Only update if content is actually different and not from internal updates
      // Also check if the difference is not just image src changes
      if (content !== currentContent && !editor.isFocused) {
        // Check if the difference is substantial (not just image URLs)
        const isSubstantialChange = Math.abs(content.length - currentContent.length) > 50 ||
          !content.includes('<img') || !currentContent.includes('<img');
        
        if (isSubstantialChange) {
          editor.commands.setContent(content || '', false, { preserveWhitespace: 'full' });
        }
      }
    }
  }, [editor, content]);

  if (!editor) {
    return <div className="h-64 bg-slate-800 rounded-lg animate-pulse" />;
  }

  return (
    <div className={`border border-slate-600 rounded-lg bg-slate-800 ${className}`}>
      {/* Toolbar */}
      <div className="border-b border-slate-600 p-2 flex flex-wrap gap-1">
        {/* Text formatting */}
        <Button
          variant={editor.isActive('bold') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </Button>
        
        <Button
          variant={editor.isActive('italic') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </Button>
        
        <Button
          variant={editor.isActive('underline') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          disabled={!editor.can().chain().focus().toggleUnderline().run()}
        >
          <Underline className="h-4 w-4" />
        </Button>
        
        <Button
          variant={editor.isActive('strike') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={!editor.can().chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
        
        <Button
          variant={editor.isActive('code') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleCode().run()}
          disabled={!editor.can().chain().focus().toggleCode().run()}
        >
          <Code className="h-4 w-4" />
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

        <Separator orientation="vertical" className="h-6" />

        {/* Alignment */}
        <Button
          variant={editor.isActive({ textAlign: 'left' }) ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        
        <Button
          variant={editor.isActive({ textAlign: 'center' }) ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        
        <Button
          variant={editor.isActive({ textAlign: 'right' }) ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
        >
          <AlignRight className="h-4 w-4" />
        </Button>
        
        <Button
          variant={editor.isActive({ textAlign: 'justify' }) ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        >
          <AlignJustify className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* Lists */}
        <Button
          variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </Button>
        
        <Button
          variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        {/* List Indentation */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().sinkListItem('listItem').run()}
          disabled={!editor.can().sinkListItem('listItem')}
          title="Aumentar sangría"
        >
          <Indent className="h-4 w-4" />
        </Button>
        
        <Button
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
          variant={editor.isActive('blockquote') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* Media */}
        <Button
          variant="ghost"
          size="sm"
          onClick={addImage}
          disabled={isUploading}
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
        
        <Button
          variant={editor.isActive('link') ? 'default' : 'ghost'}
          size="sm"
          onClick={addLink}
          title="Agregar enlace"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={addYouTubeVideo}
          title="Insertar video de YouTube"
          className="text-slate-300 hover:text-white hover:bg-slate-700"
        >
          <YoutubeIcon className="h-4 w-4" />
        </Button>
        
        <Button
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
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
        >
          <Undo className="h-4 w-4" />
        </Button>
        
        <Button
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
  );
}