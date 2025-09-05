import { useEffect } from 'react';

interface LessonPosition {
  courseId: string;
  lessonId: string;
  timestamp: number;
}

const LESSON_POSITION_KEY = 'expertosnocodeia_lesson_position';

export function useLessonPosition() {
  // Guardar la posición actual de la lección
  const saveLessonPosition = (courseId: string, lessonId: string) => {
    if (!courseId || !lessonId) return;
    
    const position: LessonPosition = {
      courseId,
      lessonId,
      timestamp: Date.now()
    };
    
    try {
      localStorage.setItem(LESSON_POSITION_KEY, JSON.stringify(position));
      console.log('🔖 Lesson position saved:', { courseId, lessonId });
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
        console.log('📖 No saved lesson position found');
        return null;
      }
      
      const position: LessonPosition = JSON.parse(saved);
      console.log('📖 Found saved position:', position);
      
      // Verificar que la posición guardada es para el curso correcto
      if (position.courseId === courseId) {
        console.log('✅ Returning saved lesson for course:', position.lessonId);
        return position.lessonId;
      }
      
      console.log('❌ Saved position is for different course:', position.courseId, 'vs', courseId);
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