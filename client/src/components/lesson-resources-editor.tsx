import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Plus, Trash2, Download, X, Upload, Link2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { FileUploader } from "./file-uploader";

interface LessonResourcesEditorProps {
  lessonId: string;
}

interface LessonResource {
  id: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize?: number;
}

interface NewResource {
  title: string;
  description: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
}

export function LessonResourcesEditor({ lessonId }: LessonResourcesEditorProps) {
  const [isAddingResource, setIsAddingResource] = useState(false);
  const [newResource, setNewResource] = useState<NewResource>({
    title: '',
    description: '',
    fileUrl: '',
    fileName: '',
    fileType: 'pdf'
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: resources, isLoading } = useQuery<LessonResource[]>({
    queryKey: [`/api/lessons/${lessonId}/resources`],
    enabled: !!lessonId,
  });

  const createResourceMutation = useMutation({
    mutationFn: async (data: NewResource & { fileSize?: number }) => {
      return await apiRequest('POST', `/api/lessons/${lessonId}/resources`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/lessons/${lessonId}/resources`] });
      setIsAddingResource(false);
      setNewResource({
        title: '',
        description: '',
        fileUrl: '',
        fileName: '',
        fileType: 'pdf'
      });
      toast({
        title: "Recurso agregado",
        description: "El recurso se agregó correctamente a la lección",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo agregar el recurso",
        variant: "destructive",
      });
    }
  });

  const deleteResourceMutation = useMutation({
    mutationFn: async (resourceId: string) => {
      return await apiRequest('DELETE', `/api/resources/${resourceId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/lessons/${lessonId}/resources`] });
      toast({
        title: "Recurso eliminado",
        description: "El recurso se eliminó correctamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el recurso",
        variant: "destructive",
      });
    }
  });

  const handleUrlChange = (url: string) => {
    setNewResource(prev => {
      const fileName = url.split('/').pop() || '';
      const fileType = fileName.split('.').pop()?.toLowerCase() || 'pdf';
      return {
        ...prev,
        fileUrl: url,
        fileName,
        fileType
      };
    });
  };

  const handleAddResource = () => {
    if (!newResource.title || !newResource.fileUrl) {
      toast({
        title: "Campos requeridos",
        description: "El título y URL del archivo son requeridos",
        variant: "destructive",
      });
      return;
    }
    createResourceMutation.mutate(newResource);
  };

  const handleFileUpload = (fileInfo: {
    fileName: string;
    fileType: string;
    fileSize: number;
    fileUrl: string;
  }) => {
    // Helper function for file size formatting
    const formatBytes = (bytes: number): string => {
      const units = ['B', 'KB', 'MB', 'GB'];
      let size = bytes;
      let unitIndex = 0;
      
      while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
      }
      
      return `${size.toFixed(1)} ${units[unitIndex]}`;
    };

    // Automatically create the resource when file is uploaded
    const resourceData = {
      title: fileInfo.fileName.replace(/\.[^/.]+$/, ""), // Remove extension for title
      description: `Archivo ${fileInfo.fileType.toUpperCase()} - ${formatBytes(fileInfo.fileSize)}`,
      fileUrl: fileInfo.fileUrl,
      fileName: fileInfo.fileName,
      fileType: fileInfo.fileType,
      fileSize: fileInfo.fileSize
    };
    createResourceMutation.mutate(resourceData);
  };

  if (isLoading) {
    return (
      <Card className="bg-slate-900/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Recursos Descargables</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-slate-700 rounded"></div>
            <div className="h-4 bg-slate-700 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <span>Recursos Descargables</span>
          <Button
            onClick={() => setIsAddingResource(true)}
            size="sm"
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Recurso
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Lista de recursos existentes */}
        {resources && resources.length > 0 ? (
          <div className="space-y-3">
            {resources.map((resource) => (
              <div
                key={resource.id}
                className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700"
              >
                <div className="flex items-start space-x-3 flex-1">
                  <FileText className="h-4 w-4 text-gray-400 mt-1" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white text-sm font-medium">
                      {resource.title}
                    </h4>
                    <div className="flex items-center space-x-2 text-xs text-gray-400 mt-1">
                      <span className="uppercase">{resource.fileType}</span>
                      <span>•</span>
                      <span className="truncate">{resource.fileName}</span>
                    </div>
                    {resource.description && (
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                        {resource.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(resource.fileUrl, '_blank')}
                    className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteResourceMutation.mutate(resource.id)}
                    className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                    disabled={deleteResourceMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm text-center py-4">
            No hay recursos agregados para esta lección
          </p>
        )}

        {/* Formulario para agregar nuevo recurso */}
        {isAddingResource && (
          <div className="border-t border-slate-700 pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-white font-medium">Nuevo Recurso</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAddingResource(false)}
                className="h-8 w-8 p-0 text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <Tabs defaultValue="upload" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-slate-800">
                <TabsTrigger value="upload" className="data-[state=active]:bg-slate-700">
                  <Upload className="h-4 w-4 mr-2" />
                  Subir Archivo
                </TabsTrigger>
                <TabsTrigger value="url" className="data-[state=active]:bg-slate-700">
                  <Link2 className="h-4 w-4 mr-2" />
                  Enlace URL
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="upload" className="space-y-4 mt-4">
                <FileUploader
                  onFileUpload={handleFileUpload}
                  onCancel={() => setIsAddingResource(false)}
                  accept=".pdf,.doc,.docx,.xlsx,.xls,.ppt,.pptx,.txt,.zip,.png,.jpg,.jpeg"
                  maxSize={25 * 1024 * 1024} // 25MB
                />
              </TabsContent>
              
              <TabsContent value="url" className="space-y-4 mt-4">
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="resource-title" className="text-white">
                      Título del Recurso *
                    </Label>
                    <Input
                      id="resource-title"
                      value={newResource.title}
                      onChange={(e) => setNewResource(prev => ({ ...prev, title: e.target.value }))}
                      className="bg-slate-800 border-slate-600 text-white"
                      placeholder="Guía de indicaciones de Expert ChatGPT"
                    />
                  </div>

                  <div>
                    <Label htmlFor="resource-url" className="text-white">
                      URL del Archivo *
                    </Label>
                    <Input
                      id="resource-url"
                      value={newResource.fileUrl}
                      onChange={(e) => handleUrlChange(e.target.value)}
                      className="bg-slate-800 border-slate-600 text-white"
                      placeholder="https://example.com/archivo.pdf"
                    />
                  </div>

                  <div>
                    <Label htmlFor="resource-description" className="text-white">
                      Descripción (opcional)
                    </Label>
                    <Textarea
                      id="resource-description"
                      value={newResource.description}
                      onChange={(e) => setNewResource(prev => ({ ...prev, description: e.target.value }))}
                      className="bg-slate-800 border-slate-600 text-white"
                      rows={2}
                      placeholder="Descripción breve del recurso..."
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleAddResource}
                      disabled={createResourceMutation.isPending}
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {createResourceMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                          Agregando...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Agregar Recurso
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAddingResource(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  );
}