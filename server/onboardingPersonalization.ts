import { db } from './db';
import { userOnboardingResponses, users, courses, categories, userProgress } from '../shared/schema';
import { eq, and, or, sql, inArray, desc, isNull } from 'drizzle-orm';
import { storage } from './storage';

export interface PersonalizedRecommendations {
  courses: Array<{
    id: string;
    title: string;
    description?: string;
    categoryId?: string;
    difficulty?: string;
    coverImageUrl?: string;
    reason: string; // Why this course was recommended
  }>;
  guides: Array<{
    id: string;
    title: string;
    description?: string;
    reason: string;
  }>;
  workshops: Array<{
    id: string;
    title: string;
    description?: string;
    reason: string;
  }>;
  nextSteps: string[]; // Suggested actions
}

/**
 * Get personalized recommendations based on onboarding responses
 */
export async function getPersonalizedRecommendations(userId: string): Promise<PersonalizedRecommendations> {
  // Get user's onboarding responses
  const onboardingResponse = await db
    .select()
    .from(userOnboardingResponses)
    .where(eq(userOnboardingResponses.userId, userId))
    .limit(1);

  if (!onboardingResponse || onboardingResponse.length === 0) {
    // Return default recommendations if no onboarding data
    return getDefaultRecommendations(userId);
  }

  const onboarding = onboardingResponse[0];
  const workAreas = onboarding.workAreas || [];
  const experienceLevel = onboarding.experienceLevel || 'beginner';
  const goals = onboarding.goals || [];
  const learningMethods = onboarding.learningMethods || [];
  const mainGoal = onboarding.mainGoal;

  // Get user's current progress to avoid recommending completed courses
  const userCompletedCourses = await db
    .select({ courseId: userProgress.courseId })
    .from(userProgress)
    .where(
      and(
        eq(userProgress.userId, userId),
        eq(userProgress.isCompleted, true)
      )
    );

  const completedCourseIds = userCompletedCourses.map(p => p.courseId).filter(Boolean) as string[];

  // Build recommendation logic based on onboarding data
  const recommendations: PersonalizedRecommendations = {
    courses: [],
    guides: [],
    workshops: [],
    nextSteps: [],
  };

  // 1. Recommend courses based on work areas
  if (workAreas.length > 0) {
    const workAreaCourses = await getCoursesByWorkAreas(workAreas, experienceLevel, completedCourseIds);
    recommendations.courses.push(...workAreaCourses);
  }

  // 2. Recommend courses based on experience level
  const levelCourses = await getCoursesByExperienceLevel(experienceLevel, completedCourseIds);
  recommendations.courses.push(...levelCourses);

  // 3. Recommend courses based on goals
  if (goals.length > 0) {
    const goalCourses = await getCoursesByGoals(goals, experienceLevel, completedCourseIds);
    recommendations.courses.push(...goalCourses);
  }

  // 4. Recommend based on main goal
  if (mainGoal) {
    const mainGoalCourses = await getCoursesByMainGoal(mainGoal, experienceLevel, completedCourseIds);
    recommendations.courses.push(...mainGoalCourses);
  }

  // 5. Recommend guides based on work areas and goals
  if (workAreas.length > 0 || goals.length > 0) {
    const recommendedGuides = await getGuidesByInterests(workAreas, goals, completedCourseIds);
    recommendations.guides.push(...recommendedGuides);
  }

  // 6. Recommend workshops based on learning methods
  if (learningMethods.includes('workshops') || learningMethods.includes('hands-on')) {
    const recommendedWorkshops = await getWorkshopsByInterests(workAreas, experienceLevel, completedCourseIds);
    recommendations.workshops.push(...recommendedWorkshops);
  }

  // Remove duplicates
  recommendations.courses = removeDuplicateRecommendations(recommendations.courses);
  recommendations.guides = removeDuplicateRecommendations(recommendations.guides);
  recommendations.workshops = removeDuplicateRecommendations(recommendations.workshops);

  // Limit recommendations
  recommendations.courses = recommendations.courses.slice(0, 6);
  recommendations.guides = recommendations.guides.slice(0, 4);
  recommendations.workshops = recommendations.workshops.slice(0, 3);

  // Generate next steps
  recommendations.nextSteps = generateNextSteps(onboarding, recommendations);

  return recommendations;
}

/**
 * Get default recommendations when no onboarding data exists
 */
async function getDefaultRecommendations(userId: string): Promise<PersonalizedRecommendations> {
  const allCourses = await db
    .select()
    .from(courses)
    .where(eq(courses.isPublished, true))
    .orderBy(desc(courses.createdAt))
    .limit(6);

  return {
    courses: allCourses.map(c => ({
      id: c.id,
      title: c.title,
      description: c.description || undefined,
      categoryId: c.categoryId || undefined,
      difficulty: c.difficulty || undefined,
      coverImageUrl: undefined,
      reason: 'Curso popular',
    })),
    guides: [],
    workshops: [],
    nextSteps: [
      'Completa el onboarding para obtener recomendaciones personalizadas',
      'Explora nuestros cursos más populares',
    ],
  };
}

/**
 * Get courses based on work areas
 */
async function getCoursesByWorkAreas(
  workAreas: string[],
  experienceLevel: string,
  excludeIds: string[]
): Promise<PersonalizedRecommendations['courses']> {
  // Map work areas to category keywords or course tags
  const categoryKeywords: Record<string, string[]> = {
    'Codificación': ['desarrollo', 'programación', 'código'],
    'Marketing': ['marketing', 'publicidad', 'promoción'],
    'Creador de contenido': ['contenido', 'creación', 'multimedia'],
    'Educador': ['educación', 'enseñanza', 'pedagogía'],
    'Operaciones comerciales': ['operaciones', 'negocios', 'gestión'],
    'Ventas': ['ventas', 'comercial', 'negociación'],
    'Finanzas': ['finanzas', 'contabilidad', 'economía'],
    'Diseño': ['diseño', 'creativo', 'visual'],
    'Consultante': ['consultoría', 'asesoría', 'estrategia'],
  };

  const keywords: string[] = [];
  for (const area of workAreas) {
    if (categoryKeywords[area]) {
      keywords.push(...categoryKeywords[area]);
    }
  }

  if (keywords.length === 0) {
    return [];
  }

  // Search for courses matching keywords (simplified - would need full-text search in production)
  const matchingCourses = await db
    .select()
    .from(courses)
    .where(
      and(
        eq(courses.isPublished, true),
        excludeIds.length > 0 ? sql`${courses.id} NOT IN ${sql.raw(`(${excludeIds.map(() => '?').join(',')})`)}` : undefined
      )
    )
    .limit(10);

  // Filter by keywords (simplified matching)
  const filtered = matchingCourses.filter(course => {
    const titleLower = course.title?.toLowerCase() || '';
    const descLower = course.description?.toLowerCase() || '';
    return keywords.some(keyword => 
      titleLower.includes(keyword.toLowerCase()) || 
      descLower.includes(keyword.toLowerCase())
    );
  });

  return filtered.map(c => ({
    id: c.id,
    title: c.title,
    description: c.description || undefined,
    categoryId: c.categoryId || undefined,
    difficulty: c.difficulty || undefined,
    coverImageUrl: undefined,
    reason: `Recomendado para ${workAreas[0]}`,
  }));
}

/**
 * Get courses based on experience level
 */
async function getCoursesByExperienceLevel(
  experienceLevel: string,
  excludeIds: string[]
): Promise<PersonalizedRecommendations['courses']> {
  const courseResults = await db
    .select()
    .from(courses)
    .where(
      and(
        eq(courses.isPublished, true),
        eq(courses.difficulty, experienceLevel),
        excludeIds.length > 0 ? sql`${courses.id} NOT IN ${sql.raw(`(${excludeIds.map(() => '?').join(',')})`)}` : undefined
      )
    )
    .orderBy(desc(courses.createdAt))
    .limit(4);

  return courseResults.map((c: any) => ({
    id: c.id,
    title: c.title,
    description: c.description || undefined,
    categoryId: c.categoryId || undefined,
    difficulty: c.difficulty || undefined,
    coverImageUrl: undefined,
    reason: `Nivel ${experienceLevel} - Perfecto para tu experiencia`,
  }));
}

/**
 * Get courses based on goals
 */
async function getCoursesByGoals(
  goals: string[],
  experienceLevel: string,
  excludeIds: string[]
): Promise<PersonalizedRecommendations['courses']> {
  // Similar to work areas, map goals to course types
  const goalKeywords: Record<string, string[]> = {
    'Aprender IA': ['ia', 'inteligencia artificial', 'machine learning'],
    'Automatizar tareas': ['automatización', 'eficiencia', 'productividad'],
    'Mejorar productividad': ['productividad', 'eficiencia', 'optimización'],
    'Crear contenido': ['contenido', 'creación', 'multimedia'],
  };

  const keywords: string[] = [];
  for (const goal of goals) {
    if (goalKeywords[goal]) {
      keywords.push(...goalKeywords[goal]);
    }
  }

  if (keywords.length === 0) {
    return [];
  }

  const matchingCourses = await db
    .select()
    .from(courses)
    .where(
      and(
        eq(courses.isPublished, true),
        excludeIds.length > 0 ? sql`${courses.id} NOT IN ${sql.raw(`(${excludeIds.map(() => '?').join(',')})`)}` : undefined
      )
    )
    .limit(6);

  const filtered = matchingCourses.filter(course => {
    const titleLower = course.title?.toLowerCase() || '';
    const descLower = course.description?.toLowerCase() || '';
    return keywords.some(keyword => 
      titleLower.includes(keyword.toLowerCase()) || 
      descLower.includes(keyword.toLowerCase())
    );
  });

  return filtered.map(c => ({
    id: c.id,
    title: c.title,
    description: c.description || undefined,
    categoryId: c.categoryId || undefined,
    difficulty: c.difficulty || undefined,
    coverImageUrl: undefined,
    reason: `Alineado con tu objetivo: ${goals[0]}`,
  }));
}

/**
 * Get courses based on main goal
 */
async function getCoursesByMainGoal(
  mainGoal: string,
  experienceLevel: string,
  excludeIds: string[]
): Promise<PersonalizedRecommendations['courses']> {
  // Similar logic to goals but more focused
  return getCoursesByGoals([mainGoal], experienceLevel, excludeIds);
}

/**
 * Get guides based on interests
 */
async function getGuidesByInterests(
  workAreas: string[],
  goals: string[],
  excludeIds: string[]
): Promise<PersonalizedRecommendations['guides']> {
  // Guides are courses with type 'guide'
  const guides = await db
    .select()
    .from(courses)
    .where(
      and(
        eq(courses.isPublished, true),
        eq(courses.type, 'guide'),
        excludeIds.length > 0 ? sql`${courses.id} NOT IN ${sql.raw(`(${excludeIds.map(() => '?').join(',')})`)}` : undefined
      )
    )
    .orderBy(desc(courses.createdAt))
    .limit(4);

  return guides.map(g => ({
    id: g.id,
    title: g.title,
    description: g.description || undefined,
    reason: 'Guía recomendada para ti',
  }));
}

/**
 * Get workshops based on interests
 */
async function getWorkshopsByInterests(
  workAreas: string[],
  experienceLevel: string,
  excludeIds: string[]
): Promise<PersonalizedRecommendations['workshops']> {
  // Workshops are courses with type 'workshop'
  const workshops = await db
    .select()
    .from(courses)
    .where(
      and(
        eq(courses.isPublished, true),
        eq(courses.type, 'workshop'),
        excludeIds.length > 0 ? sql`${courses.id} NOT IN ${sql.raw(`(${excludeIds.map(() => '?').join(',')})`)}` : undefined
      )
    )
    .orderBy(desc(courses.createdAt))
    .limit(3);

  return workshops.map(w => ({
    id: w.id,
    title: w.title,
    description: w.description || undefined,
    reason: 'Workshop recomendado',
  }));
}

/**
 * Remove duplicate recommendations
 */
function removeDuplicateRecommendations<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter(item => {
    if (seen.has(item.id)) {
      return false;
    }
    seen.add(item.id);
    return true;
  });
}

/**
 * Generate personalized next steps
 */
function generateNextSteps(
  onboarding: any,
  recommendations: PersonalizedRecommendations
): string[] {
  const steps: string[] = [];

  if (recommendations.courses.length > 0) {
    steps.push(`Comienza con "${recommendations.courses[0].title}"`);
  }

  if (onboarding.experienceLevel === 'beginner') {
    steps.push('Completa el curso básico de IA para principiantes');
  }

  if (onboarding.workAreas && onboarding.workAreas.length > 0) {
    steps.push(`Explora contenido específico para ${onboarding.workAreas[0]}`);
  }

  if (recommendations.workshops.length > 0) {
    steps.push('Únete a un workshop en vivo para aprendizaje práctico');
  }

  steps.push('Completa al menos 3 cursos para obtener tu primer certificado');

  return steps.slice(0, 4);
}

/**
 * Get onboarding-based automation suggestions
 */
export async function getOnboardingAutomationSuggestions(userId: string): Promise<{
  shouldSendWelcomeEmail: boolean;
  shouldRecommendCourses: boolean;
  shouldInviteToWorkshop: boolean;
  personalizedMessage?: string;
}> {
  const onboardingResponse = await db
    .select()
    .from(userOnboardingResponses)
    .where(eq(userOnboardingResponses.userId, userId))
    .limit(1);

  if (!onboardingResponse || onboardingResponse.length === 0) {
    return {
      shouldSendWelcomeEmail: true,
      shouldRecommendCourses: false,
      shouldInviteToWorkshop: false,
    };
  }

  const onboarding = onboardingResponse[0];
  const workAreas = onboarding.workAreas || [];
  const experienceLevel = onboarding.experienceLevel || 'beginner';
  const learningMethods = onboarding.learningMethods || [];

  return {
    shouldSendWelcomeEmail: true,
    shouldRecommendCourses: true,
    shouldInviteToWorkshop: learningMethods.includes('workshops') || learningMethods.includes('hands-on'),
    personalizedMessage: `Hola! Basado en tu perfil de ${workAreas[0] || 'interés'}, te recomendamos comenzar con nuestros cursos de nivel ${experienceLevel}.`,
  };
}

