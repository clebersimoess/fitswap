import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vaexdgazwri.fbbn1uvew.supabase.co'
const supabaseAnonKey = 'SUA_CHAVE_ANON_PUBLIC_AQUI'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)