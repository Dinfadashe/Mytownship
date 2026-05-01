'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/layout/navbar'
import type { Profile } from '@/types/database'
import {
  Hotel, Package, ShoppingBag, Calendar, LayoutDashboard,
  ArrowRight, Navigation, Clock, CheckCircle2, X,
  Plus, ChevronRight, Star, MapPin, Settings, Users
} from 'lucide-react'

const ROLE_TABS: Record<string, { label: string; href: string; icon: any; color: string; bg: string }> = {
  hotel_manager:   { label: 'Hotel Dashboard',    href: '/dashboard/hotel',    icon: Hotel,        color: '#0f2044', bg: '#e8eaf6' },
  hotel_reception: { label: 'Hotel Reception',    href: '/dashboard/hotel',    icon: Users,        color: '#3b82f6', bg: '#eff6ff' },
  dispatch_rider:  { label: 'Rider Dashboard',    href: '/dashboard/rider',    icon: Navigation,   color: '#c9973a', bg: '#fdf6e8' },
  merchant:        { label: 'Merchant Dashboard', href: '/dashboard/merchant', icon: ShoppingBag,  color: '#a855f7', bg: '#fdf4ff' },
  admin:           { label: 'Admin Panel',        href: '/dashboard/admin',    icon: Settings,     color: '#dc2626', bg: '#fef2f2' },
}

const bookingStatusColor: Record<string, { color: string; bg: string }> = {
  pending:    { color: '#c2410c', bg: '#fff7ed' },
  confirmed:  { color: '#1d4ed8', bg: '#eff6ff' },
  checked_in: { color: '#166534', bg: '#f0fdf4' },
  completed:  { color: '#6b6560', bg: '#f4f0eb' },
  cancelled:  { color: '#dc2626', bg: '#fef2f2' },
}

export default function UserDashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [bookings, setBookings] = useState<any[]>([])
  const [shipments, setShipments] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [applications, setApplications] = useState<any[]>([])
  const [tab, setTab] = useState<'overview'|'bookings'|'shipments'|'orders'>('overview')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(prof)
      const [{ data: b }, { data: s }, { data: o }, { data: apps }] = await Promise.all([
        supabase.from('bookings').select('*, hotels(name,city_name,cover_image), rooms(room_type)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
        supabase.from('shipments').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
        supabase.from('orders').select('*, merchants(business_name)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
        supabase.from('role_applications').select('*').eq('user_id', user.id),
      ])
      setBookings(b || []); setShipments(s || []); setOrders(o || []); setApplications(apps || [])
      setLoading(false)
    }
    load()
  }, [])

  const navBtn = (t: string, active: boolean): React.CSSProperties => ({
    padding: '9px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
    background: active ? '#0f2044' : 'transparent',
    color: active ? '#ffffff' : '#6b6560',
    fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-dm-sans)', transition: 'all 0.2s'
  })

  const roleTab = profile?.role ? ROLE_TABS[profile.role] : null
  const approvedApps = applications.filter(a => a.status === 'approved')
  const pendingApps = applications.filter(a => a.status === 'pending')

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafaf8' }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #e2ddd8', borderTopColor: '#c9973a', animation: 'spin 1s linear infinite' }} />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#fafaf8' }}>
      <Navbar profile={profile} />

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#0a1628,#0f2044)', padding: '40px 0 0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 32px 36px' }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, fontFamily: 'var(--font-dm-sans)', marginBottom: 6 }}>
            Welcome back
          </p>
          <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 700, color: '#ffffff', marginBottom: 4 }}>
            {profile?.full_name}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, fontFamily: 'var(--font-dm-sans)', textTransform: 'capitalize' }}>
            {profile?.role?.replace('_', ' ')} account
          </p>
        </div>
        <svg viewBox="0 0 1440 32" fill="none" style={{ display: 'block' }}>
          <path d="M0,16 C360,36 1080,0 1440,16 L1440,32 L0,32 Z" fill="#fafaf8"/>
        </svg>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 32px' }}>

        {/* Role dashboard tab — shown if user has an active role */}
        {roleTab && (
          <div style={{ marginBottom: 28 }}>
            <Link href={roleTab.href} style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderRadius: 16, background: 'linear-gradient(135deg,#0f2044,#1a3260)', border: `1px solid ${roleTab.color}30`, cursor: 'pointer', transition: 'transform 0.2s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: roleTab.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <roleTab.icon size={22} style={{ color: roleTab.color }} />
                  </div>
                  <div>
                    <p style={{ color: '#ffffff', fontFamily: 'var(--font-playfair)', fontWeight: 700, fontSize: '1.05rem', marginBottom: 2 }}>{roleTab.label}</p>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontFamily: 'var(--font-dm-sans)' }}>Tap to open your role dashboard</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#c9973a', fontFamily: 'var(--font-dm-sans)', fontSize: 13, fontWeight: 600 }}>
                  Open <ChevronRight size={16} />
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Pending applications notice */}
        {pendingApps.length > 0 && (
          <div style={{ padding: '14px 20px', borderRadius: 12, background: '#fff7ed', border: '1px solid rgba(201,111,58,0.25)', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={15} style={{ color: '#c2410c' }} />
              <p style={{ fontSize: 13, color: '#92400e', fontFamily: 'var(--font-dm-sans)', fontWeight: 600 }}>
                {pendingApps.length} application{pendingApps.length > 1 ? 's' : ''} under review
              </p>
            </div>
            <Link href="/apply" style={{ fontSize: 12, color: '#c2410c', fontFamily: 'var(--font-dm-sans)', fontWeight: 600, textDecoration: 'none' }}>
              View status →
            </Link>
          </div>
        )}

        {/* Quick actions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 32 }}>
          {[
            { icon: Hotel,       label: 'Book Hotel',    href: '/hotels',               color: '#0f2044', bg: '#e8eaf6' },
            { icon: Package,     label: 'Ship Package',  href: '/logistics',            color: '#c9973a', bg: '#fdf6e8' },
            { icon: ShoppingBag, label: 'Marketplace',   href: '/marketplace',          color: '#a855f7', bg: '#fdf4ff' },
            { icon: Users,       label: 'Apply for Role',href: '/apply',                color: '#22c55e', bg: '#f0fdf4' },
          ].map(({ icon: Icon, label, href, color, bg }) => (
            <Link key={label} href={href} style={{ textDecoration: 'none' }}>
              <div style={{ background: '#ffffff', borderRadius: 14, padding: '18px 16px', border: '1px solid #e2ddd8', cursor: 'pointer', textAlign: 'center', transition: 'transform 0.2s, box-shadow 0.2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(15,32,68,0.08)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                  <Icon size={19} style={{ color }} />
                </div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#0d1117', fontFamily: 'var(--font-dm-sans)' }}>{label}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, marginBottom: 32 }}>
          {[
            { label: 'Bookings',  value: bookings.length,  icon: Calendar,  color: '#3b82f6', bg: '#eff6ff' },
            { label: 'Shipments', value: shipments.length, icon: Package,   color: '#c9973a', bg: '#fdf6e8' },
            { label: 'Orders',    value: orders.length,    icon: ShoppingBag,color:'#a855f7', bg: '#fdf4ff' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} style={{ background: '#ffffff', borderRadius: 14, padding: '18px 16px', border: '1px solid #e2ddd8' }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                <Icon size={17} style={{ color }} />
              </div>
              <p style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.6rem', fontWeight: 700 }}>{value}</p>
              <p style={{ fontSize: 12, color: '#6b6560', fontFamily: 'var(--font-dm-sans)' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
          {(['overview','bookings','shipments','orders'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={navBtn(t, tab === t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {bookings.slice(0, 3).map(b => (
              <div key={b.id} style={{ background: '#ffffff', borderRadius: 14, padding: '16px 20px', border: '1px solid #e2ddd8', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: '#f4f0eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Hotel size={20} style={{ color: '#0f2044' }} />
                  </div>
                  <div>
                    <p style={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, fontSize: '0.95rem' }}>{b.hotels?.name}</p>
                    <p style={{ fontSize: 12, color: '#6b6560', fontFamily: 'var(--font-dm-sans)' }}>{b.check_in} → {b.check_out}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: bookingStatusColor[b.status]?.bg, color: bookingStatusColor[b.status]?.color, fontFamily: 'var(--font-dm-sans)', fontWeight: 600, textTransform: 'capitalize' }}>
                    {b.status.replace('_', ' ')}
                  </span>
                  <p style={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, fontSize: '0.95rem' }}>₦{b.total_amount?.toLocaleString()}</p>
                </div>
              </div>
            ))}
            {bookings.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', background: '#ffffff', borderRadius: 16, border: '2px dashed #e2ddd8' }}>
                <Hotel size={28} style={{ color: '#c9b99e', margin: '0 auto 10px' }} />
                <p style={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, marginBottom: 6 }}>No bookings yet</p>
                <Link href="/hotels" style={{ fontSize: 13, color: '#c9973a', fontFamily: 'var(--font-dm-sans)', textDecoration: 'none', fontWeight: 600 }}>Browse hotels →</Link>
              </div>
            )}
          </div>
        )}

        {/* Bookings */}
        {tab === 'bookings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {bookings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 48, background: '#ffffff', borderRadius: 16, border: '2px dashed #e2ddd8' }}>
                <p style={{ fontFamily: 'var(--font-playfair)', fontWeight: 700 }}>No bookings yet</p>
                <Link href="/hotels" style={{ fontSize: 13, color: '#c9973a', fontFamily: 'var(--font-dm-sans)', textDecoration: 'none' }}>Browse hotels →</Link>
              </div>
            ) : bookings.map(b => (
              <div key={b.id} style={{ background: '#ffffff', borderRadius: 14, padding: '16px 20px', border: '1px solid #e2ddd8', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <p style={{ fontFamily: 'var(--font-playfair)', fontWeight: 700 }}>{b.hotels?.name}</p>
                  <p style={{ fontSize: 12, color: '#6b6560', fontFamily: 'var(--font-dm-sans)', marginTop: 2 }}>
                    {b.rooms?.room_type} · {b.check_in} → {b.check_out} · {b.guests} guest{b.guests !== 1 ? 's' : ''}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: bookingStatusColor[b.status]?.bg || '#f4f0eb', color: bookingStatusColor[b.status]?.color || '#6b6560', fontFamily: 'var(--font-dm-sans)', fontWeight: 600, textTransform: 'capitalize' }}>
                    {b.status.replace('_', ' ')}
                  </span>
                  <p style={{ fontFamily: 'var(--font-playfair)', fontWeight: 700 }}>₦{b.total_amount?.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Shipments */}
        {tab === 'shipments' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
              <Link href="/logistics" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 10, background: '#0f2044', color: '#ffffff', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-dm-sans)', textDecoration: 'none' }}>
                <Plus size={14} /> New Shipment
              </Link>
            </div>
            {shipments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 48, background: '#ffffff', borderRadius: 16, border: '2px dashed #e2ddd8' }}>
                <p style={{ fontFamily: 'var(--font-playfair)', fontWeight: 700 }}>No shipments yet</p>
              </div>
            ) : shipments.map(s => (
              <div key={s.id} style={{ background: '#ffffff', borderRadius: 14, padding: '16px 20px', border: '1px solid #e2ddd8', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <p style={{ fontFamily: 'var(--font-dm-sans)', fontWeight: 700, fontSize: 13 }}>{s.tracking_code}</p>
                  <p style={{ fontSize: 12, color: '#6b6560', fontFamily: 'var(--font-dm-sans)', marginTop: 2 }}>{s.origin_address} → {s.dest_address}</p>
                </div>
                <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: '#f4f0eb', color: '#6b6560', fontFamily: 'var(--font-dm-sans)', fontWeight: 600, textTransform: 'capitalize' }}>
                  {s.status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Orders */}
        {tab === 'orders' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 48, background: '#ffffff', borderRadius: 16, border: '2px dashed #e2ddd8' }}>
                <p style={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, marginBottom: 6 }}>No orders yet</p>
                <Link href="/marketplace" style={{ fontSize: 13, color: '#c9973a', fontFamily: 'var(--font-dm-sans)', textDecoration: 'none', fontWeight: 600 }}>Shop now →</Link>
              </div>
            ) : orders.map(o => (
              <div key={o.id} style={{ background: '#ffffff', borderRadius: 14, padding: '16px 20px', border: '1px solid #e2ddd8', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <p style={{ fontFamily: 'var(--font-dm-sans)', fontWeight: 700, fontSize: 13 }}>{o.order_number}</p>
                  <p style={{ fontSize: 12, color: '#6b6560', fontFamily: 'var(--font-dm-sans)', marginTop: 2 }}>{o.merchants?.business_name}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: '#f4f0eb', color: '#6b6560', fontFamily: 'var(--font-dm-sans)', fontWeight: 600, textTransform: 'capitalize' }}>
                    {o.status.replace('_', ' ')}
                  </span>
                  <p style={{ fontFamily: 'var(--font-playfair)', fontWeight: 700 }}>₦{o.total_amount?.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}