import { useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';

interface LessonPosition {
  courseId: string;
  lessonId: string;
  timestamp: number;
}

const LESSON_POSITION_KEY = 'expertosnocodeia_lesson_position';

export function useLessonPosition() {
  // Guardar la posición actual de la lección
  const saveLessonPosition = async (
    courseId: string, 
    lessonId: string, 
    contentType?: string,
    roomSlug?: string
  ) => {
    if (!courseId || !lessonId) return;
    
    const position: LessonPosition = {
      courseId,
      lessonId,
      timestamp: Date.now()
    };
    
    try {
      // Save locally
      localStorage.setItem(LESSON_POSITION_KEY, JSON.stringify(position));
      
      // Also track in backend for "Continue where you left off"
      await apiRequest('POST', '/api/track-activity', {
        courseId,
        lessonId,
        contentType: contentType || 'course',
        roomSlug
      });
    } catch (error) {
      console.error('Error saving lesson position:', error);
    }
  };

  // Obtener la posición guardada para un curso específico
  const getSavedLessonPosition = (courseId: string): string | null => {
    if (!courseId) return null;
    
    try {
      const saved = localStorage.getItem(LESSON_POSITION_KEY);
      if (!saved) {
        return null;
      }
      
      const position: LessonPosition = JSON.parse(saved);
      
      // Verificar que la posición guardada es para el curso correcto
      if (position.courseId === courseId) {
        return position.lessonId;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting saved lesson position:', error);
      return null;
    }
  };

  // Limpiar posición guardada (opcional, para cuando se completa un curso)
  const clearLessonPosition = () => {
    try {
      localStorage.removeItem(LESSON_POSITION_KEY);
    } catch (error) {
      console.error('Error clearing lesson position:', error);
    }
  };

  return {
    saveLessonPosition,
    getSavedLessonPosition,
    clearLessonPosition
  };
}