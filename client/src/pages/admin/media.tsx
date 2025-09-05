import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  MoreHorizontal, 
  Plus, 
  Search, 
  ArrowLeft,
  Image as ImageIcon,
  Video,
  File,
  Upload,
  Trash2,
  Edit,
  Eye
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ObjectUploader } from "@/components/ObjectUploader";
import { useAdmin } from "@/hooks/useAdmin";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function AdminMedia() {
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: mediaFiles, isLoading } = useQuery({
    queryKey: ["/api/admin/media", selectedType],
    queryFn: () => fetch(`/api/admin/media${selectedType ? `?type=${selectedType}` : ''}`).then(r => r.json()),
    enabled: isAdmin,
  });

  const uploadMutation = useMutation({
    mutationFn: async (fileData: any) => {
      // First, get upload URL
      const uploadResponse = await fetch('/api/admin/media/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileType: fileData.type })
      });
      const { uploadUrl } = await uploadResponse.json();

      // Upload file to storage
      await fetch(uploadUrl, {
        method: 'PUT',
        body: fileData.file,
        headers: { 'Content-Type': fileData.type }
      });

      // Create media record
      const mediaResponse = await fetch('/api/admin/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: fileData.name,
          originalName: fileData.name,
          mimeType: fileData.type,
          size: fileData.size,
          url: uploadUrl.split('?')[0], // Remove query params
          type: fileData.type.startsWith('image/') ? 'image' : 
                fileData.type.startsWith('video/') ? 'video' : 'document',
          altText: '',
          description: '',
          isPublic: true
        })
      });
      return mediaResponse.json();
    },
    onSuccess: () => {
      toast({
        title: "Éxito",
        description: "Archivo subido correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/media"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Error al subir el archivo",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (mediaId: string) => {
      const response = await fetch(`/api/admin/media/${mediaId}`, {
        method: 'DELETE',
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Éxito",
        description: "Archivo eliminado correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/media"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Error al eliminar el archivo",
        variant: "destructive",
      });
    },
  });

  if (adminLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <h1 className="text-2xl font-bold text-red-500">Acceso Denegado</h1>
        <p className="text-gray-400">No tienes privilegios de administrador.</p>
        <Link href="/">
          <Button>Volver al Inicio</Button>
        </Link>
      </div>
    );
  }

  const filteredFiles = (mediaFiles as any)?.filter((file: any) =>
    file.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleUploadParameters = async () => {
    // This will be handled in the mutation
    return {
      method: "PUT" as const,
      url: "",
    };
  };

  const handleUploadComplete = (result: any) => {
    if (result.successful && result.successful.length > 0) {
      const file = result.successful[0];
      uploadMutation.mutate({
        file: file.data,
        name: file.name,
        type: file.type,
        size: file.size
      });
    }
  };

  const getFileIcon = (type: string) => {
    if (type === 'image') return ImageIcon;
    if (type === 'video') return Video;
    return File;
  };

  const getFileTypeColor = (type: string) => {
    switch (type) {
      case 'image':
        return 'bg-green-500/20 text-green-400';
      case 'video':
        return 'bg-blue-500/20 text-blue-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const typeFilters = [
    { value: null, label: 'Todos' },
    { value: 'image', label: 'Imágenes' },
    { value: 'video', label: 'Videos' },
    { value: 'document', label: 'Documentos' }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white">Gestión de Medios</h1>
          <p className="text-gray-400 mt-1">Administra imágenes, videos y documentos</p>
        </div>
        <ObjectUploader
          maxNumberOfFiles={5}
          maxFileSize={52428800} // 50MB
          onGetUploadParameters={handleUploadParameters}
          onComplete={handleUploadComplete}
        >
          <Upload className="h-4 w-4 mr-2" />
          Subir Archivos
        </ObjectUploader>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar archivos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-slate-900/50 border-slate-700"
          />
        </div>
        <div className="flex gap-2">
          {typeFilters.map((filter) => (
            <Button
              key={filter.label}
              variant={selectedType === filter.value ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedType(filter.value)}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {filteredFiles.map((file: any) => {
          const FileIcon = getFileIcon(file.type);
          return (
            <Card key={file.id} className="bg-slate-900/50 border-slate-700 group">
              <CardHeader className="p-3">
                <div className="flex items-center justify-between">
                  <Badge className={getFileTypeColor(file.type)}>
                    {file.type}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalles
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-400"
                        onClick={() => deleteMutation.mutate(file.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="aspect-square bg-slate-800 rounded-lg flex items-center justify-center mb-3">
                  {file.type === 'image' ? (
                    <img 
                      src={file.url} 
                      alt={file.altText || file.originalName}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <FileIcon className="h-8 w-8 text-gray-400" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white truncate" title={file.originalName}>
                    {file.originalName}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filteredFiles.length === 0 && (
          <div className="col-span-full">
            <Card className="bg-slate-900/50 border-slate-700">
              <CardContent className="text-center py-8">
                <ImageIcon className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">
                  {searchTerm ? "No se encontraron archivos que coincidan con tu búsqueda." : "No hay archivos subidos aún."}
                </p>
                <ObjectUploader
                  maxNumberOfFiles={5}
                  maxFileSize={52428800}
                  onGetUploadParameters={handleUploadParameters}
                  onComplete={handleUploadComplete}
                  buttonClassName="mt-4"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Subir Primer Archivo
                </ObjectUploader>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}