'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, Loader2, Upload, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface Field {
  key: string
  label: string
  type?: string
  placeholder?: string
  required?: boolean
  options?: string[]
}

interface KycFormProps {
  role: 'hotel_manager' | 'hotel_reception' | 'dispatch_rider' | 'merchant'
  title: string
  subtitle: string
  icon: React.ReactNode
  color: string
  bg: string
  specificFields: Field[]
  userId: string
  existingApp?: any
}

const COMMON_FIELDS: Field[] = [
  { key: 'full_name',  label: 'Full Name',    placeholder: 'As on your ID',          required: true },
  { key: 'phone',      label: 'Phone Number', placeholder: '+234 800 000 0000',       required: true },
  { key: 'address',    label: 'Home Address', placeholder: '12 Main Street, Area',    required: true },
  { key: 'city',       label: 'City',         placeholder: 'Lagos',                  required: true },
  { key: 'country',    label: 'Country',      placeholder: 'Nigeria',                required: true },
  { key: 'id_type',    label: 'ID Type',      type: 'select', required: true,
    options: ['National ID', 'Passport', "Driver's License", 'Voter's Card'] },
  { key: 'id_number',  label: 'ID Number',    placeholder: 'NIN / Passport number',  required: true },
]

export function KycForm({ role, title, subtitle, icon, color, bg, specificFields, userId, existingApp }: KycFormProps) {
  const router = useRouter()
  const allFields = [...COMMON_FIELDS, ...specificFields]
  const initial: Record<string, string> = {}
  allFields.forEach(f => { initial[f.key] = existingApp?.[f.key] || '' })

  const [form, setForm] = useState<Record<string, string>>(initial)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const set = (key: string, val: string) => setForm(p => ({ ...p, [key]: val }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()

    const payload: any = { user_id: userId, role, status: 'pending', ...form }

    let error
    if (existingApp && existingApp.status === 'rejected') {
      // Resubmit — delete old and insert fresh
      await supabase.from('role_applications').delete().eq('id', existingApp.id)
      const { error: e2 } = await supabase.from('role_applications').insert(payload)
      error = e2
    } else {
      const { error: e2 } = await supabase.from('role_applications').upsert(payload, { onConflict: 'user_id,role' })
      error = e2
    }

    setLoading(false)
    if (error) { toast.error(error.message); return }
    setSuccess(true)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px', borderRadius: 10,
    border: '1.5px solid #e2ddd8', background: '#faf7f2',
    fontSize: 14, fontFamily: 'var(--font-dm-sans)', color: '#0d1117',
    outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s'
  }

  if (success) return (
    <div style={{ textAlign: 'center', padding: '60px 24px' }}>
      <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: '2px solid #86efac' }}>
        <CheckCircle2 size={36} style={{ color: '#22c55e' }} />
      </div>
      <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.8rem', fontWeight: 700, marginBottom: 12 }}>Application Submitted!</h2>
      <p style={{ color: '#6b6560', fontFamily: 'var(--font-dm-sans)', lineHeight: 1.8, maxWidth: 400, margin: '0 auto 32px' }}>
        Your <strong style={{ color: '#0d1117' }}>{title}</strong> application is under review. We'll notify you within 24–48 hours.
      </p>
      <Link href="/apply">
        <button style={{ padding: '12px 28px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#0f2044,#1a3260)', color: '#ffffff', fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-dm-sans)', cursor: 'pointer' }}>
          View My Applications
        </button>
      </Link>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* Role badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 12, background: bg, border: `1px solid ${color}25`, marginBottom: 28 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color, fontFamily: 'var(--font-dm-sans)' }}>{title}</p>
          <p style={{ fontSize: 11, color: '#6b6560', fontFamily: 'var(--font-dm-sans)' }}>{subtitle}</p>
        </div>
      </div>

      {/* Common KYC */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6b6560', fontFamily: 'var(--font-dm-sans)', marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid #f0ede8' }}>
          Personal Information & KYC
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
          {COMMON_FIELDS.map(f => (
            <div key={f.key}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, fontFamily: 'var(--font-dm-sans)', color: '#0d1117' }}>
                {f.label} {f.required && <span style={{ color: '#dc2626' }}>*</span>}
              </label>
              {f.type === 'select' ? (
                <select value={form[f.key]} onChange={e => set(f.key, e.target.value)} required={f.required} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="">Select {f.label}...</option>
                  {f.options?.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input
                  type={f.type || 'text'}
                  value={form[f.key]}
                  onChange={e => set(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  required={f.required}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = color}
                  onBlur={e => e.target.style.borderColor = '#e2ddd8'}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Role-specific fields */}
      {specificFields.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6b6560', fontFamily: 'var(--font-dm-sans)', marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid #f0ede8' }}>
            Role-Specific Details
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
            {specificFields.map(f => (
              <div key={f.key} style={f.type === 'textarea' ? { gridColumn: '1 / -1' } : {}}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, fontFamily: 'var(--font-dm-sans)', color: '#0d1117' }}>
                  {f.label} {f.required && <span style={{ color: '#dc2626' }}>*</span>}
                </label>
                {f.type === 'select' ? (
                  <select value={form[f.key]} onChange={e => set(f.key, e.target.value)} required={f.required} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="">Select...</option>
                    {f.options?.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : f.type === 'textarea' ? (
                  <textarea
                    value={form[f.key]}
                    onChange={e => set(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    rows={3}
                    style={{ ...inputStyle, resize: 'vertical' }}
                    onFocus={e => (e.target as HTMLTextAreaElement).style.borderColor = color}
                    onBlur={e => (e.target as HTMLTextAreaElement).style.borderColor = '#e2ddd8'}
                  />
                ) : (
                  <input
                    type={f.type || 'text'}
                    value={form[f.key]}
                    onChange={e => set(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    required={f.required}
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = color}
                    onBlur={e => e.target.style.borderColor = '#e2ddd8'}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Document upload note */}
      <div style={{ padding: '16px 20px', borderRadius: 12, background: '#fdf6e8', border: '1px solid rgba(201,151,58,0.25)', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <Upload size={16} style={{ color: '#c9973a', marginTop: 2, flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#92400e', fontFamily: 'var(--font-dm-sans)', marginBottom: 4 }}>Documents required</p>
            <p style={{ fontSize: 12, color: '#78350f', fontFamily: 'var(--font-dm-sans)', lineHeight: 1.7 }}>
              After submitting this form, our team may contact you via email or phone to request scanned copies of your ID and supporting documents. Please ensure your contact details are accurate.
            </p>
          </div>
        </div>
      </div>

      {/* Submit */}
      <button type="submit" disabled={loading} style={{
        width: '100%', padding: 15, borderRadius: 12, border: 'none',
        background: loading ? '#c9b99e' : `linear-gradient(135deg, ${color}, ${color}dd)`,
        color: '#ffffff', fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-dm-sans)',
        cursor: loading ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        boxShadow: `0 4px 20px ${color}30`
      }}>
        {loading && <Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} />}
        {loading ? 'Submitting...' : existingApp?.status === 'rejected' ? 'Resubmit Application' : 'Submit Application'}
      </button>

      <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: '#a09890', fontFamily: 'var(--font-dm-sans)' }}>
        By submitting you confirm all information is accurate and consent to identity verification.
      </p>
    </form>
  )
}