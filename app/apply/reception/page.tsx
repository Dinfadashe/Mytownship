'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/layout/navbar'
import { KycForm } from '@/components/dashboard/kyc-form'
import { Users, ArrowLeft } from 'lucide-react'

const RECEPTION_FIELDS = [
  { key: 'hotel_name',    label: 'Hotel You Work For',  placeholder: 'Grand Palace Hotel',  required: true },
  { key: 'hotel_address', label: 'Hotel Address',       placeholder: '15 Victoria Island',  required: true },
  { key: 'hotel_city',    label: 'Hotel City',          placeholder: 'Lagos',               required: true },
  { key: 'hotel_license', label: 'Employment Letter No.',placeholder: 'Optional reference' },
]

export default function ApplyReceptionPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [existingApp, setExistingApp] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(prof)
      const { data: app } = await supabase.from('role_applications')
        .select('*').eq('user_id', user.id).eq('role', 'hotel_reception').single()
      if (app && app.status === 'pending') { router.push('/apply'); return }
      setExistingApp(app)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return null

  return (
    <div style={{ minHeight: '100vh', background: '#fafaf8' }}>
      <Navbar profile={profile} />
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px' }}>
        <Link href="/apply" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#6b6560', fontSize: 13, fontFamily: 'var(--font-dm-sans)', textDecoration: 'none', marginBottom: 28 }}>
          <ArrowLeft size={14} /> Back to applications
        </Link>
        <div style={{ background: '#ffffff', borderRadius: 24, padding: 36, border: '1px solid #e2ddd8', boxShadow: '0 4px 30px rgba(15,32,68,0.06)' }}>
          <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.8rem', fontWeight: 700, marginBottom: 6 }}>Hotel Receptionist Application</h1>
          <p style={{ color: '#6b6560', fontFamily: 'var(--font-dm-sans)', fontSize: 14, marginBottom: 32 }}>Manage room availability and guest check-ins for a hotel.</p>
          <KycForm
            role="hotel_reception"
            title="Hotel Receptionist"
            subtitle="Manage rooms & check-ins"
            icon={<Users size={18} style={{ color: '#3b82f6' }} />}
            color="#3b82f6" bg="#eff6ff"
            specificFields={RECEPTION_FIELDS}
            userId={profile.id}
            existingApp={existingApp?.status === 'rejected' ? existingApp : undefined}
          />
        </div>
      </div>
    </div>
  )
}