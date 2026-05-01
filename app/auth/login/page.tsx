'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2, Hotel, ArrowLeft, Coins } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const supabase = createClient()
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) { setError(err.message); setLoading(false); return }
    router.push('/dashboard/bookings'); router.refresh()
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '13px 16px', borderRadius: '12px', fontSize: '15px',
    fontFamily: 'var(--font-dm-sans)', color: '#0d1117', outline: 'none',
    border: '1.5px solid #e2ddd8', background: '#faf7f2',
    transition: 'border-color 0.2s, box-shadow 0.2s', boxSizing: 'border-box'
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      {/* Left panel — brand */}
      <div className="hidden lg:flex flex-col justify-between" style={{
        width: '45%', background: 'linear-gradient(150deg, #0a1628 0%, #0f2044 50%, #1a3260 100%)',
        padding: '48px', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <div style={{ position: 'absolute', bottom: '-100px', right: '-100px', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,151,58,0.12), transparent)' }} />

        <Link href="/" style={{ textDecoration: 'none', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ArrowLeft size={16} style={{ color: 'rgba(255,255,255,0.4)' }} />
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', fontFamily: 'var(--font-dm-sans)' }}>Back to home</span>
          </div>
        </Link>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '3rem', fontWeight: 700, color: '#ffffff', marginBottom: '20px', lineHeight: 1.2 }}>
            Welcome<br />back to<br /><span style={{ color: '#c9973a' }}>MyTownship</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '16px', lineHeight: 1.8, fontFamily: 'var(--font-dm-sans)', maxWidth: '320px' }}>
            Your premium platform for hotel bookings and logistics across Nigeria.
          </p>

          <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { icon: Hotel, text: 'Book hotels in any Nigerian city' },
              { icon: Coins, text: 'Zero fees with Charity Token' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(201,151,58,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={17} style={{ color: '#c9973a' }} />
                </div>
                <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: '14px', fontFamily: 'var(--font-dm-sans)' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '12px', fontFamily: 'var(--font-dm-sans)', position: 'relative', zIndex: 1 }}>
          © {new Date().getFullYear()} MyTownship · Hotel Management & Logistics
        </p>
      </div>

      {/* Right panel — form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', background: '#faf7f2' }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>

          {/* Mobile back */}
          <Link href="/" className="lg:hidden" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6b6560', fontSize: '13px', fontFamily: 'var(--font-dm-sans)', textDecoration: 'none', marginBottom: '32px' }}>
            <ArrowLeft size={14} /> Back to home
          </Link>

          <div style={{ marginBottom: '36px' }}>
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '2rem', fontWeight: 700, color: '#0d1117', marginBottom: '8px' }}>Sign in</h2>
            <p style={{ color: '#6b6560', fontSize: '15px', fontFamily: 'var(--font-dm-sans)' }}>
              Don't have an account?{' '}
              <Link href="/auth/register" style={{ color: '#c9973a', fontWeight: 600, textDecoration: 'none' }}>Create one free</Link>
            </p>
          </div>

          {error && (
            <div style={{ padding: '12px 16px', borderRadius: '10px', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '14px', fontFamily: 'var(--font-dm-sans)', marginBottom: '20px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0d1117', marginBottom: '8px', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.02em' }}>Email address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required style={inputStyle}
                onFocus={e => { (e.target as HTMLInputElement).style.borderColor = '#c9973a'; (e.target as HTMLInputElement).style.boxShadow = '0 0 0 3px rgba(201,151,58,0.12)' }}
                onBlur={e => { (e.target as HTMLInputElement).style.borderColor = '#e2ddd8'; (e.target as HTMLInputElement).style.boxShadow = 'none' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#0d1117', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.02em' }}>Password</label>
                <Link href="/auth/forgot-password" style={{ fontSize: '13px', color: '#c9973a', fontFamily: 'var(--font-dm-sans)', textDecoration: 'none', fontWeight: 500 }}>Forgot?</Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required style={{ ...inputStyle, paddingRight: '48px' }}
                  onFocus={e => { (e.target as HTMLInputElement).style.borderColor = '#c9973a'; (e.target as HTMLInputElement).style.boxShadow = '0 0 0 3px rgba(201,151,58,0.12)' }}
                  onBlur={e => { (e.target as HTMLInputElement).style.borderColor = '#e2ddd8'; (e.target as HTMLInputElement).style.boxShadow = 'none' }}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: '#6b6560', display: 'flex' }}>
                  {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '14px', borderRadius: '12px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              background: loading ? '#c9b99e' : 'linear-gradient(135deg, #0f2044, #1a3260)',
              color: '#ffffff', fontSize: '15px', fontWeight: 700, fontFamily: 'var(--font-dm-sans)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: '0 4px 20px rgba(15,32,68,0.25)', marginTop: '4px'
            }}
              onMouseOver={e => { if (!loading) { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 30px rgba(15,32,68,0.35)' } }}
              onMouseOut={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(15,32,68,0.25)' }}
            >
              {loading && <Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} />}
              {loading ? 'Signing in...' : 'Sign in to MyTownship'}
            </button>
          </form>

          <div style={{ marginTop: '28px', padding: '16px', borderRadius: '12px', background: 'rgba(201,151,58,0.08)', border: '1px solid rgba(201,151,58,0.2)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Coins size={16} style={{ color: '#c9973a', flexShrink: 0 }} />
            <p style={{ color: '#6b6560', fontSize: '13px', fontFamily: 'var(--font-dm-sans)', lineHeight: 1.5 }}>
              <strong style={{ color: '#0d1117' }}>Pay with Charity Token</strong> — zero fees on every transaction
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}