import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import type { IScannerControls } from '@zxing/browser'

/** Escáner de código de barras universal (zxing, cargado bajo demanda).
 *  Funciona en Android, iOS y escritorio donde haya cámara. */
export function BarcodeScanner({ onDetect, onClose }: { onDetect: (code: string) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let controls: IScannerControls | undefined
    let cancelled = false

    ;(async () => {
      try {
        const { BrowserMultiFormatReader } = await import('@zxing/browser')
        const reader = new BrowserMultiFormatReader()
        const v = videoRef.current
        if (!v) return
        controls = await reader.decodeFromConstraints({ video: { facingMode: 'environment' } }, v, (result) => {
          if (cancelled || !result) return
          cancelled = true
          try { controls?.stop() } catch { /* ignore */ }
          onDetect(result.getText())
        })
        if (cancelled) { try { controls?.stop() } catch { /* ignore */ } }
      } catch {
        setError('No se pudo abrir la cámara. Revisa los permisos.')
      }
    })()

    return () => {
      cancelled = true
      try { controls?.stop() } catch { /* ignore */ }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return createPortal(
    <div style={scrim}>
      <video ref={videoRef} muted playsInline style={video} />
      <div style={frame} />
      <div style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top,0px) + 18px)', left: 0, right: 0, textAlign: 'center', color: '#fff', fontWeight: 700, textShadow: '0 1px 3px rgba(0,0,0,.6)' }}>
        {error || 'Apunta al código de barras'}
      </div>
      <button aria-label="Cerrar" onClick={onClose} style={closeBtn}><X size={22} /></button>
    </div>,
    document.body,
  )
}

const scrim: React.CSSProperties = { position: 'fixed', inset: 0, zIndex: 70, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }
const video: React.CSSProperties = { width: '100%', height: '100%', objectFit: 'cover' }
const frame: React.CSSProperties = { position: 'absolute', width: 'min(78%, 320px)', height: 150, border: '3px solid rgba(255,255,255,.9)', borderRadius: 16, boxShadow: '0 0 0 9999px rgba(0,0,0,.45)' }
const closeBtn: React.CSSProperties = { position: 'absolute', top: 'calc(env(safe-area-inset-top,0px) + 14px)', right: 16, width: 44, height: 44, borderRadius: 999, border: '2px solid rgba(255,255,255,.7)', background: 'rgba(0,0,0,.4)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }
