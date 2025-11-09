import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://hzenyasrargpsbuaxmxl.supabase.co"; // Project URL
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6ZW55YXNyYXJncHNidWF4bXhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1ODk3NTgsImV4cCI6MjA3ODE2NTc1OH0.OcsJSJhUEfkY5KVKfaPffebzyiV_rr0GZTiIQNPcnFw"; // la tua public anon key

export const supabase = createClient(supabaseUrl, supabaseAnonKey);