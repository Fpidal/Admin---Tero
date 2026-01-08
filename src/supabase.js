import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kvdnbnfcfhxxznxngxre.supabase.co'
const supabaseKey = 'sb_publishable_gv9IuIWH54yzS6JZgouD9Q_sGVjyT1Y'

export const supabase = createClient(supabaseUrl, supabaseKey)


