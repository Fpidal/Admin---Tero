import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dpghrdgippisgzvlahwi.supabase.co'
const supabaseAnonKey = 'sb_publishable_jYyD3hx7m55tmzQCzz9vgw_iZPgnJNn'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
