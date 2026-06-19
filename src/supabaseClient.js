import { createClient } from '@supabase/supabase-js'

// ดึงค่า URL และ Anon Key ที่เราตั้งไว้ในระบบความปลอดภัยของ Vercel และสภาพแวดล้อมจำลอง
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)