import { Response } from "express";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ruta base donde están los archivos descargados
const ATTACHED_ASSETS_DIR = path.join(__dirname, "..", "attached_assets");

export class LocalFileStorageService {
  /**
   * Sirve un archivo desde la carpeta local attached_assets
   */
  async serveFile(filePath: string, res: Response): Promise<boolean> {
    try {
      // Construir la ruta completa del archivo
      const fullPath = path.join(ATTACHED_ASSETS_DIR, filePath);
      
      // Verificar que el archivo existe
      try {
        await fs.access(fullPath);
      } catch {
        return false; // Archivo no encontrado
      }

      // Leer el archivo
      const fileBuffer = await fs.readFile(fullPath);
      
      // Determinar el tipo MIME
      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes: Record<string, string> = {
        '.pdf': 'application/pdf',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.mp4': 'video/mp4',
        '.mp3': 'audio/mpeg',
        '.zip': 'application/zip',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      };
      
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      
      // Enviar el archivo
      const fileName = path.basename(filePath);
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Length', fileBuffer.length.toString());
      // Para imágenes de perfil, mostrar en el navegador en lugar de descargar
      if (!filePath.includes('profile')) {
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
      }
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
      
      res.send(fileBuffer);
      return true;
    } catch (error) {
      console.error("Error serving local file:", error);
      return false;
    }
  }

  /**
   * Verifica si un archivo existe localmente
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      const fullPath = path.join(ATTACHED_ASSETS_DIR, filePath);
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }
}