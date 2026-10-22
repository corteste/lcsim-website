import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://hzenyasrargpsbuaxmxl.supabase.co"; // Project URL
const supabaseAnonKey = "sb_publishable_AaFji_-CD1ffDN0-zvPZ5A_qgeQQnC8"; // la tua public anon key

export const supabase = createClient(supabaseUrl, supabaseAnonKey);