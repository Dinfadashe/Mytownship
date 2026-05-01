'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/layout/navbar'
import {
  CheckCircle2, Camera, Loader2, AlertCircle, Shield,
  Globe, ArrowRight, RotateCcw, Eye, X, Clock
} from 'lucide-react'

type Step = 'loading' | 'nin_enter' | 'nin_verified' | 'selfie' | 'selfie_done' | 'full_kyc' | 'pending' | 'done'

export default function VerifyPage() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [profile, setProfile] = useState<any>(null)
  const [isNigerian, setIsNigerian] = useState(false)
  const [step, setStep] = useState<Step>('loading')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [cameraActive, setCameraActive] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [capturedSelfie, setCapturedSelfie] = useState<string | null>(null)
  const [nin, setNin] = useState('')
  const [ninResult, setNinResult] = useState<any>(null)
  const [fullForm, setFullForm] = useState({ full_name: '', date_of_birth: '', nationality: '', country: '', address: '', city: '', id_type: '', id_number: '' })
  const [idFront, setIdFront] = useState<string | null>(null)
  const [idBack, setIdBack] = useState<string | null>(null)
  const [proofAddr, setProofAddr] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const { data: prof } = await supabase.from('profiles').select('*, countries(code,name)').eq('id', user.id).single()
      setProfile(prof)

      // Already verified
      if (prof?.kyc_status === 'verified') { router.push('/dashboard/bookings'); return }

      // Already submitted — waiting
      if (prof?.kyc_status === 'pending' || prof?.kyc_status === 'manual_review') {
        setStep('pending'); return
      }

      // Determine KYC type from country
      const countryCode = (prof as any)?.countries?.code || ''
      const ng = countryCode === 'NG'
      setIsNigerian(ng)

      // Pre-fill full name
      setFullForm(p => ({ ...p, full_name: prof?.full_name || '', country: (prof as any)?.countries?.name || '' }))

      setStep(ng ? 'nin_enter' : 'full_kyc')
    }
    load()
    return () => stopCamera()
  }, [])

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null; setCameraActive(false)
  }

  const startCamera = async () => {
    try {
      setError('')
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 }, audio: false })
      streamRef.current = stream
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play() }
      setCameraActive(true)
    } catch { setError('Camera access denied. Please allow camera access in your browser settings.') }
  }

  const captureSelfie = () => {
    if (!videoRef.current || !canvasRef.current) return
    const canvas = canvasRef.current
    const video = videoRef.current
    canvas.width = video.videoWidth; canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0)
    setCapturedSelfie(canvas.toDataURL('image/jpeg', 0.8))
    stopCamera()
    setStep('selfie_done')
  }

  const startCountdown = () => {
    setCountdown(3)
    const iv = setInterval(() => setCountdown(prev => { if (prev <= 1) { clearInterval(iv); captureSelfie(); return 0 } return prev - 1 }), 1000)
  }

  const fileToBase64 = (file: File): Promise<string> => new Promise(res => {
    const r = new FileReader(); r.onload = () => res(r.result as string); r.readAsDataURL(file)
  })

  const verifyNin = async () => {
    if (nin.replace(/\D/g,'').length !== 11) { setError('Enter your 11-digit NIN'); return }
    setLoading(true); setError('')
    const res = await fetch('/api/kyc/verify-nin', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nin: nin.replace(/\D/g,''), user_id: profile?.id }),
    })
    const data = await res.json()
    setLoading(false)
    if (!data.verified) { setError(data.error || 'NIN not found. Please check your number.'); return }
    setNinResult(data); setStep('nin_verified')
  }

  const goToSelfie = () => { setStep('selfie'); setTimeout(() => startCamera(), 150) }

  const submitSelfie = async () => {
    if (!capturedSelfie) return
    setLoading(true); setError('')
    const res = await fetch('/api/kyc/verify-selfie', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: profile?.id, selfie_base64: capturedSelfie }),
    })
    const data = await res.json()
    setLoading(false)
    if (data.error) { setError(data.error); return }
    setStep('done')
  }

  const submitFullKyc = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!capturedSelfie) { setError('Please take a live selfie'); return }
    if (!idFront) { setError('Please upload your ID front'); return }
    setLoading(true); setError('')
    const res = await fetch('/api/kyc/submit-full', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: profile?.id, ...fullForm, selfie_base64: capturedSelfie, id_front_base64: idFront, id_back_base64: idBack, proof_base64: proofAddr }),
    })
    const data = await res.json()
    setLoading(false)
    if (data.error) { setError(data.error); return }
    setStep('pending')
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '12px 14px', borderRadius: 10,
    border: '1.5px solid #e2ddd8', background: '#faf7f2',
    fontSize: 14, fontFamily: 'var(--font-dm-sans)', color: '#0d1117',
    outline: 'none', boxSizing: 'border-box',
  }
  const fo = (e: any) => { e.target.style.borderColor = isNigerian ? '#0f2044' : '#c9973a' }
  const bl = (e: any) => { e.target.style.borderColor = '#e2ddd8' }

  const accent = isNigerian ? '#0f2044' : '#c9973a'
  const accentGrad = isNigerian ? 'linear-gradient(135deg,#0f2044,#1a3260)' : 'linear-gradient(135deg,#c9973a,#e4b55a)'
  const accentShadow = isNigerian ? '0 4px 20px rgba(15,32,68,0.25)' : '0 4px 20px rgba(201,151,58,0.3)'

  return (
    <div style={{ minHeight: '100vh', background: '#fafaf8' }}>
      <Navbar profile={profile} />
      <div style={{ maxWidth: 620, margin: '0 auto', padding: '40px 24px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ width: 60, height: 60, borderRadius: 18, background: accentGrad, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
            <Shield size={28} style={{ color: isNigerian ? '#c9973a' : '#0f2044' }} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.9rem', fontWeight: 700, marginBottom: 8 }}>
            Identity Verification
          </h1>
          {step !== 'loading' && step !== 'pending' && step !== 'done' && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 14px', borderRadius: 20, background: isNigerian ? '#e8eaf6' : '#fdf6e8', marginTop: 4 }}>
              <span style={{ fontSize: 16 }}>{isNigerian ? '🇳🇬' : '🌍'}</span>
              <span style={{ fontSize: 13, color: accent, fontFamily: 'var(--font-dm-sans)', fontWeight: 600 }}>
                {isNigerian ? 'Nigerian — NIN + selfie' : 'International — Full KYC'}
              </span>
            </div>
          )}
        </div>

        {error && (
          <div style={{ padding: '12px 16px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 13, fontFamily: 'var(--font-dm-sans)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={14} /> {error}
            <button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', cursor: 'pointer', color: '#dc2626', display: 'flex' }}><X size={14} /></button>
          </div>
        )}

        {/* ── LOADING ── */}
        {step === 'loading' && (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#c9973a', margin: '0 auto' }} />
          </div>
        )}

        {/* ── NIN ENTRY ── */}
        {step === 'nin_enter' && (
          <div style={{ background: '#ffffff', borderRadius: 20, padding: 32, border: '1px solid #e2ddd8', boxShadow: '0 4px 24px rgba(15,32,68,0.06)' }}>
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.4rem', fontWeight: 700, marginBottom: 6 }}>Enter your NIN</h2>
            <p style={{ fontSize: 13, color: '#6b6560', fontFamily: 'var(--font-dm-sans)', marginBottom: 24 }}>Your 11-digit National Identification Number</p>

            <input
              value={nin} onChange={e => setNin(e.target.value.replace(/\D/g,'').slice(0,11))}
              placeholder="12345678901" maxLength={11}
              style={{ ...inp, fontSize: 24, letterSpacing: '0.18em', fontFamily: 'var(--font-playfair)', fontWeight: 700, textAlign: 'center', marginBottom: 6 }}
              onFocus={fo} onBlur={bl}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <p style={{ fontSize: 11, color: '#a09890', fontFamily: 'var(--font-dm-sans)' }}>{nin.length}/11 digits</p>
              <div style={{ display: 'flex', gap: 4 }}>
                {Array.from({ length: 11 }).map((_, i) => (
                  <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: i < nin.length ? '#0f2044' : '#e2ddd8', transition: 'background 0.2s' }} />
                ))}
              </div>
            </div>

            <div style={{ padding: '12px 16px', borderRadius: 10, background: '#eff6ff', border: '1px solid #bfdbfe', marginBottom: 24 }}>
              <p style={{ fontSize: 12, color: '#1d4ed8', fontFamily: 'var(--font-dm-sans)', lineHeight: 1.7 }}>
                <strong>Find your NIN:</strong> Dial <strong>*346#</strong> on any Nigerian number, or check your NIMC ID card.
              </p>
            </div>

            <button onClick={verifyNin} disabled={loading || nin.length !== 11} style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: nin.length === 11 && !loading ? accentGrad : '#e2ddd8', color: nin.length === 11 && !loading ? '#ffffff' : '#a09890', fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-dm-sans)', cursor: nin.length === 11 && !loading ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: nin.length === 11 ? accentShadow : 'none' }}>
              {loading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Verifying...</> : 'Verify NIN →'}
            </button>
          </div>
        )}

        {/* ── NIN VERIFIED ── */}
        {step === 'nin_verified' && ninResult && (
          <div style={{ background: '#ffffff', borderRadius: 20, padding: 32, border: '1px solid #e2ddd8', boxShadow: '0 4px 24px rgba(15,32,68,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#f0fdf4', border: '2px solid #86efac', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <CheckCircle2 size={22} style={{ color: '#22c55e' }} />
              </div>
              <div>
                <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.3rem', fontWeight: 700 }}>NIN Verified</h2>
                <p style={{ fontSize: 13, color: '#22c55e', fontFamily: 'var(--font-dm-sans)', fontWeight: 500 }}>Details confirmed from NIMC records</p>
              </div>
            </div>

            <div style={{ padding: '16px 18px', borderRadius: 12, background: '#f4f0eb', marginBottom: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  ['Name', `${ninResult.first_name || ''} ${ninResult.last_name || ''}`.trim()],
                  ['Date of Birth', ninResult.date_of_birth || '—'],
                  ['Phone', ninResult.phone || '—'],
                  ['NIN', nin],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p style={{ fontSize: 11, color: '#a09890', fontFamily: 'var(--font-dm-sans)', marginBottom: 2 }}>{label}</p>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#0d1117', fontFamily: 'var(--font-dm-sans)' }}>{value}</p>
                  </div>
                ))}
              </div>
              {ninResult.demo && (
                <div style={{ marginTop: 12, padding: '7px 10px', background: '#fff7ed', borderRadius: 7, fontSize: 11, color: '#c2410c', fontFamily: 'var(--font-dm-sans)' }}>
                  ⚠️ Demo mode — add PREMBLY_API_KEY for real NIN verification
                </div>
              )}
            </div>

            <p style={{ fontSize: 14, color: '#0d1117', fontFamily: 'var(--font-dm-sans)', fontWeight: 500, marginBottom: 16 }}>
              Last step — take a live selfie to confirm your identity
            </p>

            <button onClick={goToSelfie} style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: accentGrad, color: isNigerian ? '#ffffff' : '#0f2044', fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-dm-sans)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: accentShadow }}>
              <Camera size={17} /> Take Selfie →
            </button>
          </div>
        )}

        {/* ── SELFIE CAMERA ── */}
        {step === 'selfie' && (
          <div style={{ background: '#ffffff', borderRadius: 20, padding: 28, border: '1px solid #e2ddd8', boxShadow: '0 4px 24px rgba(15,32,68,0.06)' }}>
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.4rem', fontWeight: 700, marginBottom: 6 }}>Live Selfie</h2>
            <p style={{ fontSize: 13, color: '#6b6560', fontFamily: 'var(--font-dm-sans)', marginBottom: 20 }}>
              Face the camera directly, remove glasses if possible, ensure good lighting.
            </p>

            <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', background: '#0d1117', marginBottom: 16, aspectRatio: '4/3' }}>
              <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', display: 'block' }} />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              {/* Face oval guide */}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <div style={{ width: '52%', aspectRatio: '3/4', border: `3px solid ${cameraActive ? 'rgba(201,151,58,0.9)' : 'rgba(255,255,255,0.3)'}`, borderRadius: '50%', boxShadow: '0 0 0 2000px rgba(0,0,0,0.4)', transition: 'border-color 0.4s' }} />
              </div>
              {countdown > 0 && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-playfair)', fontSize: '6rem', fontWeight: 800, color: '#ffffff', textShadow: '0 2px 20px rgba(0,0,0,0.8)', lineHeight: 1 }}>{countdown}</span>
                </div>
              )}
              {!cameraActive && (
                <div style={{ position: 'absolute', inset: 0, background: '#0d1117', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  <Camera size={36} style={{ color: 'rgba(255,255,255,0.3)' }} />
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-dm-sans)', fontSize: 13 }}>Initialising camera...</p>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button onClick={startCountdown} disabled={!cameraActive || countdown > 0} style={{ padding: 13, borderRadius: 11, border: 'none', background: cameraActive && countdown === 0 ? accentGrad : '#e2ddd8', color: cameraActive && countdown === 0 ? (isNigerian ? '#ffffff' : '#0f2044') : '#a09890', fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-dm-sans)', cursor: cameraActive && countdown === 0 ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Camera size={14} /> {countdown > 0 ? `Taking in ${countdown}…` : 'Capture'}
              </button>
              <button onClick={() => { stopCamera(); setStep(isNigerian ? 'nin_verified' : 'full_kyc') }} style={{ padding: 13, borderRadius: 11, border: '1.5px solid #e2ddd8', background: 'transparent', color: '#6b6560', fontSize: 14, fontFamily: 'var(--font-dm-sans)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <X size={14} /> Cancel
              </button>
            </div>
          </div>
        )}

        {/* ── SELFIE PREVIEW ── */}
        {step === 'selfie_done' && capturedSelfie && (
          <div style={{ background: '#ffffff', borderRadius: 20, padding: 28, border: '1px solid #e2ddd8', boxShadow: '0 4px 24px rgba(15,32,68,0.06)' }}>
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.4rem', fontWeight: 700, marginBottom: 6 }}>Selfie Captured</h2>
            <p style={{ fontSize: 13, color: '#6b6560', fontFamily: 'var(--font-dm-sans)', marginBottom: 18 }}>Looking good? Submit to complete.</p>
            <div style={{ borderRadius: 14, overflow: 'hidden', marginBottom: 20, border: '2px solid #e2ddd8' }}>
              <img src={capturedSelfie} alt="Selfie" style={{ width: '100%', display: 'block', transform: 'scaleX(-1)', maxHeight: 300, objectFit: 'cover' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button onClick={() => { setCapturedSelfie(null); setStep('selfie'); setTimeout(() => startCamera(), 150) }} style={{ padding: 13, borderRadius: 11, border: '1.5px solid #e2ddd8', background: 'transparent', color: '#6b6560', fontSize: 14, fontFamily: 'var(--font-dm-sans)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <RotateCcw size={14} /> Retake
              </button>
              <button onClick={submitSelfie} disabled={loading} style={{ padding: 13, borderRadius: 11, border: 'none', background: loading ? '#e2ddd8' : 'linear-gradient(135deg,#22c55e,#16a34a)', color: loading ? '#a09890' : '#ffffff', fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-dm-sans)', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: loading ? 'none' : '0 4px 20px rgba(34,197,94,0.3)' }}>
                {loading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle2 size={14} />}
                {loading ? 'Verifying…' : 'Submit & Verify'}
              </button>
            </div>
          </div>
        )}

        {/* ── FULL KYC ── */}
        {step === 'full_kyc' && (
          <div style={{ background: '#ffffff', borderRadius: 20, padding: 32, border: '1px solid #e2ddd8', boxShadow: '0 4px 24px rgba(15,32,68,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <Globe size={20} style={{ color: '#c9973a' }} />
              <div>
                <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.3rem', fontWeight: 700 }}>Full KYC Verification</h2>
                <p style={{ fontSize: 12, color: '#6b6560', fontFamily: 'var(--font-dm-sans)' }}>Reviewed within 24–48 hours</p>
              </div>
            </div>

            <form onSubmit={submitFullKyc} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { key: 'full_name',      label: 'Full Name',              placeholder: 'As on your ID', required: true },
                  { key: 'date_of_birth',  label: 'Date of Birth',          type: 'date',                 required: true },
                  { key: 'nationality',    label: 'Nationality',            placeholder: 'e.g. British',  required: true },
                  { key: 'city',           label: 'City',                   placeholder: 'London',        required: true },
                ].map(({ key, label, placeholder, type, required }) => (
                  <div key={key}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, fontFamily: 'var(--font-dm-sans)', color: '#0d1117' }}>{label}{required && <span style={{ color: '#dc2626' }}> *</span>}</label>
                    <input type={type || 'text'} required={required} placeholder={placeholder} value={(fullForm as any)[key]} onChange={e => setFullForm(p => ({ ...p, [key]: e.target.value }))} style={inp} onFocus={fo} onBlur={bl} />
                  </div>
                ))}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, fontFamily: 'var(--font-dm-sans)', color: '#0d1117' }}>Home Address <span style={{ color: '#dc2626' }}>*</span></label>
                <input required placeholder="Full address" value={fullForm.address} onChange={e => setFullForm(p => ({ ...p, address: e.target.value }))} style={inp} onFocus={fo} onBlur={bl} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, fontFamily: 'var(--font-dm-sans)', color: '#0d1117' }}>ID Type <span style={{ color: '#dc2626' }}>*</span></label>
                  <select required value={fullForm.id_type} onChange={e => setFullForm(p => ({ ...p, id_type: e.target.value }))} style={{ ...inp, cursor: 'pointer' }}>
                    <option value="">Select...</option>
                    {['Passport',"Driver's License",'National ID','Residence Permit'].map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, fontFamily: 'var(--font-dm-sans)', color: '#0d1117' }}>ID Number <span style={{ color: '#dc2626' }}>*</span></label>
                  <input required placeholder="Document number" value={fullForm.id_number} onChange={e => setFullForm(p => ({ ...p, id_number: e.target.value }))} style={inp} onFocus={fo} onBlur={bl} />
                </div>
              </div>

              {/* Document uploads */}
              {[
                { label: 'ID Front', state: idFront, setter: setIdFront, required: true },
                { label: 'ID Back', state: idBack, setter: setIdBack, required: false },
                { label: 'Proof of Address (utility bill / bank statement)', state: proofAddr, setter: setProofAddr, required: false },
              ].map(({ label, state, setter, required }) => (
                <div key={label}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, fontFamily: 'var(--font-dm-sans)', color: '#0d1117' }}>{label}{required && <span style={{ color: '#dc2626' }}> *</span>}</label>
                  {state ? (
                    <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: '2px solid #22c55e' }}>
                      <img src={state} alt={label} style={{ width: '100%', maxHeight: 120, objectFit: 'cover', display: 'block' }} />
                      <button type="button" onClick={() => setter(null)} style={{ position: 'absolute', top: 6, right: 6, width: 26, height: 26, borderRadius: '50%', background: '#dc2626', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <X size={12} style={{ color: '#ffffff' }} />
                      </button>
                    </div>
                  ) : (
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '18px', borderRadius: 10, border: '2px dashed #e2ddd8', cursor: 'pointer', background: '#faf7f2' }}>
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async e => { const f = e.target.files?.[0]; if (f) setter(await fileToBase64(f)) }} />
                      <Eye size={18} style={{ color: '#6b6560' }} />
                      <span style={{ fontSize: 13, color: '#6b6560', fontFamily: 'var(--font-dm-sans)' }}>Upload image</span>
                    </label>
                  )}
                </div>
              ))}

              {/* Selfie */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, fontFamily: 'var(--font-dm-sans)', color: '#0d1117' }}>Live Selfie <span style={{ color: '#dc2626' }}>*</span></label>
                {capturedSelfie ? (
                  <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: '2px solid #22c55e' }}>
                    <img src={capturedSelfie} alt="Selfie" style={{ width: '100%', maxHeight: 180, objectFit: 'cover', display: 'block', transform: 'scaleX(-1)' }} />
                    <button type="button" onClick={() => { setCapturedSelfie(null); setStep('selfie'); setTimeout(() => startCamera(), 150) }} style={{ position: 'absolute', top: 6, right: 6, padding: '5px 10px', borderRadius: 20, background: 'rgba(0,0,0,0.7)', border: 'none', cursor: 'pointer', color: '#ffffff', fontSize: 11, fontFamily: 'var(--font-dm-sans)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <RotateCcw size={10} /> Retake
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={goToSelfie} style={{ width: '100%', padding: '15px', borderRadius: 10, border: '2px dashed #e2ddd8', background: '#faf7f2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#6b6560', fontSize: 13, fontFamily: 'var(--font-dm-sans)' }}>
                    <Camera size={17} style={{ color: '#c9973a' }} /> Take Live Selfie
                  </button>
                )}
              </div>

              <button type="submit" disabled={loading} style={{ width: '100%', padding: 15, borderRadius: 12, border: 'none', background: loading ? '#e2ddd8' : accentGrad, color: loading ? '#a09890' : '#0f2044', fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-dm-sans)', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: loading ? 'none' : accentShadow, marginTop: 4 }}>
                {loading && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
                {loading ? 'Submitting…' : 'Submit for Review →'}
              </button>
            </form>
          </div>
        )}

        {/* ── PENDING REVIEW ── */}
        {step === 'pending' && (
          <div style={{ background: '#ffffff', borderRadius: 20, padding: 40, border: '1px solid #e2ddd8', textAlign: 'center', boxShadow: '0 4px 24px rgba(15,32,68,0.06)' }}>
            <div style={{ width: 68, height: 68, borderRadius: '50%', background: '#fdf6e8', border: '2px solid #fcd34d', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Clock size={32} style={{ color: '#c9973a' }} />
            </div>
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.7rem', fontWeight: 700, marginBottom: 12 }}>Under Review</h2>
            <p style={{ color: '#6b6560', fontFamily: 'var(--font-dm-sans)', lineHeight: 1.8, maxWidth: 360, margin: '0 auto 28px' }}>
              Your KYC documents have been submitted. Our team reviews within <strong style={{ color: '#0d1117' }}>24–48 hours</strong>. You'll be notified by email once approved.
            </p>
            <button onClick={() => router.push('/')} style={{ padding: '12px 28px', borderRadius: 12, border: 'none', background: accentGrad, color: isNigerian ? '#ffffff' : '#0f2044', fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-dm-sans)', cursor: 'pointer' }}>
              Back to Home
            </button>
          </div>
        )}

        {/* ── VERIFIED ── */}
        {step === 'done' && (
          <div style={{ background: '#ffffff', borderRadius: 20, padding: 40, border: '1px solid #e2ddd8', textAlign: 'center', boxShadow: '0 4px 24px rgba(15,32,68,0.06)' }}>
            <div style={{ width: 68, height: 68, borderRadius: '50%', background: '#f0fdf4', border: '2px solid #86efac', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <CheckCircle2 size={34} style={{ color: '#22c55e' }} />
            </div>
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.7rem', fontWeight: 700, marginBottom: 12 }}>Verified!</h2>
            <p style={{ color: '#6b6560', fontFamily: 'var(--font-dm-sans)', lineHeight: 1.8, maxWidth: 340, margin: '0 auto 28px' }}>
              Your identity has been verified. You can now access your dashboard and apply for roles.
            </p>
            <button onClick={() => router.push('/dashboard/bookings')} style={{ padding: '13px 32px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#0f2044,#1a3260)', color: '#ffffff', fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-dm-sans)', cursor: 'pointer', boxShadow: '0 4px 20px rgba(15,32,68,0.25)' }}>
              Go to Dashboard →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}