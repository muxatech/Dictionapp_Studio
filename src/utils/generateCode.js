import { supabase } from './supabase'

export const generateShareCode = async () => {
  let code = ''
  let isUnique = false
  while (!isUnique) {
    code = Math.random().toString(36).substring(2, 8).toUpperCase()
    const { data } = await supabase
      .from('share_codes')
      .select('code')
      .eq('code', code)
      .single()
    if (!data) isUnique = true
  }
  return code
}
