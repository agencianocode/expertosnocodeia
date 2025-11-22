# Overview

This is a comprehensive NoCode education ecosystem called "Expertos NoCode IA" that consists of three main components:

1. **Main Landing** (expertosnocodeia.com) - Public-facing website with articles, guides, and tools
2. **University Page** (expertosnocodeia.com/universidad-nocode-ia) - Course catalog and pricing
3. **LMS Application** (app.expertosnocodeia.com) - Full learning management system

The system features a modern React frontend with Express.js backend, PostgreSQL database with Drizzle ORM, and integrates Replit's authentication system. The ecosystem is designed to funnel users from free content to paid courses and finally into the comprehensive learning application.

## Recent Implementation (November 22, 2025)
- **Community System Implementation**: Complete Netflix-style learning community with announcements feed
- **Admin Community Panel**: Full CRUD endpoints for administrators to create/edit/delete announcements (/api/admin/community/posts)
- **Announcements Feed**: Users can view announcements in /community/anuncios channel with LinkedIn/Facebook-style post cards showing date, time, likes, and response counts
- **Comment System**: Individual comment threads in right sidebar with Discord/Slack-style interface - click message icon on any post to open comments
- **Profile Photo Upload**: Implemented profile image upload feature in /profile page with Object Storage integration and automatic database URL persistence
- **Three-Column Layout**: Community uses modern three-column design - left sidebar (channels), center (posts feed), right sidebar (comments on click)
- **Admin-Only Posts**: Only administrators can create announcements via /admin/community; users can only view and comment
- **Comment Display**: Real-time comment fetching with user avatars, names, timestamps, and content in right sidebar comments panel

## Previous Implementation (November 18, 2025)
- **Enhanced Activity Tracking**: Extended "Continúa donde lo dejaste" to track all content types (courses, guides, workshops, room courses) with room context preservation
- **Room Context Navigation Fix**: Cursos de sala SIEMPRE navegan con contexto (/sala/:slug/curso/:id), NUNCA solo /curso/:id
- **Multi-Content Type Support**: userRecentActivity table now includes contentType and roomSlug fields to support diverse content navigation
- **Backend Room Slug Resolution**: getUserRecentContent joins with phase_content → phases → rooms to automatically resolve room slug for courses belonging to rooms
- **Dashboard Direct Navigation**: From "Continúa donde lo dejaste", users navigate directly to /sala/:slug/curso/:id to continue learning in room context
- **Backend API Enhancement**: Updated /api/track-activity and /api/dashboard endpoints to handle all content types with room context

## Previous Implementation (January 2025)
- **Ecosistema Completo**: Implementada arquitectura de tres niveles (landing + universidad + app LMS)
- **Landing Principal**: Página pública con artículos, guías y herramientas NoCode
- **Página Universidad**: Sistema de cursos, certificaciones y precios basado en rundown.ai/ai-university
- **Detección de Dominio**: Sistema inteligente que detecta app.dominio vs dominio principal
- **Contenido Localizado**: Todo el contenido adaptado de AI/inglés a NoCode/español

## Previous Implementation (August 22, 2025)
- **Lesson Completion System**: Fully implemented lesson progress tracking with database persistence
- **Course Layout Optimization**: Finalized responsive three-column layout (250px left sidebar, 920px center content, 560px right sidebar)
- **Interactive UI Elements**: Added clickable lesson completion buttons with real-time progress updates
- **Progress Visualization**: Dynamic progress bars that update automatically when lessons are completed
- **Cloud File Storage System**: Integrated Replit Object Storage for lesson resources with direct file upload/download capabilities
- **Resource Management**: Conditional resource cards in course sidebar with comprehensive admin interface for file management
- **Custom Course Cover Images**: Fully functional upload system with ObjectStorage integration, automatic URL normalization, and optimized CourseCard display
- **Course Card Enhancements**: Bookmark button repositioned to top-right with gray background, zoom effect moved to entire card, image display optimized
- **Mobile Lesson Navigation**: Fully implemented dual-button navigation system for mobile/tablet with proper spacing to avoid navigation overlap
- **Fixed Sidebar Layout**: Both left and right sidebars now remain fixed during scroll with clean scrollbar management (only right sidebar shows scrollbar)
- **Scrollbar Optimization**: Eliminated unwanted middle scrollbar with custom CSS class `.hide-scrollbar` for cross-browser compatibility
- **Card Alignment Perfection**: Course progress card aligned perfectly with content card in right sidebar using optimized `pt-12` spacing
- **Grid Standardization**: Unified 4-column grid (xl:grid-cols-4) across all pages: Home, Courses, and Guides
- **Category Filtering System**: Implemented clickable topic cards in Home page that filter all content (courses, guides, workshops) by category
- **Certificate Button Styling**: Updated certificate badge with Award icon and gray background to match design reference
- **Topic Cards Redesign**: Reduced height, Spanish labels, updated icons (Code2, Building2, BarChart3) with specific colors per category
- **"Continúa donde lo dejaste" System**: Complete implementation of recent course activity tracking with userRecentActivity table, automatic tracking when viewing courses, horizontal display layout, no duplicates using DISTINCT ON, and real-time cache invalidation
- **Horizontal Card Navigation**: Implemented smooth card-by-card navigation with arrow controls in "Continúa donde lo dejaste" section, supporting up to 8 cards with visual slide animations
- **Uniform Card Heights**: Standardized all course cards to have consistent heights with fixed 48px (h-12) title sections supporting 2-line titles
- **Visual Progress Indicators**: Added red progress bars to cards showing course completion percentage, with progress text display for active learning sessions
- **Course/Workshop Routing Fix**: Added missing `/curso/:id` route for Spanish course URLs, fixed filtering in courses page to exclude workshops
- **Workshop Sidebar Redesign**: Complete restructure of workshop sidebar into single card with subtle separators, includes instructor profile with avatar, publication date, downloadable resources section, and category badges matching exact design reference

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Routing**: Wouter for client-side routing with conditional rendering based on authentication state
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom dark theme variables and CSS custom properties
- **Form Handling**: React Hook Form with Zod validation through @hookform/resolvers

## Backend Architecture
- **Framework**: Express.js server with TypeScript support
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Replit's OpenID Connect (OIDC) authentication with Passport.js
- **Session Management**: Express sessions stored in PostgreSQL using connect-pg-simple
- **API Design**: RESTful endpoints with consistent error handling middleware
- **Development**: Hot module replacement via Vite integration in development mode

## Database Schema Design
- **Users Table**: Stores user profiles from Replit auth (email, names, profile images)
- **Courses Table**: Course content with metadata (title, description, difficulty, duration, type)
- **Categories Table**: Course categorization system with icons and colors
- **Lessons Table**: Individual lesson content within courses
- **User Progress Table**: Tracks completion status and progress percentages per user/course
- **User Recent Activity Table**: Tracks recent course views for "Continúa donde lo dejaste" feature
- **Certificates Table**: Records completed certifications with issue dates
- **Sessions Table**: PostgreSQL-backed session storage for authentication

## Authentication & Authorization
- **Provider**: Replit OIDC integration for seamless authentication within Replit environment
- **Session Storage**: PostgreSQL-backed sessions with 7-day TTL
- **Middleware**: Custom authentication middleware that protects API routes
- **User Management**: Automatic user creation/updates on successful authentication
- **Security**: HTTP-only cookies, CSRF protection via same-origin policy

## Data Flow Patterns
- **Client-Server Communication**: JSON API with consistent error response format
- **Caching Strategy**: React Query provides client-side caching with background refetching
- **Progress Tracking**: Real-time progress updates stored in database with optimistic UI updates
- **Course Management**: Hierarchical structure (Categories → Courses → Lessons) with progress rollup

# External Dependencies

## Database
- **PostgreSQL**: Primary database using Neon serverless PostgreSQL with connection pooling
- **Drizzle Kit**: Database migrations and schema management tool

## Authentication Services
- **Replit OIDC**: OpenID Connect provider for user authentication
- **Replit Domains**: Environment-specific domain configuration for OAuth callbacks

## UI Component Libraries
- **Radix UI**: Headless UI primitives for accessible component foundation
- **Lucide React**: Icon library for consistent iconography throughout the application
- **date-fns**: Date manipulation and formatting utilities

## Development Tools
- **Vite**: Frontend build tool with HMR and development server
- **ESBuild**: Fast JavaScript bundler for production builds
- **Replit Cartographer**: Development tooling integration for Replit environment
- **TypeScript**: Type safety across frontend, backend, and shared schema definitions

## Runtime Dependencies
- **WebSocket Support**: ws library for Neon database connections
- **Class Utilities**: clsx and tailwind-merge for conditional CSS class handling
- **Command Palette**: cmdk for search and navigation functionality
- **Memoization**: memoizee for performance optimization of expensive operations