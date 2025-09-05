// Authentication Hook - Migration Bridge
// Automatically switches between legacy and Supabase auth

// For now, use simple auth during migration period
// Will switch to Supabase auth when credentials are configured
export { useSimpleAuth as useAuth } from "./use-simple-auth";