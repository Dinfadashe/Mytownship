'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/layout/navbar'
import type { Profile } from '@/types/database'
import { Users, Hotel, Package, ShoppingBag, CheckCircle2, X, TrendingUp, Globe, Clock, Navigation, Eye } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminDashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState({ users: 0, hotels: 0, shipments: 0, orders: 0, merchants: 0, riders: 0, pendingApps: 0 })
  const [tab, setTab] = useState<'applications'|'hotels'|'merchants'|'riders'|'users'>('applications')
  const [applications, setApplications] = useState<any[]>([])
  const [hotels, setHotels] = useState<any[]>([])
  const [merchants, setMerchants] = useState<any[]>([])
  const [riders, setRiders] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [selectedApp, setSelectedApp] = useState<any>(null)
  const [adminNote, setAdminNote] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (!prof || prof.role !== 'admin') { router.push('/dashboard/bookings'); return }
      setProfile(prof)

      const [u, h, s, o, m, r, apps] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('hotels').select('id', { count: 'exact', head: true }),
        supabase.from('shipments').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        supabase.from('merchants').select('id', { count: 'exact', head: true }),
        supabase.from('riders').select('id', { count: 'exact', head: true }),
        supabase.from('role_applications').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      ])
      setStats({ users: u.count||0, hotels: h.count||0, shipments: s.count||0, orders: o.count||0, merchants: m.count||0, riders: r.count||0, pendingApps: apps.count||0 })

      const [{ data: appsData }, { data: hotelsData }, { data: merchantsData }, { data: ridersData }, { data: usersData }] = await Promise.all([
        supabase.from('role_applications').select('*, profiles(full_name,email,phone)').order('created_at', { ascending: false }).limit(100),
        supabase.from('hotels').select('*, profiles(full_name,email)').order('created_at', { ascending: false }).limit(30),
        supabase.from('merchants').select('*, profiles(full_name,email)').order('created_at', { ascending: false }).limit(30),
        supabase.from('riders').select('*, profiles(full_name,email,phone)').order('created_at', { ascending: false }).limit(30),
        supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(50),
      ])
      setApplications(appsData||[]); setHotels(hotelsData||[]); setMerchants(merchantsData||[])
      setRiders(ridersData||[]); setUsers(usersData||[])
      setLoading(false)
    }
    load()
  }, [])

  const reviewApplication = async (id: string, status: 'approved' | 'rejected') => {
    const supabase = createClient()
    await supabase.from('role_applications').update({
      status,
      admin_note: status === 'rejected' ? adminNote : null,
      reviewed_by: profile?.id,
      reviewed_at: new Date().toISOString(),
    }).eq('id', id)
    setApplications(prev => prev.map(a => a.id === id ? { ...a, status, admin_note: adminNote } : a))
    setStats(prev => ({ ...prev, pendingApps: Math.max(0, prev.pendingApps - 1) }))
    setSelectedApp(null)
    setAdminNote('')
    toast.success(status === 'approved' ? '✅ Application approved — user role updated' : '❌ Application rejected')
  }

  const changeUserRole = async (userId: string, role: string) => {
    const supabase = createClient()
    await supabase.from('profiles').update({ role }).eq('id', userId)
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u))
    toast.success('User role updated')
  }

  const approveHotel = async (id: string, approved: boolean) => {
    const supabase = createClient()
    await supabase.from('hotels').update({ is_approved: approved }).eq('id', id)
    setHotels(prev => prev.map(h => h.id === id ? { ...h, is_approved: approved } : h))
    toast.success(approved ? 'Hotel approved' : 'Hotel suspended')
  }

  const navStyle = (active: boolean): React.CSSProperties => ({
    padding: '9px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
    background: active ? '#0f2044' : 'transparent',
    color: active ? '#ffffff' : '#6b6560', fontSize: 13, fontWeight: 600,
    fontFamily: 'var(--font-dm-sans)', position: 'relative' as const
  })

  const roleBadgeColor: Record<string, { color: string; bg: string }> = {
    hotel_manager:   { color: '#0f2044', bg: '#e8eaf6' },
    hotel_reception: { color: '#1d4ed8', bg: '#eff6ff' },
    dispatch_rider:  { color: '#c2410c', bg: '#fff7ed' },
    merchant:        { color: '#7e22ce', bg: '#fdf4ff' },
  }

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #e2ddd8', borderTopColor: '#c9973a', animation: 'spin 1s linear infinite' }} /></div>

  const pendingApps = applications.filter(a => a.status === 'pending')
  const reviewedApps = applications.filter(a => a.status !== 'pending')

  return (
    <div style={{ minHeight: '100vh', background: '#fafaf8' }}>
      <Navbar profile={profile} />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>

        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '2rem', fontWeight: 700, marginBottom: 4 }}>Admin Panel</h1>
          <p style={{ color: '#6b6560', fontFamily: 'var(--font-dm-sans)', fontSize: 14 }}>MyTownship Platform Control Centre</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 14, marginBottom: 32 }}>
          {[
            { label: 'Users',           value: stats.users,       icon: Users,     color: '#3b82f6', bg: '#eff6ff' },
            { label: 'Hotels',          value: stats.hotels,      icon: Hotel,     color: '#0f2044', bg: '#e8eaf6' },
            { label: 'Merchants',       value: stats.merchants,   icon: ShoppingBag,color:'#a855f7',bg: '#fdf4ff' },
            { label: 'Riders',          value: stats.riders,      icon: Navigation,color: '#c9973a', bg: '#fdf6e8' },
            { label: 'Shipments',       value: stats.shipments,   icon: Package,   color: '#06b6d4', bg: '#ecfeff' },
            { label: 'Pending Reviews', value: stats.pendingApps, icon: Clock,     color: '#dc2626', bg: '#fef2f2' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} style={{ background: '#ffffff', borderRadius: 14, padding: '16px', border: '1px solid #e2ddd8' }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                <Icon size={16} style={{ color }} />
              </div>
              <p style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.6rem', fontWeight: 700 }}>{value}</p>
              <p style={{ fontSize: 11, color: '#6b6560', fontFamily: 'var(--font-dm-sans)' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 28, flexWrap: 'wrap' }}>
          {(['applications','hotels','merchants','riders','users'] as const).map(t => (
            <button key={t} style={navStyle(tab === t)} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
              {t === 'applications' && pendingApps.length > 0 && (
                <span style={{ marginLeft: 6, padding: '1px 7px', borderRadius: 20, background: '#dc2626', color: '#ffffff', fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-dm-sans)' }}>
                  {pendingApps.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── APPLICATIONS ── */}
        {tab === 'applications' && (
          <div>
            {/* Review modal */}
            {selectedApp && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                <div style={{ background: '#ffffff', borderRadius: 20, padding: 32, maxWidth: 580, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <h3 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.3rem', fontWeight: 700 }}>Review Application</h3>
                    <button onClick={() => setSelectedApp(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#6b6560' }}>
                      <X size={20} />
                    </button>
                  </div>

                  {/* Applicant info */}
                  <div style={{ padding: '14px 18px', borderRadius: 12, background: '#f4f0eb', marginBottom: 20 }}>
                    <p style={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, marginBottom: 4 }}>{selectedApp.profiles?.full_name}</p>
                    <p style={{ fontSize: 12, color: '#6b6560', fontFamily: 'var(--font-dm-sans)' }}>{selectedApp.profiles?.email} · {selectedApp.phone}</p>
                  </div>

                  {/* Application details */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                    {[
                      ['Role Applied', selectedApp.role?.replace('_', ' ')],
                      ['Full Name', selectedApp.full_name],
                      ['Phone', selectedApp.phone],
                      ['Address', selectedApp.address],
                      ['City', selectedApp.city],
                      ['Country', selectedApp.country],
                      ['ID Type', selectedApp.id_type],
                      ['ID Number', selectedApp.id_number],
                      selectedApp.hotel_name ? ['Hotel Name', selectedApp.hotel_name] : null,
                      selectedApp.hotel_address ? ['Hotel Address', selectedApp.hotel_address] : null,
                      selectedApp.hotel_stars ? ['Star Rating', selectedApp.hotel_stars] : null,
                      selectedApp.hotel_rooms ? ['Rooms', selectedApp.hotel_rooms] : null,
                      selectedApp.vehicle_type ? ['Vehicle', selectedApp.vehicle_type] : null,
                      selectedApp.vehicle_plate ? ['Plate No.', selectedApp.vehicle_plate] : null,
                      selectedApp.guarantor_name ? ['Guarantor', selectedApp.guarantor_name] : null,
                      selectedApp.business_name ? ['Business', selectedApp.business_name] : null,
                      selectedApp.business_type ? ['Biz Type', selectedApp.business_type] : null,
                      selectedApp.product_category ? ['Category', selectedApp.product_category] : null,
                    ].filter(Boolean).map(([label, value]) => (
                      <div key={label} style={{ padding: '10px 12px', borderRadius: 8, background: '#faf7f2', border: '1px solid #e2ddd8' }}>
                        <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b6560', fontFamily: 'var(--font-dm-sans)', marginBottom: 3 }}>{label}</p>
                        <p style={{ fontSize: 13, color: '#0d1117', fontFamily: 'var(--font-dm-sans)', fontWeight: 500, textTransform: 'capitalize' }}>{value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Rejection note */}
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 8, fontFamily: 'var(--font-dm-sans)' }}>Rejection reason (required if rejecting)</label>
                    <textarea
                      value={adminNote}
                      onChange={e => setAdminNote(e.target.value)}
                      placeholder="e.g. Incomplete documents, invalid ID number..."
                      rows={3}
                      style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #e2ddd8', background: '#faf7f2', fontSize: 14, fontFamily: 'var(--font-dm-sans)', color: '#0d1117', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={() => reviewApplication(selectedApp.id, 'approved')} style={{ flex: 1, padding: '13px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#16a34a,#22c55e)', color: '#ffffff', fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-dm-sans)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <CheckCircle2 size={16} /> Approve
                    </button>
                    <button onClick={() => { if (!adminNote.trim()) { toast.error('Please provide a rejection reason'); return }; reviewApplication(selectedApp.id, 'rejected') }} style={{ flex: 1, padding: '13px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#dc2626,#b91c1c)', color: '#ffffff', fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-dm-sans)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <X size={16} /> Reject
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Pending */}
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.2rem', fontWeight: 700, marginBottom: 16 }}>
              Pending Reviews ({pendingApps.length})
            </h2>
            {pendingApps.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, background: '#ffffff', borderRadius: 16, border: '2px dashed #e2ddd8', marginBottom: 32 }}>
                <CheckCircle2 size={28} style={{ color: '#22c55e', margin: '0 auto 10px' }} />
                <p style={{ fontFamily: 'var(--font-playfair)', fontWeight: 700 }}>All caught up!</p>
                <p style={{ fontSize: 13, color: '#6b6560', fontFamily: 'var(--font-dm-sans)', marginTop: 4 }}>No pending applications</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
                {pendingApps.map(a => {
                  const roleColors = roleBadgeColor[a.role] || { color: '#6b6560', bg: '#f4f0eb' }
                  return (
                    <div key={a.id} style={{ background: '#ffffff', borderRadius: 16, padding: '18px 20px', border: '1px solid #e2ddd8', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <p style={{ fontFamily: 'var(--font-playfair)', fontWeight: 700 }}>{a.profiles?.full_name}</p>
                          <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 20, background: roleColors.bg, color: roleColors.color, fontFamily: 'var(--font-dm-sans)', fontWeight: 600, textTransform: 'capitalize' }}>
                            {a.role.replace('_', ' ')}
                          </span>
                          <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 20, background: '#fff7ed', color: '#c2410c', fontFamily: 'var(--font-dm-sans)', fontWeight: 600 }}>
                            Pending
                          </span>
                        </div>
                        <p style={{ fontSize: 12, color: '#6b6560', fontFamily: 'var(--font-dm-sans)' }}>
                          {a.profiles?.email} · Submitted {new Date(a.created_at).toLocaleDateString()}
                        </p>
                        {(a.hotel_name || a.business_name || a.vehicle_type) && (
                          <p style={{ fontSize: 12, color: '#a09890', fontFamily: 'var(--font-dm-sans)', marginTop: 2 }}>
                            {a.hotel_name || a.business_name || `${a.vehicle_type} · ${a.vehicle_plate}`}
                          </p>
                        )}
                      </div>
                      <button onClick={() => { setSelectedApp(a); setAdminNote('') }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#0f2044,#1a3260)', color: '#ffffff', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-dm-sans)', cursor: 'pointer' }}>
                        <Eye size={14} /> Review
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Reviewed */}
            {reviewedApps.length > 0 && (
              <>
                <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.2rem', fontWeight: 700, marginBottom: 16 }}>
                  Reviewed ({reviewedApps.length})
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {reviewedApps.map(a => (
                    <div key={a.id} style={{ background: '#ffffff', borderRadius: 14, padding: '14px 20px', border: '1px solid #e2ddd8', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, opacity: 0.8 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                          <p style={{ fontFamily: 'var(--font-dm-sans)', fontWeight: 600, fontSize: 14 }}>{a.profiles?.full_name}</p>
                          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: a.status === 'approved' ? '#f0fdf4' : '#fef2f2', color: a.status === 'approved' ? '#166534' : '#dc2626', fontFamily: 'var(--font-dm-sans)', fontWeight: 600, textTransform: 'capitalize' }}>
                            {a.status}
                          </span>
                          <span style={{ fontSize: 11, color: '#a09890', fontFamily: 'var(--font-dm-sans)', textTransform: 'capitalize' }}>
                            {a.role.replace('_', ' ')}
                          </span>
                        </div>
                        {a.admin_note && <p style={{ fontSize: 11, color: '#dc2626', fontFamily: 'var(--font-dm-sans)' }}>Note: {a.admin_note}</p>}
                      </div>
                      <p style={{ fontSize: 11, color: '#a09890', fontFamily: 'var(--font-dm-sans)' }}>
                        {a.reviewed_at ? new Date(a.reviewed_at).toLocaleDateString() : ''}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Hotels */}
        {tab === 'hotels' && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.2rem', fontWeight: 700, marginBottom: 16 }}>Hotels</h2>
            {hotels.map(h => (
              <div key={h.id} style={{ background: '#ffffff', borderRadius: 14, padding: '16px 20px', border: '1px solid #e2ddd8', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <p style={{ fontFamily: 'var(--font-playfair)', fontWeight: 700 }}>{h.name}</p>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: h.is_approved ? '#f0fdf4' : '#fff7ed', color: h.is_approved ? '#166534' : '#c2410c', fontFamily: 'var(--font-dm-sans)', fontWeight: 600 }}>
                      {h.is_approved ? 'Approved' : 'Pending'}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: '#6b6560', fontFamily: 'var(--font-dm-sans)' }}>{h.city_name}, {h.country_name} · {h.profiles?.full_name}</p>
                </div>
                {!h.is_approved
                  ? <button onClick={() => approveHotel(h.id, true)} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#22c55e', color: '#ffffff', fontSize: 12, fontFamily: 'var(--font-dm-sans)', cursor: 'pointer', fontWeight: 600 }}>Approve</button>
                  : <button onClick={() => approveHotel(h.id, false)} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#dc2626', color: '#ffffff', fontSize: 12, fontFamily: 'var(--font-dm-sans)', cursor: 'pointer', fontWeight: 600 }}>Suspend</button>
                }
              </div>
            ))}
          </div>
        )}

        {/* Merchants */}
        {tab === 'merchants' && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.2rem', fontWeight: 700, marginBottom: 16 }}>Merchants</h2>
            {merchants.map(m => (
              <div key={m.id} style={{ background: '#ffffff', borderRadius: 14, padding: '16px 20px', border: '1px solid #e2ddd8', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <p style={{ fontFamily: 'var(--font-playfair)', fontWeight: 700 }}>{m.business_name}</p>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: m.status === 'approved' ? '#f0fdf4' : '#fff7ed', color: m.status === 'approved' ? '#166534' : '#c2410c', fontFamily: 'var(--font-dm-sans)', fontWeight: 600 }}>{m.status}</span>
                  </div>
                  <p style={{ fontSize: 12, color: '#6b6560', fontFamily: 'var(--font-dm-sans)' }}>{m.profiles?.full_name} · {m.category}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Riders */}
        {tab === 'riders' && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.2rem', fontWeight: 700, marginBottom: 16 }}>Dispatch Riders</h2>
            {riders.map(r => (
              <div key={r.id} style={{ background: '#ffffff', borderRadius: 14, padding: '16px 20px', border: '1px solid #e2ddd8', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <p style={{ fontFamily: 'var(--font-playfair)', fontWeight: 700 }}>{r.profiles?.full_name}</p>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: r.is_approved ? '#f0fdf4' : '#fff7ed', color: r.is_approved ? '#166534' : '#c2410c', fontFamily: 'var(--font-dm-sans)', fontWeight: 600 }}>{r.is_approved ? 'Approved' : 'Pending'}</span>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#f4f0eb', color: '#6b6560', fontFamily: 'var(--font-dm-sans)', fontWeight: 600, textTransform: 'capitalize' }}>{r.status}</span>
                  </div>
                  <p style={{ fontSize: 12, color: '#6b6560', fontFamily: 'var(--font-dm-sans)' }}>{r.vehicle_type} · {r.vehicle_plate} · {r.total_deliveries} deliveries</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Users */}
        {tab === 'users' && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.2rem', fontWeight: 700, marginBottom: 16 }}>Users</h2>
            {users.map(u => (
              <div key={u.id} style={{ background: '#ffffff', borderRadius: 14, padding: '14px 20px', border: '1px solid #e2ddd8', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <p style={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, marginBottom: 2 }}>{u.full_name || 'Unnamed'}</p>
                  <p style={{ fontSize: 12, color: '#6b6560', fontFamily: 'var(--font-dm-sans)' }}>{u.email}</p>
                </div>
                <select value={u.role} onChange={e => changeUserRole(u.id, e.target.value)} style={{ padding: '7px 12px', borderRadius: 8, border: '1.5px solid #e2ddd8', background: '#faf7f2', fontSize: 12, fontFamily: 'var(--font-dm-sans)', color: '#0d1117', cursor: 'pointer' }}>
                  {['user','admin','hotel_manager','hotel_reception','dispatch_rider','merchant'].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}