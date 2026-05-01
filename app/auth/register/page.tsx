'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2, CheckCircle2, ArrowLeft, ChevronDown } from 'lucide-react'

interface Country { id: string; name: string; code: string; continent_id: string }
interface Continent { id: string; name: string; code: string }

export default function RegisterPage() {
  const router = useRouter()
  const [continents, setContinents] = useState<Continent[]>([])
  const [countries, setCountries] = useState<Country[]>([])
  const [filteredCountries, setFilteredCountries] = useState<Country[]>([])
  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirm: '', country_id: '', country_code: '', country_name: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingCountries, setLoadingCountries] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [countrySearch, setCountrySearch] = useState('')
  const [showCountryDrop, setShowCountryDrop] = useState(false)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: c } = await supabase.from('countries').select('*').order('name')
      setCountries(c || [])
      setFilteredCountries(c || [])
      setLoadingCountries(false)
    }
    load()
  }, [])

  const searchCountry = (q: string) => {
    setCountrySearch(q)
    setFilteredCountries(countries.filter(c => c.name.toLowerCase().includes(q.toLowerCase())))
    setShowCountryDrop(true)
  }

  const selectCountry = (c: Country) => {
    setForm(p => ({ ...p, country_id: c.id, country_code: c.code, country_name: c.name }))
    setCountrySearch(c.name)
    setShowCountryDrop(false)
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  const rules = [
    { label: 'At least 8 characters', ok: form.password.length >= 8 },
    { label: 'Contains a number',     ok: /\d/.test(form.password) },
    { label: 'Passwords match',       ok: form.password === form.confirm && form.confirm.length > 0 },
  ]

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.country_id) { setError('Please select your country'); return }
    if (form.password !== form.confirm) { setError('Passwords do not match'); return }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true); setError('')

    const supabase = createClient()
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.full_name,
          country_id: form.country_id,
          country_code: form.country_code,
          country_name: form.country_name,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      }
    })

    if (signUpError) { setError(signUpError.message); setLoading(false); return }

    // Update profile with country info
    if (data.user) {
      await supabase.from('profiles').update({
        country_id: form.country_id,
      }).eq('id', data.user.id)
    }

    setLoading(false)
    setSuccess(true)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '13px 16px', borderRadius: 12, fontSize: 15,
    fontFamily: 'var(--font-dm-sans)', color: '#0d1117', outline: 'none',
    border: '1.5px solid #e2ddd8', background: '#faf7f2',
    transition: 'border-color 0.2s, box-shadow 0.2s', boxSizing: 'border-box',
  }
  const focus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = '#c9973a'
    e.target.style.boxShadow = '0 0 0 3px rgba(201,151,58,0.12)'
  }
  const blur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = '#e2ddd8'
    e.target.style.boxShadow = 'none'
  }

  // KYC type indicator
  const isNigeria = form.country_code === 'NG'
  const kycLabel = !form.country_id ? null : isNigeria
    ? { text: 'Quick NIN + selfie verification', color: '#166534', bg: '#f0fdf4', dot: '#22c55e' }
    : { text: 'Full KYC — ID + selfie + address', color: '#92400e', bg: '#fdf6e8', dot: '#f59e0b' }

  if (success) return (
    <div style={{ minHeight: '100vh', background: '#faf7f2', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#16a34a,#22c55e)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <CheckCircle2 size={36} style={{ color: '#ffffff' }} />
        </div>
        <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '2rem', fontWeight: 700, marginBottom: 12 }}>Check your email</h2>
        <p style={{ color: '#6b6560', fontSize: 15, fontFamily: 'var(--font-dm-sans)', lineHeight: 1.8, marginBottom: 8 }}>
          We sent a link to <strong style={{ color: '#0d1117' }}>{form.email}</strong>
        </p>
        <p style={{ color: '#6b6560', fontSize: 14, fontFamily: 'var(--font-dm-sans)', lineHeight: 1.7, marginBottom: 32 }}>
          After confirming your email you will be asked to verify your identity
          {isNigeria ? ' with your NIN and a selfie.' : ' with a full KYC process.'}
        </p>
        <Link href="/auth/login">
          <button style={{ padding: '13px 32px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#0f2044,#1a3260)', color: '#ffffff', fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-dm-sans)', cursor: 'pointer' }}>
            Go to sign in
          </button>
        </Link>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between" style={{ width: '44%', background: 'linear-gradient(150deg,#0a1628 0%,#0f2044 55%,#1a3260 100%)', padding: 48, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <div style={{ position: 'absolute', bottom: -80, right: -80, width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,151,58,0.1), transparent)', pointerEvents: 'none' }} />

        <Link href="/" style={{ textDecoration: 'none', position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
          <ArrowLeft size={15} style={{ color: 'rgba(255,255,255,0.4)' }} />
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontFamily: 'var(--font-dm-sans)' }}>Back to home</span>
        </Link>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '2.8rem', fontWeight: 700, color: '#ffffff', lineHeight: 1.2, marginBottom: 20 }}>
            Join<br /><span style={{ color: '#c9973a' }}>MyTownship</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 15, lineHeight: 1.8, fontFamily: 'var(--font-dm-sans)', marginBottom: 36, maxWidth: 300 }}>
            Your country determines your verification method. Nigerian users verify in under 2 minutes. Everyone else goes through full KYC.
          </p>

          {/* KYC types explained */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ padding: '16px 18px', borderRadius: 14, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
              <div style={{ display: 'flex', items: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 18 }}>🇳🇬</span>
                <p style={{ color: '#4ade80', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-dm-sans)' }}>Nigerian users</p>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontFamily: 'var(--font-dm-sans)', lineHeight: 1.6 }}>
                NIN lookup + live selfie. Verified instantly. Takes under 2 minutes.
              </p>
            </div>
            <div style={{ padding: '16px 18px', borderRadius: 14, background: 'rgba(201,151,58,0.1)', border: '1px solid rgba(201,151,58,0.2)' }}>
              <div style={{ display: 'flex', items: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 18 }}>🌍</span>
                <p style={{ color: '#fcd34d', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-dm-sans)' }}>International users</p>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontFamily: 'var(--font-dm-sans)', lineHeight: 1.6 }}>
                Government ID + selfie + proof of address. Reviewed in 24–48 hrs.
              </p>
            </div>
          </div>
        </div>

        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12, fontFamily: 'var(--font-dm-sans)', position: 'relative', zIndex: 1 }}>
          © {new Date().getFullYear()} MyTownship
        </p>
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', background: '#faf7f2', overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>

          <Link href="/" className="lg:hidden" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6b6560', fontSize: 13, fontFamily: 'var(--font-dm-sans)', textDecoration: 'none', marginBottom: 32 }}>
            <ArrowLeft size={14} /> Back to home
          </Link>

          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '2rem', fontWeight: 700, marginBottom: 8 }}>Create account</h2>
            <p style={{ color: '#6b6560', fontSize: 14, fontFamily: 'var(--font-dm-sans)' }}>
              Already have one?{' '}
              <Link href="/auth/login" style={{ color: '#c9973a', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
            </p>
          </div>

          {error && (
            <div style={{ padding: '12px 16px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 13, fontFamily: 'var(--font-dm-sans)', marginBottom: 20 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Full name */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 7, fontFamily: 'var(--font-dm-sans)', color: '#0d1117' }}>Full name</label>
              <input placeholder="John Doe" value={form.full_name} onChange={set('full_name')} required style={inputStyle} onFocus={focus} onBlur={blur} />
            </div>

            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 7, fontFamily: 'var(--font-dm-sans)', color: '#0d1117' }}>Email address</label>
              <input type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required style={inputStyle} onFocus={focus} onBlur={blur} />
            </div>

            {/* Country selector */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 7, fontFamily: 'var(--font-dm-sans)', color: '#0d1117' }}>
                Country <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  placeholder={loadingCountries ? 'Loading countries...' : 'Search your country...'}
                  value={countrySearch}
                  onChange={e => searchCountry(e.target.value)}
                  onFocus={e => { focus(e); setShowCountryDrop(true) }}
                  onBlur={() => setTimeout(() => setShowCountryDrop(false), 180)}
                  required
                  readOnly={loadingCountries}
                  style={{ ...inputStyle, paddingRight: 40 }}
                />
                <ChevronDown size={16} style={{ position: 'absolute', right: 14, top: '50%', transform: `translateY(-50%) rotate(${showCountryDrop ? 180 : 0}deg)`, color: '#6b6560', pointerEvents: 'none', transition: 'transform 0.2s' }} />

                {showCountryDrop && filteredCountries.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: '#ffffff', borderRadius: 12, border: '1.5px solid #e2ddd8', boxShadow: '0 16px 48px rgba(15,32,68,0.14)', maxHeight: 220, overflowY: 'auto', marginTop: 4 }}>
                    {filteredCountries.map(c => (
                      <button key={c.id} type="button" onMouseDown={() => selectCountry(c)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '11px 16px', background: form.country_id === c.id ? '#fdf6e8' : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s' }}
                        onMouseEnter={e => { if (form.country_id !== c.id) (e.currentTarget as HTMLElement).style.background = '#f4f0eb' }}
                        onMouseLeave={e => { if (form.country_id !== c.id) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                      >
                        <span style={{ fontSize: 14, fontFamily: 'var(--font-dm-sans)', color: '#0d1117', fontWeight: form.country_id === c.id ? 600 : 400 }}>{c.name}</span>
                        {form.country_id === c.id && <CheckCircle2 size={14} style={{ color: '#c9973a' }} />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* KYC type indicator — appears once country is selected */}
              {kycLabel && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 8, padding: '8px 12px', borderRadius: 8, background: kycLabel.bg }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: kycLabel.dot, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: kycLabel.color, fontFamily: 'var(--font-dm-sans)', fontWeight: 500 }}>
                    {isNigeria ? '🇳🇬' : '🌍'} {kycLabel.text}
                  </span>
                </div>
              )}
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 7, fontFamily: 'var(--font-dm-sans)', color: '#0d1117' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPw ? 'text' : 'password'} placeholder="Min 8 characters" value={form.password} onChange={set('password')} required style={{ ...inputStyle, paddingRight: 48 }} onFocus={focus} onBlur={blur} />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: '#6b6560', display: 'flex' }}>
                  {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 7, fontFamily: 'var(--font-dm-sans)', color: '#0d1117' }}>Confirm password</label>
              <input type="password" placeholder="••••••••" value={form.confirm} onChange={set('confirm')} required style={inputStyle} onFocus={focus} onBlur={blur} />
            </div>

            {/* Password strength */}
            {form.password.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {rules.map(({ label, ok }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: ok ? '#16a34a' : '#e2ddd8', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s', flexShrink: 0 }}>
                      {ok && <CheckCircle2 size={10} style={{ color: '#ffffff' }} />}
                    </div>
                    <span style={{ fontSize: 12, color: ok ? '#16a34a' : '#6b6560', fontFamily: 'var(--font-dm-sans)' }}>{label}</span>
                  </div>
                ))}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: 14, borderRadius: 12, border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              background: loading ? '#c9b99e' : 'linear-gradient(135deg,#0f2044,#1a3260)',
              color: '#ffffff', fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-dm-sans)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: loading ? 'none' : '0 4px 20px rgba(15,32,68,0.25)', marginTop: 4,
            }}>
              {loading && <Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} />}
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p style={{ color: '#a09890', fontSize: 12, fontFamily: 'var(--font-dm-sans)', textAlign: 'center', marginTop: 20, lineHeight: 1.6 }}>
            By creating an account you agree to our Terms of Service
          </p>
        </div>
      </div>
    </div>
  )
}