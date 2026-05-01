'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/layout/navbar'
import type { Profile } from '@/types/database'
import { Hotel, Navigation, ShoppingBag, Users, ArrowRight, CheckCircle2, Clock, X, ChevronRight } from 'lucide-react'

const ROLES = [
  {
    value: 'hotel_manager',
    label: 'Hotel Manager',
    icon: Hotel,
    color: '#0f2044',
    bg: '#e8eaf6',
    desc: 'List and manage your hotel property on MyTownship.',
    requirements: ['Hotel name and address', 'Star rating and room count', 'Hotel operating license', 'Valid ID (passport/national ID)', 'Selfie with ID'],
    href: '/apply/hotel',
  },
  {
    value: 'hotel_reception',
    label: 'Hotel Receptionist',
    icon: Users,
    color: '#3b82f6',
    bg: '#eff6ff',
    desc: 'Manage room availability and guest check-ins for a hotel.',
    requirements: ['Employment letter from hotel', 'Hotel name you work for', 'Valid ID', 'Selfie with ID'],
    href: '/apply/reception',
  },
  {
    value: 'dispatch_rider',
    label: 'Dispatch Rider',
    icon: Navigation,
    color: '#c9973a',
    bg: '#fdf6e8',
    desc: 'Accept and deliver shipments and marketplace orders.',
    requirements: ["Vehicle type and plate number", "Driver's license", 'Guarantor name and phone', 'Valid ID', 'Selfie with ID'],
    href: '/apply/rider',
  },
  {
    value: 'merchant',
    label: 'Merchant',
    icon: ShoppingBag,
    color: '#a855f7',
    bg: '#fdf4ff',
    desc: 'List products and services on the MyTownship marketplace.',
    requirements: ['Business name and type', 'Business address', 'Business registration number (optional)', 'Valid ID', 'Selfie with ID'],
    href: '/apply/merchant',
  },
]

const statusBadge = (status: string) => {
  const map: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    pending:  { label: 'Under Review', color: '#c2410c', bg: '#fff7ed', icon: Clock },
    approved: { label: 'Approved',     color: '#166534', bg: '#f0fdf4', icon: CheckCircle2 },
    rejected: { label: 'Rejected',     color: '#dc2626', bg: '#fef2f2', icon: X },
  }
  return map[status] || map.pending
}

export default function ApplyPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(prof)
      const { data: apps } = await supabase
        .from('role_applications')
        .select('*')
        .eq('user_id', user.id)
      setApplications(apps || [])
      setLoading(false)
    }
    load()
  }, [])

  const getApp = (role: string) => applications.find(a => a.role === role)

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafaf8' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #e2ddd8', borderTopColor: '#c9973a', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ color: '#6b6560', fontFamily: 'var(--font-dm-sans)', fontSize: 14 }}>Loading...</p>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#fafaf8' }}>
      <Navbar profile={profile} />

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#0a1628,#0f2044)', padding: '48px 0 0' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 32px 40px' }}>
          <p style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c9973a', fontFamily: 'var(--font-dm-sans)', marginBottom: 10 }}>Role Applications</p>
          <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(1.8rem,3vw,2.6rem)', fontWeight: 700, color: '#ffffff', marginBottom: 12 }}>
            Apply for a Role
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-dm-sans)', fontSize: 15, lineHeight: 1.7, maxWidth: 500 }}>
            Submit an application with your KYC documents. Our team reviews within 24–48 hours. Approved roles unlock your dedicated dashboard.
          </p>
        </div>
        <svg viewBox="0 0 1440 36" fill="none" style={{ display: 'block' }}>
          <path d="M0,20 C360,40 1080,0 1440,20 L1440,36 L0,36 Z" fill="#fafaf8"/>
        </svg>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 32px' }}>

        {/* Current role badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', borderRadius: 12, background: '#ffffff', border: '1px solid #e2ddd8', marginBottom: 36, width: 'fit-content' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
          <span style={{ fontSize: 14, fontFamily: 'var(--font-dm-sans)', color: '#0d1117' }}>
            Current role: <strong style={{ textTransform: 'capitalize' }}>{profile?.role?.replace('_', ' ')}</strong>
          </span>
          {profile?.role !== 'user' && profile?.role !== 'admin' && (
            <span style={{ fontSize: 12, color: '#166534', fontFamily: 'var(--font-dm-sans)', marginLeft: 8 }}>
              · You already have an active role
            </span>
          )}
        </div>

        {/* Role cards */}
        <div style={{ display: 'grid', gap: 20 }}>
          {ROLES.map(r => {
            const Icon = r.icon
            const app = getApp(r.value)
            const badge = app ? statusBadge(app.status) : null
            const BadgeIcon = badge?.icon

            return (
              <div key={r.value} style={{ background: '#ffffff', borderRadius: 20, padding: 28, border: '1px solid #e2ddd8', display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>

                {/* Icon */}
                <div style={{ width: 52, height: 52, borderRadius: 14, background: r.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={24} style={{ color: r.color }} />
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                    <h3 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.15rem', fontWeight: 700, color: '#0d1117' }}>{r.label}</h3>
                    {badge && BadgeIcon && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, background: badge.bg, color: badge.color, fontSize: 11, fontFamily: 'var(--font-dm-sans)', fontWeight: 600 }}>
                        <BadgeIcon size={11} /> {badge.label}
                      </div>
                    )}
                  </div>
                  <p style={{ fontSize: 14, color: '#6b6560', fontFamily: 'var(--font-dm-sans)', lineHeight: 1.7, marginBottom: 14 }}>{r.desc}</p>

                  {/* Requirements */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: app?.admin_note ? 14 : 0 }}>
                    {r.requirements.map(req => (
                      <div key={req} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 20, background: '#f4f0eb', fontSize: 11, color: '#6b6560', fontFamily: 'var(--font-dm-sans)' }}>
                        <CheckCircle2 size={9} style={{ color: '#c9973a' }} /> {req}
                      </div>
                    ))}
                  </div>

                  {/* Admin note on rejection */}
                  {app?.status === 'rejected' && app?.admin_note && (
                    <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca' }}>
                      <p style={{ fontSize: 12, color: '#dc2626', fontFamily: 'var(--font-dm-sans)' }}>
                        <strong>Rejection reason:</strong> {app.admin_note}
                      </p>
                    </div>
                  )}
                </div>

                {/* Action button */}
                <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                  {!app && (
                    <Link href={r.href} style={{ textDecoration: 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '11px 22px', borderRadius: 12, background: 'linear-gradient(135deg,#0f2044,#1a3260)', color: '#ffffff', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-dm-sans)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        Apply Now <ArrowRight size={13} />
                      </div>
                    </Link>
                  )}
                  {app?.status === 'pending' && (
                    <div style={{ padding: '11px 20px', borderRadius: 12, background: '#fff7ed', color: '#c2410c', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-dm-sans)', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                      <Clock size={13} /> Under Review
                    </div>
                  )}
                  {app?.status === 'approved' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                      <div style={{ padding: '11px 20px', borderRadius: 12, background: '#f0fdf4', color: '#166534', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-dm-sans)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <CheckCircle2 size={13} /> Approved
                      </div>
                      <Link href={r.value === 'hotel_manager' || r.value === 'hotel_reception' ? '/dashboard/hotel' : r.value === 'dispatch_rider' ? '/dashboard/rider' : '/dashboard/merchant'} style={{ textDecoration: 'none' }}>
                        <div style={{ padding: '9px 18px', borderRadius: 10, background: 'linear-gradient(135deg,#c9973a,#e4b55a)', color: '#0f2044', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-dm-sans)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                          Open Dashboard <ChevronRight size={12} />
                        </div>
                      </Link>
                    </div>
                  )}
                  {app?.status === 'rejected' && (
                    <Link href={r.href} style={{ textDecoration: 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '11px 22px', borderRadius: 12, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-dm-sans)', cursor: 'pointer' }}>
                        Resubmit Application <ArrowRight size={13} />
                      </div>
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Back to dashboard */}
        <div style={{ marginTop: 32, textAlign: 'center' }}>
          <Link href="/dashboard/bookings" style={{ color: '#6b6560', fontSize: 13, fontFamily: 'var(--font-dm-sans)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            ← Back to my dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}