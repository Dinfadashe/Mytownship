'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/layout/navbar'
import { KycForm } from '@/components/dashboard/kyc-form'
import { Hotel, ArrowLeft } from 'lucide-react'

const HOTEL_FIELDS = [
  { key: 'hotel_name',    label: 'Hotel Name',          placeholder: 'Grand Palace Hotel',      required: true },
  { key: 'hotel_address', label: 'Hotel Address',       placeholder: '15 Victoria Island',      required: true },
  { key: 'hotel_city',    label: 'Hotel City',          placeholder: 'Lagos',                   required: true },
  { key: 'hotel_country', label: 'Hotel Country',       placeholder: 'Nigeria',                 required: true },
  { key: 'hotel_stars',   label: 'Star Rating',         type: 'select', required: true,
    options: ['1 Star','2 Stars','3 Stars','4 Stars','5 Stars'] },
  { key: 'hotel_rooms',   label: 'Number of Rooms',     placeholder: '50', type: 'number',      required: true },
  { key: 'hotel_license', label: 'Hotel License Number',placeholder: 'HTL-2024-XXXXX' },
]

export default function ApplyHotelPage() {
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
        .select('*').eq('user_id', user.id).eq('role', 'hotel_manager').single()
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
          <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.8rem', fontWeight: 700, marginBottom: 6 }}>Hotel Manager Application</h1>
          <p style={{ color: '#6b6560', fontFamily: 'var(--font-dm-sans)', fontSize: 14, marginBottom: 32 }}>List your hotel and manage bookings on MyTownship.</p>
          <KycForm
            role="hotel_manager"
            title="Hotel Manager"
            subtitle="List and manage your hotel"
            icon={<Hotel size={18} style={{ color: '#0f2044' }} />}
            color="#0f2044" bg="#e8eaf6"
            specificFields={HOTEL_FIELDS}
            userId={profile.id}
            existingApp={existingApp?.status === 'rejected' ? existingApp : undefined}
          />
        </div>
      </div>
    </div>
  )
}