'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/layout/navbar'
import { GoogleMap } from '@/components/location/google-map'
import type { Profile, Hotel, Room, Booking } from '@/types/database'
import { Hotel as HotelIcon, Users, Calendar, TrendingUp, CheckCircle2, X, Clock, Wrench, Eye } from 'lucide-react'
import { toast } from 'sonner'

type RoomStatus = 'available' | 'booked' | 'occupied' | 'maintenance' | 'blocked'

const statusConfig: Record<RoomStatus, { label: string; bg: string; color: string; dot: string }> = {
  available:   { label: 'Available',   bg: '#f0fdf4', color: '#166534', dot: '#22c55e' },
  booked:      { label: 'Booked',      bg: '#eff6ff', color: '#1d4ed8', dot: '#3b82f6' },
  occupied:    { label: 'Occupied',    bg: '#fdf4ff', color: '#7e22ce', dot: '#a855f7' },
  maintenance: { label: 'Maintenance', bg: '#fff7ed', color: '#c2410c', dot: '#f97316' },
  blocked:     { label: 'Blocked',     bg: '#fef2f2', color: '#dc2626', dot: '#ef4444' },
}

export default function HotelDashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [hotel, setHotel] = useState<Hotel | null>(null)
  const [rooms, setRooms] = useState<Room[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'rooms' | 'bookings' | 'overview'>('rooms')

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (!prof || !['hotel_manager','hotel_reception','admin'].includes(prof.role)) {
        router.push('/dashboard/bookings'); return
      }
      setProfile(prof)
      const { data: h } = await supabase.from('hotels').select('*').eq('manager_id', user.id).single()
      if (h) {
        setHotel(h)
        const { data: r } = await supabase.from('rooms').select('*').eq('hotel_id', h.id).order('room_number')
        setRooms(r || [])
        const { data: b } = await supabase.from('bookings')
          .select('*, profiles(full_name,phone), rooms(room_number,room_type)')
          .eq('hotel_id', h.id).order('created_at', { ascending: false }).limit(50)
        setBookings(b || [])
      }
      setLoading(false)
    }
    load()
  }, [])

  const toggleRoomStatus = async (roomId: string, currentStatus: RoomStatus) => {
    const next: Record<RoomStatus, RoomStatus> = {
      available: 'booked', booked: 'occupied', occupied: 'available',
      maintenance: 'available', blocked: 'available'
    }
    const newStatus = next[currentStatus]
    const supabase = createClient()
    await supabase.from('rooms').update({ status: newStatus }).eq('id', roomId)
    setRooms(prev => prev.map(r => r.id === roomId ? { ...r, status: newStatus } : r))
    toast.success(`Room updated to ${newStatus}`)
  }

  const updateBookingStatus = async (bookingId: string, status: string) => {
    const supabase = createClient()
    const updates: any = { status }
    if (status === 'checked_in') updates.checked_in_at = new Date().toISOString()
    if (status === 'checked_out') updates.checked_out_at = new Date().toISOString()
    await supabase.from('bookings').update(updates).eq('id', bookingId)
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status } : b))
    toast.success(`Booking ${status.replace('_', ' ')}`)
  }

  const stats = {
    available: rooms.filter(r => r.status === 'available').length,
    booked: rooms.filter(r => r.status === 'booked').length,
    occupied: rooms.filter(r => r.status === 'occupied').length,
    todayCheckIn: bookings.filter(b => b.check_in === new Date().toISOString().split('T')[0] && b.status === 'confirmed').length,
  }

  const navStyle = (active: boolean): React.CSSProperties => ({
    padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
    background: active ? '#0f2044' : 'transparent',
    color: active ? '#ffffff' : '#6b6560',
    fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-dm-sans)',
    transition: 'all 0.2s'
  })

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafaf8' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', border: '3px solid #e2ddd8', borderTopColor: '#c9973a', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: '#6b6560', fontFamily: 'var(--font-dm-sans)' }}>Loading hotel dashboard...</p>
      </div>
    </div>
  )

  if (!hotel) return (
    <div style={{ minHeight: '100vh', background: '#fafaf8' }}>
      <Navbar profile={profile} />
      <div style={{ container: 'mx-auto', maxWidth: 600, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, borderRadius: 20, background: '#f4f0eb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <HotelIcon size={36} style={{ color: '#c9b99e' }} />
        </div>
        <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.8rem', fontWeight: 700, marginBottom: 12 }}>No hotel linked</h2>
        <p style={{ color: '#6b6560', fontFamily: 'var(--font-dm-sans)', lineHeight: 1.8 }}>
          Your account doesn't have a hotel linked yet. Contact admin to set up your hotel profile.
        </p>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#fafaf8' }}>
      <Navbar profile={profile} />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#0f2044,#1a3260)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <HotelIcon size={20} style={{ color: '#c9973a' }} />
              </div>
              <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.8rem', fontWeight: 700 }}>{hotel.name}</h1>
            </div>
            <p style={{ color: '#6b6560', fontSize: 14, fontFamily: 'var(--font-dm-sans)' }}>
              Hotel Reception Dashboard · {hotel.city_name}, {hotel.country_name}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['rooms', 'bookings', 'overview'].map(t => (
              <button key={t} style={navStyle(tab === t)} onClick={() => setTab(t as any)}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'Available', value: stats.available, icon: CheckCircle2, color: '#22c55e', bg: '#f0fdf4' },
            { label: 'Booked', value: stats.booked, icon: Calendar, color: '#3b82f6', bg: '#eff6ff' },
            { label: 'Occupied', value: stats.occupied, icon: Users, color: '#a855f7', bg: '#fdf4ff' },
            { label: "Today's Check-ins", value: stats.todayCheckIn, icon: TrendingUp, color: '#c9973a', bg: '#fdf6e8' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} style={{ background: '#ffffff', borderRadius: 16, padding: '20px', border: '1px solid #e2ddd8' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={18} style={{ color }} />
                </div>
                <span style={{ fontSize: 12, color: '#6b6560', fontFamily: 'var(--font-dm-sans)' }}>{label}</span>
              </div>
              <p style={{ fontFamily: 'var(--font-playfair)', fontSize: '2rem', fontWeight: 700, color: '#0d1117' }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Room Grid */}
        {tab === 'rooms' && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.4rem', fontWeight: 700, marginBottom: 20 }}>
              Room Status Grid
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 12 }}>
              {rooms.map(room => {
                const cfg = statusConfig[room.status as RoomStatus] || statusConfig.available
                return (
                  <div key={room.id} style={{ background: '#ffffff', borderRadius: 14, padding: 16, border: `2px solid ${cfg.dot}30`, cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <span style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.1rem', fontWeight: 700 }}>#{room.room_number}</span>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: cfg.dot }} />
                    </div>
                    <p style={{ fontSize: 11, color: '#6b6560', fontFamily: 'var(--font-dm-sans)', marginBottom: 10, textTransform: 'capitalize' }}>{room.room_type}</p>
                    <div style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, background: cfg.bg, color: cfg.color, fontSize: 10, fontWeight: 600, fontFamily: 'var(--font-dm-sans)', marginBottom: 12 }}>
                      {cfg.label}
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => toggleRoomStatus(room.id, room.status as RoomStatus)} style={{ flex: 1, padding: '6px', borderRadius: 8, border: '1px solid #e2ddd8', background: 'transparent', color: '#0d1117', fontSize: 10, fontFamily: 'var(--font-dm-sans)', cursor: 'pointer', fontWeight: 600 }}>
                        Toggle
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Status legend */}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 24, padding: 16, background: '#ffffff', borderRadius: 12, border: '1px solid #e2ddd8' }}>
              {Object.entries(statusConfig).map(([status, cfg]) => (
                <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.dot }} />
                  <span style={{ fontSize: 12, color: '#6b6560', fontFamily: 'var(--font-dm-sans)' }}>{cfg.label}</span>
                </div>
              ))}
              <span style={{ fontSize: 12, color: '#a09890', fontFamily: 'var(--font-dm-sans)', marginLeft: 'auto' }}>Click "Toggle" to cycle room status</span>
            </div>
          </div>
        )}

        {/* Bookings */}
        {tab === 'bookings' && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.4rem', fontWeight: 700, marginBottom: 20 }}>Bookings</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {bookings.map(b => (
                <div key={b.id} style={{ background: '#ffffff', borderRadius: 16, padding: 20, border: '1px solid #e2ddd8', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <p style={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, fontSize: '1.05rem' }}>{b.guest_name || b.profiles?.full_name || 'Guest'}</p>
                      <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 20, background: '#f0f4ff', color: '#1d4ed8', fontFamily: 'var(--font-dm-sans)', fontWeight: 600 }}>
                        Room {b.rooms?.room_number}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: '#6b6560', fontFamily: 'var(--font-dm-sans)' }}>
                      {b.check_in} → {b.check_out} · {b.nights} night{b.nights !== 1 ? 's' : ''} · {b.guests} guest{b.guests !== 1 ? 's' : ''}
                    </p>
                    <p style={{ fontSize: 12, color: '#a09890', fontFamily: 'var(--font-dm-sans)', marginTop: 2 }}>{b.profiles?.phone || ''}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div>
                      <p style={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, fontSize: '1.1rem', textAlign: 'right' }}>
                        ₦{b.total_amount?.toLocaleString()}
                      </p>
                      <p style={{ fontSize: 11, color: b.payment_status === 'paid' ? '#22c55e' : '#f97316', fontFamily: 'var(--font-dm-sans)', textAlign: 'right', fontWeight: 600 }}>
                        {b.payment_status}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {b.status === 'confirmed' && (
                        <button onClick={() => updateBookingStatus(b.id, 'checked_in')} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: '#0f2044', color: '#ffffff', fontSize: 12, fontFamily: 'var(--font-dm-sans)', cursor: 'pointer', fontWeight: 600 }}>
                          Check In
                        </button>
                      )}
                      {b.status === 'checked_in' && (
                        <button onClick={() => updateBookingStatus(b.id, 'checked_out')} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: '#c9973a', color: '#0f2044', fontSize: 12, fontFamily: 'var(--font-dm-sans)', cursor: 'pointer', fontWeight: 600 }}>
                          Check Out
                        </button>
                      )}
                      <div style={{ padding: '6px 10px', borderRadius: 8, background: '#f4f0eb', fontSize: 11, color: '#6b6560', fontFamily: 'var(--font-dm-sans)', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                        {b.status.replace('_', ' ')}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {bookings.length === 0 && (
                <div style={{ textAlign: 'center', padding: '48px', background: '#ffffff', borderRadius: 16, border: '2px dashed #e2ddd8' }}>
                  <Calendar size={32} style={{ color: '#c9b99e', margin: '0 auto 12px' }} />
                  <p style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.1rem' }}>No bookings yet</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Overview */}
        {tab === 'overview' && hotel.latitude && hotel.longitude && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.4rem', fontWeight: 700, marginBottom: 20 }}>Hotel Location</h2>
            <GoogleMap latitude={hotel.latitude} longitude={hotel.longitude} height={400} />
          </div>
        )}
      </div>
    </div>
  )
}