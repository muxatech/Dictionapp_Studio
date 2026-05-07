import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabase";
import { useAuth } from "../contexts/AuthContext";
import { generateShareCode } from "../utils/generateCode";
import { fetchWordInfo } from "../utils/wordInfo";

export default function CreateList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [words, setWords] = useState([{ word: "", translation: "", description: "" }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fetchingInfo, setFetchingInfo] = useState({});
  const debounceTimers = useRef({});
  const inputRefs = useRef({});
  const [originalLang, setOriginalLang] = useState("en");
  const [translationLang, setTranslationLang] = useState("es");

  const addRow = (focusIndex = null) => {
    const newRow = { word: "", translation: "", description: "" };
    const newWords = [...words, newRow];
    setWords(newWords);
    if (focusIndex !== null) {
      setTimeout(() => {
        inputRefs.current[focusIndex]?.focus();
      }, 0);
    }
  };

  const updateWord = (index, field, value) => {
    let processedValue = value;
    if ((field === "word" || field === "translation" || field === "description") && processedValue.length > 0) {
      processedValue = processedValue.charAt(0).toUpperCase() + processedValue.slice(1);
    }

    const newWords = [...words];
    newWords[index][field] = processedValue;

    if (field === "word") {
      if (debounceTimers.current[index]) {
        clearTimeout(debounceTimers.current[index]);
      }

      if (!processedValue.trim()) {
        setFetchingInfo((prev) => ({ ...prev, [index]: false }));
        setWords(newWords);
        return;
      }

      setFetchingInfo((prev) => ({ ...prev, [index]: true }));

      debounceTimers.current[index] = setTimeout(() => {
        fetchWordInfo(processedValue, originalLang, translationLang).then((info) => {
          if (info) {
            setWords((prevWords) => {
              const updatedWords = [...prevWords];
              if (info.translation && !updatedWords[index].translation) {
                const capitalizedTranslation = info.translation.charAt(0).toUpperCase() + info.translation.slice(1);
                updatedWords[index].translation = capitalizedTranslation;
              }
              if (info.description && !updatedWords[index].description) {
                const capitalizedDescription = info.description.charAt(0).toUpperCase() + info.description.slice(1);
                updatedWords[index].description = capitalizedDescription;
              }
              return updatedWords;
            });
          }
          setFetchingInfo((prev) => ({ ...prev, [index]: false }));
        });
      }, 1000);
    }

    setWords(newWords);
  };

  const handleKeyDown = (e, index, field) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addRow(words.length);
    }
  };

  const removeRow = (index) => {
    if (words.length > 1) {
      setWords(words.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (originalLang === translationLang) {
      setError("El idioma original y de traducción no pueden ser iguales");
      return;
    }

    if (!name.trim()) {
      setError("Pon un nombre a la lista");
      return;
    }

    const validWords = words.filter((w) => w.word.trim() && w.translation.trim());
    if (validWords.length === 0) {
      setError("Añade al menos una palabra");
      return;
    }

    setLoading(true);
    try {
      const { data: list, error: listError } = await supabase
        .from("lists")
        .insert([{ name, user_id: user.id }])
        .select()
        .single();

      if (listError) throw listError;

      await supabase.from("list_words").insert(
        validWords.map((w, i) => ({
          list_id: list.id,
          word: w.word,
          translation: w.translation,
          description: w.description || null,
          sort_order: i,
        }))
      );

      const code = await generateShareCode();
      await supabase.from("share_codes").insert([{ list_id: list.id, code }]);

      navigate("/list/" + list.id);
    } catch (err) {
      setError("Error al guardar la lista");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dark:text-white">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Crear lista</h1>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nombre de la lista</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none"
             placeholder="Ej: Saludos básicos"
            autoFocus
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Idiomas</label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Original</label>
              <select
                 value={originalLang}
                 onChange={(e) => setOriginalLang(e.target.value)}
                 className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded focus:ring-2 focus:ring-accent focus:border-accent outline-none"
               >
                 <option value="en" disabled={translationLang === "en"}>Inglés</option>
                 <option value="es" disabled={translationLang === "es"}>Español</option>
                 <option value="fr" disabled={translationLang === "fr"}>Francés</option>
                 <option value="de" disabled={translationLang === "de"}>Alemán</option>
               </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Traducción</label>
              <select
                 value={translationLang}
                 onChange={(e) => setTranslationLang(e.target.value)}
                 className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded focus:ring-2 focus:ring-accent focus:border-accent outline-none"
               >
                 <option value="en" disabled={originalLang === "en"}>Inglés</option>
                 <option value="es" disabled={originalLang === "es"}>Español</option>
                 <option value="fr" disabled={originalLang === "fr"}>Francés</option>
                 <option value="de" disabled={originalLang === "de"}>Alemán</option>
               </select>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Vocabulario <span className="text-gray-500 font-normal">({words.filter(w => w.word.trim() && w.translation.trim()).length} palabras)</span>
          </label>
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="grid grid-cols-12 gap-4 p-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300">
              <div className="col-span-3">Palabra</div>
               <div className="col-span-3">Traducción</div>
               <div className="col-span-5">Descripción</div>
              <div className="col-span-1"></div>
            </div>
             {words.map((w, i) => (
                <div key={i} className="grid grid-cols-12 gap-4 p-3 border-b border-gray-100 dark:border-gray-700 items-center">
                  <div className="col-span-3 relative">
                    <input
                      ref={(el) => (inputRefs.current[i] = el)}
                      type="text"
                      value={w.word}
                      onChange={(e) => updateWord(i, "word", e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, i, "word")}
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
                    onChange={(e) => updateWord(i, "translation", e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, i, "translation")}
                    className="col-span-3 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded focus:ring-2 focus:ring-accent focus:border-accent outline-none"
                    placeholder="hola"
                  />
                  <input
                    type="text"
                    value={w.description}
                    onChange={(e) => updateWord(i, "description", e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, i, "description")}
                    className="col-span-5 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded focus:ring-2 focus:ring-accent focus:border-accent outline-none"
                     placeholder="saludo usado al saludar a alguien"
                  />
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    className="col-span-1 text-red-500 hover:text-red-700 text-sm"
                  >
                    X
                  </button>
                </div>
               ))}
             </div>
           <button
            type="button"
            onClick={() => addRow(words.length)}
            className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            + Añadir fila
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-accent text-primary py-3 rounded-lg font-semibold hover:bg-accent-dark transition-colors disabled:opacity-50"
        >
           {loading ? "Guardando..." : "Guardar y generar código"}
        </button>
      </form>
    </div>
  );
}
