import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

interface DetectedBarcode { rawValue: string }
interface BarcodeDetectorLike { detect: (source: CanvasImageSource) => Promise<DetectedBarcode[]> }
type BarcodeDetectorCtor = new (opts?: { formats?: string[] }) => BarcodeDetectorLike

/** Escáner de código de barras nativo (BarcodeDetector). Solo se monta donde esté soportado. */
export function BarcodeScanner({ onDetect, onClose }: { onDetect: (code: string) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const Ctor = (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector
    if (!Ctor) {
      setError('Tu navegador no soporta el escáner.')
      return
    }
    const detector = new Ctor({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] })
    let stream: MediaStream | null = null
    let raf = 0
    let stopped = false

    const cleanup = () => {
      stopped = true
      if (raf) cancelAnimationFrame(raf)
      if (stream) stream.getTracks().forEach((t) => t.stop())
    }

    ;(async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        if (stopped) { stream.getTracks().forEach((t) => t.stop()); return }
        const v = videoRef.current
        if (!v) return
        v.srcObject = stream
        await v.play()
        const tick = async () => {
          if (stopped || !videoRef.current) return
          try {
            const codes = await detector.detect(videoRef.current)
            if (codes.length > 0 && codes[0].rawValue) {
              cleanup()
              onDetect(codes[0].rawValue)
              return
            }
          } catch {
            /* frame sin código */
          }
          raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
      } catch {
        setError('No se pudo abrir la cámara. Revisa los permisos.')
      }
    })()

    return cleanup
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
