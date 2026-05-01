'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/layout/navbar'
import { KycForm } from '@/components/dashboard/kyc-form'
import { ShoppingBag, ArrowLeft } from 'lucide-react'

const MERCHANT_FIELDS = [
  { key: 'business_name',    label: 'Business Name',       placeholder: 'Kemi Stores',         required: true },
  { key: 'business_type',    label: 'Business Type',       type: 'select', required: true,
    options: ['Sole Proprietorship','Partnership','Limited Company','NGO','Cooperative','Other'] },
  { key: 'business_address', label: 'Business Address',    placeholder: '22 Commerce Street',  required: true },
  { key: 'product_category', label: 'Main Product Category', type: 'select', required: true,
    options: ['Food & Groceries','Electronics','Fashion & Clothing','Health & Beauty','Home & Furniture','Books & Stationery','Sports & Fitness','Automotive','Agriculture','Services','Other'] },
  { key: 'business_reg_no',  label: 'Business Reg. Number', placeholder: 'RC-XXXXXXXX (optional)' },
]

export default function ApplyMerchantPage() {
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
        .select('*').eq('user_id', user.id).eq('role', 'merchant').single()
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
          <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.8rem', fontWeight: 700, marginBottom: 6 }}>Merchant Application</h1>
          <p style={{ color: '#6b6560', fontFamily: 'var(--font-dm-sans)', fontSize: 14, marginBottom: 32 }}>List your products and services on the MyTownship marketplace.</p>
          <KycForm
            role="merchant"
            title="Merchant"
            subtitle="Sell on the marketplace"
            icon={<ShoppingBag size={18} style={{ color: '#a855f7' }} />}
            color="#a855f7" bg="#fdf4ff"
            specificFields={MERCHANT_FIELDS}
            userId={profile.id}
            existingApp={existingApp?.status === 'rejected' ? existingApp : undefined}
          />
        </div>
      </div>
    </div>
  )
}