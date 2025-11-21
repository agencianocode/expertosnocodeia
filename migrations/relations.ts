import { relations } from "drizzle-orm/relations";
import { categories, courses, users, certificates, userProgress, courseTags, tags, courseTemplates, mediaFiles, adminUsers, lessons, contentBlocks, userSavedCourses, userLessonProgress, rooms, userOnboardingResponses, courseCategories, userSubscriptions, subscriptionPlans, userUsage, phases, promoBanners, phaseContent, purchases, userAccess, comments, userRecentActivity, commentLikes } from "./schema";

export const coursesRelations = relations(courses, ({one, many}) => ({
	category: one(categories, {
		fields: [courses.categoryId],
		references: [categories.id]
	}),
	certificates: many(certificates),
	userProgresses: many(userProgress),
	courseTags: many(courseTags),
	userSavedCourses: many(userSavedCourses),
	userLessonProgresses: many(userLessonProgress),
	courseCategories: many(courseCategories),
	lessons: many(lessons),
	userRecentActivities: many(userRecentActivity),
}));

export const categoriesRelations = relations(categories, ({many}) => ({
	courses: many(courses),
	courseTemplates: many(courseTemplates),
	rooms: many(rooms),
	courseCategories: many(courseCategories),
}));

export const certificatesRelations = relations(certificates, ({one}) => ({
	user: one(users, {
		fields: [certificates.userId],
		references: [users.id]
	}),
	course: one(courses, {
		fields: [certificates.courseId],
		references: [courses.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	certificates: many(certificates),
	userProgresses: many(userProgress),
	courseTemplates: many(courseTemplates),
	mediaFiles: many(mediaFiles),
	adminUsers: many(adminUsers),
	contentBlocks: many(contentBlocks),
	userSavedCourses: many(userSavedCourses),
	userLessonProgresses: many(userLessonProgress),
	userOnboardingResponses: many(userOnboardingResponses),
	userSubscriptions: many(userSubscriptions),
	userUsages: many(userUsage),
	purchases: many(purchases),
	userAccesses: many(userAccess),
	comments: many(comments),
	userRecentActivities: many(userRecentActivity),
	commentLikes: many(commentLikes),
}));

export const userProgressRelations = relations(userProgress, ({one}) => ({
	user: one(users, {
		fields: [userProgress.userId],
		references: [users.id]
	}),
	course: one(courses, {
		fields: [userProgress.courseId],
		references: [courses.id]
	}),
}));

export const courseTagsRelations = relations(courseTags, ({one}) => ({
	course: one(courses, {
		fields: [courseTags.courseId],
		references: [courses.id]
	}),
	tag: one(tags, {
		fields: [courseTags.tagId],
		references: [tags.id]
	}),
}));

export const tagsRelations = relations(tags, ({many}) => ({
	courseTags: many(courseTags),
}));

export const courseTemplatesRelations = relations(courseTemplates, ({one}) => ({
	category: one(categories, {
		fields: [courseTemplates.categoryId],
		references: [categories.id]
	}),
	user: one(users, {
		fields: [courseTemplates.createdBy],
		references: [users.id]
	}),
}));

export const mediaFilesRelations = relations(mediaFiles, ({one}) => ({
	user: one(users, {
		fields: [mediaFiles.uploadedBy],
		references: [users.id]
	}),
}));

export const adminUsersRelations = relations(adminUsers, ({one}) => ({
	user: one(users, {
		fields: [adminUsers.userId],
		references: [users.id]
	}),
}));

export const contentBlocksRelations = relations(contentBlocks, ({one}) => ({
	lesson: one(lessons, {
		fields: [contentBlocks.lessonId],
		references: [lessons.id]
	}),
	user: one(users, {
		fields: [contentBlocks.createdBy],
		references: [users.id]
	}),
}));

export const lessonsRelations = relations(lessons, ({one, many}) => ({
	contentBlocks: many(contentBlocks),
	userLessonProgresses: many(userLessonProgress),
	course: one(courses, {
		fields: [lessons.courseId],
		references: [courses.id]
	}),
	comments: many(comments),
	userRecentActivities: many(userRecentActivity),
}));

export const userSavedCoursesRelations = relations(userSavedCourses, ({one}) => ({
	user: one(users, {
		fields: [userSavedCourses.userId],
		references: [users.id]
	}),
	course: one(courses, {
		fields: [userSavedCourses.courseId],
		references: [courses.id]
	}),
}));

export const userLessonProgressRelations = relations(userLessonProgress, ({one}) => ({
	user: one(users, {
		fields: [userLessonProgress.userId],
		references: [users.id]
	}),
	lesson: one(lessons, {
		fields: [userLessonProgress.lessonId],
		references: [lessons.id]
	}),
	course: one(courses, {
		fields: [userLessonProgress.courseId],
		references: [courses.id]
	}),
}));

export const roomsRelations = relations(rooms, ({one, many}) => ({
	category: one(categories, {
		fields: [rooms.categoryId],
		references: [categories.id]
	}),
	phases: many(phases),
	promoBanners: many(promoBanners),
}));

export const userOnboardingResponsesRelations = relations(userOnboardingResponses, ({one}) => ({
	user: one(users, {
		fields: [userOnboardingResponses.userId],
		references: [users.id]
	}),
}));

export const courseCategoriesRelations = relations(courseCategories, ({one}) => ({
	course: one(courses, {
		fields: [courseCategories.courseId],
		references: [courses.id]
	}),
	category: one(categories, {
		fields: [courseCategories.categoryId],
		references: [categories.id]
	}),
}));

export const userSubscriptionsRelations = relations(userSubscriptions, ({one}) => ({
	user: one(users, {
		fields: [userSubscriptions.userId],
		references: [users.id]
	}),
	subscriptionPlan: one(subscriptionPlans, {
		fields: [userSubscriptions.planId],
		references: [subscriptionPlans.id]
	}),
}));

export const subscriptionPlansRelations = relations(subscriptionPlans, ({many}) => ({
	userSubscriptions: many(userSubscriptions),
}));

export const userUsageRelations = relations(userUsage, ({one}) => ({
	user: one(users, {
		fields: [userUsage.userId],
		references: [users.id]
	}),
}));

export const phasesRelations = relations(phases, ({one, many}) => ({
	room: one(rooms, {
		fields: [phases.roomId],
		references: [rooms.id]
	}),
	phaseContents: many(phaseContent),
}));

export const promoBannersRelations = relations(promoBanners, ({one}) => ({
	room: one(rooms, {
		fields: [promoBanners.roomId],
		references: [rooms.id]
	}),
}));

export const phaseContentRelations = relations(phaseContent, ({one}) => ({
	phase: one(phases, {
		fields: [phaseContent.phaseId],
		references: [phases.id]
	}),
}));

export const purchasesRelations = relations(purchases, ({one, many}) => ({
	user: one(users, {
		fields: [purchases.userId],
		references: [users.id]
	}),
	userAccesses: many(userAccess),
}));

export const userAccessRelations = relations(userAccess, ({one}) => ({
	user: one(users, {
		fields: [userAccess.userId],
		references: [users.id]
	}),
	purchase: one(purchases, {
		fields: [userAccess.purchaseId],
		references: [purchases.id]
	}),
}));

export const commentsRelations = relations(comments, ({one, many}) => ({
	lesson: one(lessons, {
		fields: [comments.lessonId],
		references: [lessons.id]
	}),
	user: one(users, {
		fields: [comments.userId],
		references: [users.id]
	}),
	commentLikes: many(commentLikes),
}));

export const userRecentActivityRelations = relations(userRecentActivity, ({one}) => ({
	user: one(users, {
		fields: [userRecentActivity.userId],
		references: [users.id]
	}),
	course: one(courses, {
		fields: [userRecentActivity.courseId],
		references: [courses.id]
	}),
	lesson: one(lessons, {
		fields: [userRecentActivity.lastLessonId],
		references: [lessons.id]
	}),
}));

export const commentLikesRelations = relations(commentLikes, ({one}) => ({
	comment: one(comments, {
		fields: [commentLikes.commentId],
		references: [comments.id]
	}),
	user: one(users, {
		fields: [commentLikes.userId],
		references: [users.id]
	}),
}));