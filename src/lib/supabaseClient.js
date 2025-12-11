import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log("URL LOADED =>", supabaseUrl);
console.log("KEY LOADED =>", supabaseAnonKey ? "OK" : "NOT LOADED");

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
