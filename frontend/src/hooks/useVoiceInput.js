// ═══════════════════════════════════════════════════════════
//  hooks/useVoiceInput.js  —  Velverse AI
//  ✅ FIXED: voice works multiple times without stopping
//  ✅ FIXED: works after input-type changes (no stale closures)
//  ✅ FIXED: recognition instance rebuilt cleanly each start()
// ═══════════════════════════════════════════════════════════

import { useState, useRef, useCallback, useEffect } from 'react'

export default function useVoiceInput({
  onResult,           // called with final transcript string
  lang = 'en-US',     // BCP-47 language tag
  continuous = false, // keep listening after pause?
  interimResults = true,
} = {}) {

  const [listening,  setListening ] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interim,    setInterim   ] = useState('')
  const [error,      setError     ] = useState('')
  const recognitionRef = useRef(null)

  // Keep latest callback in a ref so recognition handlers never go stale
  const onResultRef = useRef(onResult)
  useEffect(() => { onResultRef.current = onResult }, [onResult])

  const langRef = useRef(lang)
  useEffect(() => { langRef.current = lang }, [lang])

  const supported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

  const start = useCallback(() => {
    if (!supported) {
      setError('Speech recognition is not supported in this browser. Use Chrome or Edge.')
      return
    }

    // Always abort any existing instance before creating a new one
    if (recognitionRef.current) {
      try { recognitionRef.current.abort() } catch {}
      recognitionRef.current = null
    }

    setTranscript('')
    setInterim('')
    setError('')

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const r  = new SR()
    r.lang            = langRef.current
    r.continuous      = continuous
    r.interimResults  = interimResults
    r.maxAlternatives = 1

    // Track accumulated final text locally (avoids stale state closure)
    let accumulated = ''

    r.onstart = () => { setListening(true); setError('') }

    r.onresult = (e) => {
      let finalText = '', interimText = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) finalText   += t
        else                       interimText += t
      }
      if (finalText) {
        accumulated = (accumulated + ' ' + finalText).trim()
        setTranscript(accumulated)
        setInterim('')
        onResultRef.current && onResultRef.current(accumulated)
      } else {
        setInterim(interimText)
      }
    }

    r.onerror = (e) => {
      const msgs = {
        'no-speech':           'No speech detected. Try again.',
        'audio-capture':       'Microphone not found.',
        'not-allowed':         'Microphone permission denied.',
        'network':             'Network error during recognition.',
        'aborted':             '',
        'service-not-allowed': 'Speech service not allowed.',
      }
      const msg = msgs[e.error] ?? `Speech error: ${e.error}`
      if (msg) setError(msg)
      setListening(false)
      setInterim('')
    }

    r.onend = () => { setListening(false); setInterim('') }

    recognitionRef.current = r
    try { r.start() } catch (e) { setError(`Could not start microphone: ${e.message}`) }
  }, [supported, continuous, interimResults])

  const stop = useCallback(() => {
    try { recognitionRef.current?.stop() } catch {}
    setListening(false)
    setInterim('')
  }, [])

  const reset = useCallback(() => {
    try { recognitionRef.current?.abort() } catch {}
    recognitionRef.current = null
    setListening(false)
    setTranscript('')
    setInterim('')
    setError('')
  }, [])

  useEffect(() => {
    return () => { try { recognitionRef.current?.abort() } catch {} }
  }, [])

  return { listening, transcript, interim, error, supported, start, stop, reset }
}
