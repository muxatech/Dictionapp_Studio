import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import { useAuth } from '../contexts/AuthContext'
import { generateShareCode } from '../utils/generateCode'
import { fetchWordInfo } from '../utils/wordInfo'
import { ListDetailSkeleton } from '../components/Skeleton'
import { X } from 'lucide-react'

export default function ListDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [list, setList] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editWords, setEditWords] = useState([])
  const [saving, setSaving] = useState(false)
  const [fetchingInfo, setFetchingInfo] = useState({})
  const [subscriberCount, setSubscriberCount] = useState(0)

  useEffect(() => {
    if (!user || !id) return

    let subscription = null

    const fetchData = async () => {
      const { data, error } = await supabase
        .from('lists')
        .select(`
          id, name, created_at,
          list_words (word, translation, description, sort_order),
          share_codes (code)
        `)
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (error || !data) {
        setError('Lista no encontrada')
        setLoading(false)
        return
      }

      const sortedWords = data.list_words?.sort((a, b) => a.sort_order - b.sort_order) || []
      setList({
        ...data,
        words: sortedWords,
        code: data.share_codes?.[0]?.code || null
      })
      setEditWords(sortedWords.map(w => ({ 
        word: w.word, 
        translation: w.translation, 
        description: w.description || '' 
      })))
      
      if (data.share_codes?.[0]?.code) {
        const { count } = await supabase
          .from('list_subscriptions')
          .select('*', { count: 'exact', head: true })
          .eq('list_id', id)

        setSubscriberCount(count || 0)

        // Remove existing channel if any
        supabase.removeChannel(supabase.channel(`list_subscriptions:${id}`))

        subscription = supabase
          .channel(`list_subscriptions:${id}`)
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'list_subscriptions',
            filter: `list_id=eq.${id}`
          }, (payload) => {
            setSubscriberCount(prev => {
              if (payload.eventType === 'INSERT') {
                return prev + 1
              } else if (payload.eventType === 'DELETE') {
                return Math.max(0, prev - 1)
              }
              return prev
            })
          })
          .subscribe()
      }

      setLoading(false)
    }

    fetchData()

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription)
      }
    }
  }, [user, id])

  const generateCode = async () => {
    setGenerating(true)
    setError('')
    try {
      const code = await generateShareCode()
      await supabase.from('share_codes').insert([{ list_id: id, code }])
      setList({ ...list, code })
    } catch (err) {
      setError('No se pudo generar el código, intenta de nuevo')
    } finally {
      setGenerating(false)
    }
  }

  const copyCode = async () => {
    if (list?.code) {
      await navigator.clipboard.writeText(list.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`¿Borrar "${list?.name}"? Esta acción no se puede deshacer.`)) return
    try {
      const { error } = await supabase
        .from('lists')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
      if (error) throw error
      navigate('/lists')
    } catch (err) {
      console.error('Error deleting list:', err)
      setError('Error al borrar la lista')
    }
  }

  const startEditing = () => {
    setEditing(true)
  }

  const cancelEditing = () => {
    setEditWords(list.words.map(w => ({ word: w.word, translation: w.translation })))
    setEditing(false)
  }

  const addWordRow = () => {
    setEditWords([...editWords, { word: '', translation: '' }])
  }

  const debounceTimers = useRef({})
  const inputRefs = useRef({})
  const [originalLang, setOriginalLang] = useState('en')
  const [translationLang, setTranslationLang] = useState('es')

  const addEditRow = (focusIndex = null) => {
    const newRow = { word: '', translation: '', description: '' }
    const newWords = [...editWords, newRow]
    setEditWords(newWords)
    if (focusIndex !== null) {
      setTimeout(() => {
        inputRefs.current[focusIndex]?.focus()
      }, 0)
    }
  }

  const updateEditWord = (index, field, value) => {
    let processedValue = value
    if ((field === 'word' || field === 'translation' || field === 'description') && processedValue.length > 0) {
      processedValue = processedValue.charAt(0).toUpperCase() + processedValue.slice(1)
    }

    const newWords = [...editWords]
    newWords[index][field] = processedValue

    if (field === 'word') {
      if (debounceTimers.current[index]) {
        clearTimeout(debounceTimers.current[index])
      }

      if (!processedValue.trim()) {
        setFetchingInfo(prev => ({ ...prev, [index]: false }))
        setEditWords(newWords)
        return
      }

      setFetchingInfo(prev => ({ ...prev, [index]: true }))

      debounceTimers.current[index] = setTimeout(() => {
        fetchWordInfo(processedValue, originalLang, translationLang).then((info) => {
          if (info) {
            setEditWords((prevWords) => {
              const updatedWords = [...prevWords]
              if (info.translation && !updatedWords[index].translation) {
                const capitalizedTranslation = info.translation.charAt(0).toUpperCase() + info.translation.slice(1)
                updatedWords[index].translation = capitalizedTranslation
              }
              if (info.description && !updatedWords[index].description) {
                const capitalizedDescription = info.description.charAt(0).toUpperCase() + info.description.slice(1)
                updatedWords[index].description = capitalizedDescription
              }
              return updatedWords
            })
          }
          setFetchingInfo(prev => ({ ...prev, [index]: false }))
        })
      }, 1000)
    }

    setEditWords(newWords)
  }

  const handleEditKeyDown = (e, index, field) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addEditRow(editWords.length)
    }
  }

  const removeEditWord = (index) => {
    if (editWords.length > 1) {
      setEditWords(editWords.filter((_, i) => i !== index))
    }
  }

  const saveWords = async () => {
    setSaving(true)
    setError('')
    try {
      const validWords = editWords.filter(w => w.word.trim() && w.translation.trim())
      const { error: deleteError } = await supabase
        .from('list_words')
        .delete()
        .eq('list_id', id)
      if (deleteError) throw deleteError

      if (validWords.length > 0) {
        const { error: insertError } = await supabase
          .from('list_words')
          .insert(validWords.map((w, i) => ({
            list_id: id,
            word: w.word,
            translation: w.translation,
            description: w.description || null,
            sort_order: i
          })))
        if (insertError) throw insertError
      }

      const { data: updatedWords } = await supabase
        .from('list_words')
        .select('word, translation, description, sort_order')
        .eq('list_id', id)
        .order('sort_order')

      setList({ ...list, words: updatedWords || [] })
      setEditing(false)
    } catch (err) {
      console.error('Error saving words:', err)
      setError('Error al guardar los cambios')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <ListDetailSkeleton />
  if (error && !list) return <div className="text-center py-8 text-red-600">{error}</div>

  return (
    <div className="dark:text-white">
      <div className="flex items-center justify-between mb-8">
        <div>
          <button onClick={() => navigate(-1)} className="text-primary dark:text-accent hover:text-primary-dark dark:hover:text-accent-dark mb-2">
            ← Volver
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{list?.name}</h1>
        </div>
        <button
          onClick={handleDelete}
          className="bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          Borrar lista
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Vocabulario ({list?.words?.length || 0} palabras)</h2>
          {!editing ? (
            <button
              onClick={startEditing}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
            >
              Editar palabras
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={cancelEditing}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={saveWords}
                disabled={saving}
                className="bg-accent text-primary px-4 py-1 rounded-lg text-sm font-medium hover:bg-accent-dark transition-colors disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          )}
        </div>
        {!editing ? (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="grid grid-cols-3 gap-4 p-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300">
              <div>Palabra</div>
              <div>Tradución</div>
              <div>Descripción</div>
            </div>
            {list?.words?.map((w, i) => (
              <div key={i} className="grid grid-cols-3 gap-4 p-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className="text-gray-900 dark:text-white font-medium">{w.word}</div>
                <div className="text-gray-700 dark:text-gray-300">{w.translation}</div>
                <div className="text-gray-600 dark:text-gray-400 text-sm">{w.description || '-'}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="grid grid-cols-12 gap-4 p-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300">
              <div className="col-span-3">Palabra</div>
              <div className="col-span-3">Traducción</div>
              <div className="col-span-5">Descripción</div>
              <div className="col-span-1"></div>
            </div>
            {editWords.map((w, i) => (
              <div key={i} className="grid grid-cols-12 gap-4 p-3 border-b border-gray-100 dark:border-gray-700 items-center">
                <div className="col-span-3 relative">
                  <input
                    ref={(el) => (inputRefs.current[i] = el)}
                    type="text"
                    value={w.word}
                    onChange={(e) => updateEditWord(i, 'word', e.target.value)}
                    onKeyDown={(e) => handleEditKeyDown(e, i, 'word')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded focus:ring-2 focus:ring-accent focus:border-accent outline-none"
                    placeholder="hello"
                  />
                  {fetchingInfo[i] && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                      <div className="animate-spin h-4 w-4 border-2 border-accent border-t-transparent rounded-full"></div>
                    </div>
                  )}
                </div>
                <input
                  type="text"
                  value={w.translation}
                  onChange={(e) => updateEditWord(i, 'translation', e.target.value)}
                  onKeyDown={(e) => handleEditKeyDown(e, i, 'translation')}
                  className="col-span-3 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded focus:ring-2 focus:ring-accent focus:border-accent outline-none"
                  placeholder="hola"
                />
                <input
                  type="text"
                  value={w.description}
                  onChange={(e) => updateEditWord(i, 'description', e.target.value)}
                  onKeyDown={(e) => handleEditKeyDown(e, i, 'description')}
                  className="col-span-5 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded focus:ring-2 focus:ring-accent focus:border-accent outline-none"
                  placeholder="saludo usado al saludar a alguien"
                />
                <button
                  type="button"
                  onClick={() => removeEditWord(i)}
                  className="col-span-1 text-red-500 hover:text-red-700 text-sm dark:text-red-400 dark:hover:text-red-300"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addEditRow(editWords.length)}
              className="m-3 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              + Añadir fila
            </button>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Código de acceso</h2>

        {list?.code ? (
          <div>
            <div className="bg-accent/20 dark:bg-accent/10 border border-accent dark:border-accent/50 rounded-lg p-8 text-center mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Tus alumnos introducen este código en la app</p>
              <div className="text-5xl font-bold text-primary dark:text-accent tracking-wider">{list.code}</div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-4">
                {subscriberCount} {subscriberCount === 1 ? 'alumno suscrito' : 'alumnos suscritos'}
              </p>
            </div>
            <button
              onClick={copyCode}
              className="w-full bg-accent text-primary py-3 rounded-lg font-semibold hover:bg-accent-dark transition-colors"
            >
              {copied ? '¡Copiado!' : 'Copiar código'}
            </button>
          </div>
        ) : (
          <div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">Genera un código único para que tus alumnos accedan a esta lista desde la app.</p>
            <button
              onClick={generateCode}
              disabled={generating}
              className="w-full bg-accent text-primary py-3 rounded-lg font-semibold hover:bg-accent-dark transition-colors disabled:opacity-50"
            >
              {generating ? 'Generando...' : 'Generar código'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
