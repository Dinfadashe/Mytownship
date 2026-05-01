'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/layout/navbar'
import { GoogleMap } from '@/components/location/google-map'
import type { Profile, Rider, Shipment } from '@/types/database'
import { Package, MapPin, CheckCircle2, Clock, TrendingUp, Navigation, Star } from 'lucide-react'
import { toast } from 'sonner'

type RiderStatus = 'offline' | 'available' | 'busy' | 'on_delivery'

const statusConfig: Record<RiderStatus, { label: string; color: string; bg: string; dot: string }> = {
  offline:     { label: 'Offline',     color: '#6b6560', bg: '#f4f0eb',  dot: '#9ca3af' },
  available:   { label: 'Available',   color: '#166534', bg: '#f0fdf4',  dot: '#22c55e' },
  busy:        { label: 'Busy',        color: '#c2410c', bg: '#fff7ed',  dot: '#f97316' },
  on_delivery: { label: 'On Delivery', color: '#1d4ed8', bg: '#eff6ff',  dot: '#3b82f6' },
}

export default function RiderDashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [rider, setRider] = useState<Rider | null>(null)
  const [shipments, setShipments] = useState<any[]>([])
  const [pendingShipments, setPendingShipments] = useState<any[]>([])
  const [tab, setTab] = useState<'status' | 'active' | 'available' | 'history'>('status')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(prof)
      const { data: r } = await supabase.from('riders').select('*').eq('user_id', user.id).single()
      setRider(r)
      if (r) {
        const { data: myShipments } = await supabase.from('shipments')
          .select('*, profiles(full_name,phone)')
          .eq('rider_id', r.id).order('created_at', { ascending: false })
        setShipments(myShipments || [])
        const { data: pending } = await supabase.from('shipments')
          .select('*, profiles(full_name,phone)').eq('status', 'pending').is('rider_id', null)
        setPendingShipments(pending || [])
      }
      setLoading(false)
    }
    load()
  }, [])

  const toggleStatus = async (newStatus: RiderStatus) => {
    if (!rider) return
    const supabase = createClient()
    await supabase.from('riders').update({ status: newStatus, last_seen: new Date().toISOString() }).eq('id', rider.id)
    setRider(prev => prev ? { ...prev, status: newStatus } : null)
    toast.success(`Status updated to ${statusConfig[newStatus].label}`)
  }

  const acceptShipment = async (shipmentId: string) => {
    if (!rider) return
    const supabase = createClient()
    await supabase.from('shipments').update({ rider_id: rider.id, status: 'assigned' }).eq('id', shipmentId)
    await supabase.from('shipment_events').insert({ shipment_id: shipmentId, status: 'assigned', notes: 'Rider assigned', created_by: profile?.id })
    await supabase.from('riders').update({ status: 'on_delivery' }).eq('id', rider.id)
    setRider(prev => prev ? { ...prev, status: 'on_delivery' } : null)
    setPendingShipments(prev => prev.filter(s => s.id !== shipmentId))
    toast.success('Shipment accepted!')
  }

  const updateShipmentStatus = async (shipmentId: string, status: string) => {
    const supabase = createClient()
    await supabase.from('shipments').update({ status, ...(status === 'delivered' ? { actual_delivery: new Date().toISOString() } : {}) }).eq('id', shipmentId)
    await supabase.from('shipment_events').insert({ shipment_id: shipmentId, status, created_by: profile?.id })
    if (status === 'delivered') {
      await supabase.from('riders').update({ status: 'available', total_deliveries: (rider?.total_deliveries || 0) + 1 }).eq('id', rider!.id)
      setRider(prev => prev ? { ...prev, status: 'available', total_deliveries: (prev.total_deliveries || 0) + 1 } : null)
    }
    setShipments(prev => prev.map(s => s.id === shipmentId ? { ...s, status } : s))
    toast.success(`Shipment marked as ${status}`)
  }

  const navStyle = (active: boolean): React.CSSProperties => ({
    padding: '9px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
    background: active ? '#0f2044' : 'transparent',
    color: active ? '#ffffff' : '#6b6560',
    fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-dm-sans)'
  })

  if (loading || !rider) return (
    <div style={{ minHeight: '100vh', background: '#fafaf8' }}>
      <Navbar profile={profile} />
      <div style={{ maxWidth: 500, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, borderRadius: 20, background: '#fdf6e8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <Navigation size={36} style={{ color: '#c9973a' }} />
        </div>
        <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.8rem', fontWeight: 700, marginBottom: 12 }}>
          {loading ? 'Loading...' : 'No Rider Profile'}
        </h2>
        {!loading && <p style={{ color: '#6b6560', fontFamily: 'var(--font-dm-sans)' }}>Contact admin to activate your rider account.</p>}
      </div>
    </div>
  )

  const currentStatus = rider.status as RiderStatus
  const cfg = statusConfig[currentStatus]
  const activeShipments = shipments.filter(s => !['delivered','failed','returned','cancelled'].includes(s.status))
  const completedShipments = shipments.filter(s => s.status === 'delivered')

  return (
    <div style={{ minHeight: '100vh', background: '#fafaf8' }}>
      <Navbar profile={profile} />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.8rem', fontWeight: 700, marginBottom: 4 }}>Rider Dashboard</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: cfg.dot }} />
              <span style={{ fontSize: 14, color: cfg.color, fontFamily: 'var(--font-dm-sans)', fontWeight: 600 }}>{cfg.label}</span>
              <span style={{ color: '#c9b99e', fontSize: 14 }}>·</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Star size={12} style={{ fill: '#c9973a', stroke: '#c9973a' }} />
                <span style={{ fontSize: 13, color: '#6b6560', fontFamily: 'var(--font-dm-sans)' }}>{rider.rating.toFixed(1)}</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['status','active','available','history'] as const).map(t => (
              <button key={t} style={navStyle(tab === t)} onClick={() => setTab(t)}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'Total Deliveries', value: rider.total_deliveries, icon: CheckCircle2, color: '#22c55e', bg: '#f0fdf4' },
            { label: 'Active Now', value: activeShipments.length, icon: Package, color: '#3b82f6', bg: '#eff6ff' },
            { label: 'Pending Pickups', value: pendingShipments.length, icon: Clock, color: '#f97316', bg: '#fff7ed' },
            { label: 'Rating', value: rider.rating.toFixed(1), icon: Star, color: '#c9973a', bg: '#fdf6e8' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} style={{ background: '#ffffff', borderRadius: 16, padding: 20, border: '1px solid #e2ddd8' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                <Icon size={18} style={{ color }} />
              </div>
              <p style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.8rem', fontWeight: 700 }}>{value}</p>
              <p style={{ fontSize: 12, color: '#6b6560', fontFamily: 'var(--font-dm-sans)' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Status Tab */}
        {tab === 'status' && (
          <div style={{ background: '#ffffff', borderRadius: 20, padding: 32, border: '1px solid #e2ddd8' }}>
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.3rem', fontWeight: 700, marginBottom: 24 }}>Your Status</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 12 }}>
              {(Object.entries(statusConfig) as [RiderStatus, typeof statusConfig[RiderStatus]][]).map(([status, c]) => (
                <button key={status} onClick={() => toggleStatus(status)} style={{
                  padding: 20, borderRadius: 16, border: `2px solid ${currentStatus === status ? c.dot : '#e2ddd8'}`,
                  background: currentStatus === status ? c.bg : '#ffffff',
                  cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s'
                }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: c.dot, marginBottom: 10 }} />
                  <p style={{ fontSize: 14, fontWeight: 700, color: currentStatus === status ? c.color : '#0d1117', fontFamily: 'var(--font-dm-sans)' }}>{c.label}</p>
                  {currentStatus === status && <p style={{ fontSize: 11, color: c.color, fontFamily: 'var(--font-dm-sans)', marginTop: 4 }}>Current</p>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Active shipments */}
        {tab === 'active' && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.3rem', fontWeight: 700, marginBottom: 20 }}>Active Deliveries</h2>
            {activeShipments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 48, background: '#ffffff', borderRadius: 16, border: '2px dashed #e2ddd8' }}>
                <Package size={32} style={{ color: '#c9b99e', margin: '0 auto 12px' }} />
                <p style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.1rem' }}>No active deliveries</p>
              </div>
            ) : activeShipments.map(s => (
              <div key={s.id} style={{ background: '#ffffff', borderRadius: 16, padding: 20, border: '1px solid #e2ddd8', marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontFamily: 'var(--font-dm-sans)', fontWeight: 700, fontSize: 15 }}>{s.tracking_code}</span>
                      <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 20, background: '#eff6ff', color: '#1d4ed8', fontFamily: 'var(--font-dm-sans)', fontWeight: 600, textTransform: 'capitalize' }}>{s.status.replace('_',' ')}</span>
                    </div>
                    <p style={{ fontSize: 13, color: '#6b6560', fontFamily: 'var(--font-dm-sans)' }}>{s.origin_address} → {s.dest_address}</p>
                    <p style={{ fontSize: 12, color: '#a09890', fontFamily: 'var(--font-dm-sans)', marginTop: 2 }}>{s.profiles?.full_name} · {s.profiles?.phone}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {s.status === 'assigned' && <button onClick={() => updateShipmentStatus(s.id, 'picked_up')} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#0f2044', color: '#ffffff', fontSize: 12, fontFamily: 'var(--font-dm-sans)', cursor: 'pointer', fontWeight: 600 }}>Picked Up</button>}
                    {s.status === 'picked_up' && <button onClick={() => updateShipmentStatus(s.id, 'in_transit')} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#1d4ed8', color: '#ffffff', fontSize: 12, fontFamily: 'var(--font-dm-sans)', cursor: 'pointer', fontWeight: 600 }}>In Transit</button>}
                    {s.status === 'in_transit' && <button onClick={() => updateShipmentStatus(s.id, 'out_for_delivery')} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#f97316', color: '#ffffff', fontSize: 12, fontFamily: 'var(--font-dm-sans)', cursor: 'pointer', fontWeight: 600 }}>Out for Delivery</button>}
                    {s.status === 'out_for_delivery' && <button onClick={() => updateShipmentStatus(s.id, 'delivered')} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#22c55e', color: '#ffffff', fontSize: 12, fontFamily: 'var(--font-dm-sans)', cursor: 'pointer', fontWeight: 600 }}>Mark Delivered</button>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Available pickups */}
        {tab === 'available' && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.3rem', fontWeight: 700, marginBottom: 20 }}>Available Pickups</h2>
            {pendingShipments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 48, background: '#ffffff', borderRadius: 16, border: '2px dashed #e2ddd8' }}>
                <MapPin size={32} style={{ color: '#c9b99e', margin: '0 auto 12px' }} />
                <p style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.1rem' }}>No pending pickups</p>
              </div>
            ) : pendingShipments.map(s => (
              <div key={s.id} style={{ background: '#ffffff', borderRadius: 16, padding: 20, border: '1px solid #e2ddd8', marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <p style={{ fontFamily: 'var(--font-dm-sans)', fontWeight: 700 }}>{s.description || 'Package'}</p>
                    <p style={{ fontSize: 13, color: '#6b6560', fontFamily: 'var(--font-dm-sans)', marginTop: 4 }}>{s.origin_address} → {s.dest_address}</p>
                    {s.weight_kg && <p style={{ fontSize: 12, color: '#a09890', fontFamily: 'var(--font-dm-sans)' }}>{s.weight_kg}kg · {s.fragile ? 'Fragile' : 'Standard'}</p>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {s.price && <p style={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, fontSize: '1.1rem' }}>₦{s.price.toLocaleString()}</p>}
                    <button onClick={() => acceptShipment(s.id)} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#c9973a,#e4b55a)', color: '#0f2044', fontSize: 13, fontFamily: 'var(--font-dm-sans)', cursor: 'pointer', fontWeight: 700 }}>
                      Accept
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* History */}
        {tab === 'history' && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.3rem', fontWeight: 700, marginBottom: 20 }}>Delivery History</h2>
            {completedShipments.map(s => (
              <div key={s.id} style={{ background: '#ffffff', borderRadius: 16, padding: 20, border: '1px solid #e2ddd8', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontFamily: 'var(--font-dm-sans)', fontWeight: 700 }}>{s.tracking_code}</span>
                    <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 20, background: '#f0fdf4', color: '#166534', fontFamily: 'var(--font-dm-sans)', fontWeight: 600 }}>Delivered</span>
                  </div>
                  <p style={{ fontSize: 13, color: '#6b6560', fontFamily: 'var(--font-dm-sans)' }}>{s.origin_address} → {s.dest_address}</p>
                  <p style={{ fontSize: 12, color: '#a09890', fontFamily: 'var(--font-dm-sans)', marginTop: 2 }}>{new Date(s.actual_delivery || s.updated_at).toLocaleDateString()}</p>
                </div>
                {s.price && <p style={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, color: '#22c55e' }}>+₦{s.price.toLocaleString()}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}