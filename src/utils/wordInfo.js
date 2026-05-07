import { supabase } from './supabase'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export async function fetchWordInfo(word, originalLang = 'en', translationLang = 'es') {
  try {
    console.log('Calling generate-word with:', { word, original_lang: originalLang, translation_lang: translationLang })
    
    const response = await fetch(`${supabaseUrl}/functions/v1/generate-word`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey
      },
      body: JSON.stringify({
        word,
        original_lang: originalLang,
        translation_lang: translationLang
      })
    })
    
    console.log('Response status:', response.status)
    const data = await response.json()
    console.log('Response data:', data)
    
    if (!response.ok) {
      console.error('Error response:', data)
      return null
    }
    
    if (data?.is_valid === false) {
      console.warn('Invalid word:', data.message)
      return null
    }
    
    return {
      translation: data?.translation || '',
      description: data?.definition || ''
    }
  } catch (err) {
    console.error('Error fetching word info:', err)
    return null
  }
}
