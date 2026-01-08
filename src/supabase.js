import { createClient } from '@supabase/supabase-js'

// IMPORTANTE: Reemplazar con las credenciales del nuevo proyecto de Supabase
const supabaseUrl = 'TU_SUPABASE_URL'
const supabaseKey = 'TU_SUPABASE_KEY'

export const supabase = createClient(supabaseUrl, supabaseKey)
