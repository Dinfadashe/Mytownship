'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/layout/navbar'
import type { Profile } from '@/types/database'
import {
  Hotel, Package, ShoppingBag, LayoutDashboard,
  Star, MapPin, ArrowRight, CheckCircle2, Shield,
  Clock, Sparkles, Coins, ChevronRight, TrendingUp,
  Navigation, Users, Settings
} from 'lucide-react'

const ROLE_FEATURES: Record<string, { icon: any; label: string; desc: string; href: string; color: string; bg: string }[]> = {
  user: [
    { icon: Hotel,       label: 'Book Hotels',      desc: 'Find and reserve hotels worldwide',      href: '/hotels',               color: '#0f2044', bg: '#e8eaf6' },
    { icon: Package,     label: 'Ship a Package',   desc: 'Create and track shipments',             href: '/logistics',            color: '#c9973a', bg: '#fdf6e8' },
    { icon: ShoppingBag, label: 'Marketplace',      desc: 'Shop from verified merchants',           href: '/marketplace',          color: '#a855f7', bg: '#fdf4ff' },
    { icon: LayoutDashboard, label: 'My Dashboard', desc: 'Bookings, orders & shipments',           href: '/dashboard/bookings',   color: '#22c55e', bg: '#f0fdf4' },
  ],
  hotel_manager: [
    { icon: LayoutDashboard, label: 'Hotel Dashboard', desc: 'Manage rooms, bookings & guests',     href: '/dashboard/hotel',      color: '#0f2044', bg: '#e8eaf6' },
    { icon: Hotel,           label: 'My Hotel',        desc: 'View your hotel listing',             href: '/hotels',               color: '#c9973a', bg: '#fdf6e8' },
    { icon: Users,           label: 'Guests',          desc: 'Check-in and check-out',              href: '/dashboard/hotel',      color: '#22c55e', bg: '#f0fdf4' },
    { icon: TrendingUp,      label: 'Revenue',         desc: 'Bookings and earnings overview',      href: '/dashboard/hotel',      color: '#a855f7', bg: '#fdf4ff' },
  ],
  hotel_reception: [
    { icon: LayoutDashboard, label: 'Hotel Dashboard', desc: 'Manage rooms, bookings & guests',     href: '/dashboard/hotel',      color: '#0f2044', bg: '#e8eaf6' },
    { icon: Users,           label: 'Check In/Out',    desc: 'Manage guest arrivals',               href: '/dashboard/hotel',      color: '#22c55e', bg: '#f0fdf4' },
    { icon: Hotel,           label: 'Room Grid',       desc: 'Toggle room availability',            href: '/dashboard/hotel',      color: '#c9973a', bg: '#fdf6e8' },
    { icon: CheckCircle2,    label: 'Bookings',        desc: 'Today\'s bookings at a glance',       href: '/dashboard/hotel',      color: '#3b82f6', bg: '#eff6ff' },
  ],
  dispatch_rider: [
    { icon: Navigation,      label: 'Rider Dashboard', desc: 'Toggle status & manage deliveries',   href: '/dashboard/rider',      color: '#0f2044', bg: '#e8eaf6' },
    { icon: Package,         label: 'Available Pickups','desc': 'Accept new shipments',             href: '/dashboard/rider',      color: '#c9973a', bg: '#fdf6e8' },
    { icon: CheckCircle2,    label: 'Active Deliveries','desc': 'Track your current deliveries',    href: '/dashboard/rider',      color: '#22c55e', bg: '#f0fdf4' },
    { icon: TrendingUp,      label: 'Earnings',        desc: 'Delivery history & earnings',         href: '/dashboard/rider',      color: '#a855f7', bg: '#fdf4ff' },
  ],
  merchant: [
    { icon: ShoppingBag,     label: 'Merchant Dashboard','desc': 'Manage products & orders',        href: '/dashboard/merchant',   color: '#0f2044', bg: '#e8eaf6' },
    { icon: Package,         label: 'My Products',     desc: 'List and manage your inventory',      href: '/dashboard/merchant',   color: '#c9973a', bg: '#fdf6e8' },
    { icon: CheckCircle2,    label: 'Orders',          desc: 'Incoming customer orders',            href: '/dashboard/merchant',   color: '#22c55e', bg: '#f0fdf4' },
    { icon: TrendingUp,      label: 'Sales',           desc: 'Revenue and analytics',               href: '/dashboard/merchant',   color: '#a855f7', bg: '#fdf4ff' },
  ],
  admin: [
    { icon: Settings,        label: 'Admin Panel',     desc: 'Full platform control',               href: '/dashboard/admin',      color: '#dc2626', bg: '#fef2f2' },
    { icon: Hotel,           label: 'Hotels',          desc: 'Approve and manage hotels',           href: '/dashboard/admin',      color: '#0f2044', bg: '#e8eaf6' },
    { icon: ShoppingBag,     label: 'Merchants',       desc: 'Approve and manage merchants',        href: '/dashboard/admin',      color: '#a855f7', bg: '#fdf4ff' },
    { icon: Navigation,      label: 'Riders',          desc: 'Approve dispatch riders',             href: '/dashboard/admin',      color: '#c9973a', bg: '#fdf6e8' },
    { icon: Users,           label: 'Users',           desc: 'Manage all accounts & roles',         href: '/dashboard/admin',      color: '#22c55e', bg: '#f0fdf4' },
    { icon: TrendingUp,      label: 'Analytics',       desc: 'Platform-wide statistics',            href: '/dashboard/admin',      color: '#3b82f6', bg: '#eff6ff' },
  ],
}

const ROLE_GREETINGS: Record<string, { title: string; subtitle: string; color: string }> = {
  user:             { title: 'Welcome back',          subtitle: 'What would you like to do today?',          color: '#0f2044' },
  hotel_manager:    { title: 'Hotel Manager',         subtitle: 'Manage your property and guests',           color: '#0f2044' },
  hotel_reception:  { title: 'Hotel Reception',       subtitle: 'Manage check-ins, check-outs and rooms',    color: '#0f2044' },
  dispatch_rider:   { title: 'Rider Dashboard',       subtitle: 'Set your status and manage deliveries',     color: '#c9973a' },
  merchant:         { title: 'Merchant Portal',       subtitle: 'Manage your products and orders',           color: '#a855f7' },
  admin:            { title: 'Admin Panel',           subtitle: 'Full control of the MyTownship platform',   color: '#dc2626' },
}

export default function HomePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [featuredHotels, setFeaturedHotels] = useState<any[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        setProfile(data)
      }
      const { data: hotels } = await supabase
        .from('hotels').select('id,name,city_name,state_name,star_rating,cover_image')
        .eq('is_active', true).eq('is_approved', true).limit(6)
      setFeaturedHotels(hotels || [])
      setLoaded(true)
    }
    load()
  }, [])

  const role = profile?.role || 'guest'
  const features = ROLE_FEATURES[role] || []
  const greeting = ROLE_GREETINGS[role]
  const firstName = profile?.full_name?.split(' ')[0]

  // ── Logged-in role dashboard ──────────────────────────────────
  if (profile && loaded) {
    return (
      <div style={{ minHeight: '100vh', background: '#fafaf8' }}>
        <Navbar profile={profile} />

        {/* Role hero banner */}
        <div style={{ background: `linear-gradient(135deg, #0a1628 0%, #0f2044 60%, #1a3260 100%)`, padding: '48px 0 0' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px 40px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 50, background: 'rgba(201,151,58,0.15)', border: '1px solid rgba(201,151,58,0.3)', marginBottom: 16 }}>
                  <Sparkles size={12} style={{ color: '#c9973a' }} />
                  <span style={{ color: '#e4b55a', fontSize: 12, fontFamily: 'var(--font-dm-sans)', fontWeight: 500, textTransform: 'capitalize' }}>
                    {role.replace('_', ' ')} account
                  </span>
                </div>
                <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 700, color: '#ffffff', marginBottom: 8, lineHeight: 1.2 }}>
                  {greeting?.title}, <span style={{ color: '#c9973a' }}>{firstName}</span>
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, fontFamily: 'var(--font-dm-sans)' }}>
                  {greeting?.subtitle}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {role === 'admin' && (
                  <Link href="/dashboard/admin" style={{ textDecoration: 'none' }}>
                    <div style={{ padding: '12px 24px', borderRadius: 12, background: 'linear-gradient(135deg,#dc2626,#b91c1c)', color: '#ffffff', fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-dm-sans)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Settings size={16} /> Admin Panel
                    </div>
                  </Link>
                )}
                {role === 'dispatch_rider' && (
                  <Link href="/dashboard/rider" style={{ textDecoration: 'none' }}>
                    <div style={{ padding: '12px 24px', borderRadius: 12, background: 'linear-gradient(135deg,#c9973a,#e4b55a)', color: '#0f2044', fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-dm-sans)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Navigation size={16} /> My Dashboard
                    </div>
                  </Link>
                )}
                {(role === 'hotel_manager' || role === 'hotel_reception') && (
                  <Link href="/dashboard/hotel" style={{ textDecoration: 'none' }}>
                    <div style={{ padding: '12px 24px', borderRadius: 12, background: 'linear-gradient(135deg,#c9973a,#e4b55a)', color: '#0f2044', fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-dm-sans)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Hotel size={16} /> Hotel Dashboard
                    </div>
                  </Link>
                )}
                {role === 'merchant' && (
                  <Link href="/dashboard/merchant" style={{ textDecoration: 'none' }}>
                    <div style={{ padding: '12px 24px', borderRadius: 12, background: 'linear-gradient(135deg,#c9973a,#e4b55a)', color: '#0f2044', fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-dm-sans)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <ShoppingBag size={16} /> Merchant Dashboard
                    </div>
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Wave */}
          <svg viewBox="0 0 1440 40" fill="none" style={{ display: 'block', marginBottom: -2 }}>
            <path d="M0,20 C360,50 1080,0 1440,20 L1440,40 L0,40 Z" fill="#fafaf8"/>
          </svg>
        </div>

        {/* Role feature tiles */}
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 32px' }}>
          <div style={{ marginBottom: 28 }}>
            <p style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c9973a', fontFamily: 'var(--font-dm-sans)', marginBottom: 6 }}>Your Features</p>
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.6rem', fontWeight: 700 }}>Quick Access</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 48 }}>
            {features.map(({ icon: Icon, label, desc, href, color, bg }) => (
              <Link key={label} href={href} style={{ textDecoration: 'none' }}>
                <div style={{ background: '#ffffff', borderRadius: 18, padding: 24, border: '1px solid #e2ddd8', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', height: '100%' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 40px rgba(15,32,68,0.1)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
                >
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                    <Icon size={22} style={{ color }} />
                  </div>
                  <p style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.05rem', fontWeight: 700, marginBottom: 6, color: '#0d1117' }}>{label}</p>
                  <p style={{ fontSize: 13, color: '#6b6560', fontFamily: 'var(--font-dm-sans)', lineHeight: 1.6, marginBottom: 16 }}>{desc}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color, fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-dm-sans)' }}>
                    Open <ArrowRight size={13} />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Featured hotels — shown for all roles */}
          {featuredHotels.length > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c9973a', fontFamily: 'var(--font-dm-sans)', marginBottom: 4 }}>Top Properties</p>
                  <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.4rem', fontWeight: 700 }}>Featured Hotels</h2>
                </div>
                <Link href="/hotels" style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#0f2044', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-dm-sans)', textDecoration: 'none' }}>
                  View all <ChevronRight size={14} />
                </Link>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                {featuredHotels.map(hotel => (
                  <Link key={hotel.id} href={`/hotels/${hotel.id}`} style={{ textDecoration: 'none' }}>
                    <div style={{ background: '#ffffff', borderRadius: 16, overflow: 'hidden', border: '1px solid #e2ddd8', transition: 'transform 0.2s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'}
                    >
                      <div style={{ height: 130, background: '#f4f0eb', position: 'relative' }}>
                        {hotel.cover_image
                          ? <img src={hotel.cover_image} alt={hotel.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Hotel size={32} style={{ color: '#c9b99e' }} /></div>
                        }
                        {hotel.star_rating && (
                          <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 2, padding: '4px 8px', borderRadius: 20, background: 'rgba(15,32,68,0.85)' }}>
                            {Array.from({ length: hotel.star_rating }).map((_: unknown, i: number) => <Star key={i} size={9} style={{ fill: '#c9973a', stroke: '#c9973a' }} />)}
                          </div>
                        )}
                      </div>
                      <div style={{ padding: 14 }}>
                        <p style={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, fontSize: '0.9rem', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{hotel.name}</p>
                        <p style={{ fontSize: 12, color: '#6b6560', fontFamily: 'var(--font-dm-sans)', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <MapPin size={10} /> {hotel.city_name}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Guest / logged-out landing page ──────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#fafaf8' }}>
      <Navbar profile={null} />

      {/* Hero */}
      <section style={{ minHeight: '92vh', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, #0a1628 0%, #0f2044 45%, #1a3260 100%)' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.06, backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        <div style={{ position: 'absolute', top: '25%', right: '20%', width: 400, height: 400, borderRadius: '50%', opacity: 0.08, filter: 'blur(60px)', background: 'radial-gradient(circle, #c9973a, transparent)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 32px', position: 'relative', zIndex: 10, width: '100%' }}>
          <div style={{ maxWidth: 680 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 50, marginBottom: 32, background: 'rgba(201,151,58,0.15)', border: '1px solid rgba(201,151,58,0.3)' }}>
              <Sparkles size={13} style={{ color: '#c9973a' }} />
              <span style={{ color: '#e4b55a', fontSize: 13, fontFamily: 'var(--font-dm-sans)', fontWeight: 500 }}>Hotels · Logistics · Marketplace · Worldwide</span>
            </div>
            <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(2.8rem,5vw,4.5rem)', fontWeight: 700, lineHeight: 1.1, color: '#ffffff', marginBottom: 24 }}>
              Where Hospitality<br />Meets{' '}
              <span style={{ background: 'linear-gradient(90deg,#c9973a,#f0c96a,#c9973a)', backgroundSize: '200% auto', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Precision</span>
            </h1>
            <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.8, maxWidth: 520, marginBottom: 40, fontFamily: 'var(--font-dm-sans)' }}>
              Book hotels in any city worldwide, ship packages door-to-door, and shop from verified merchants — all powered by Charity Token.
            </p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 40 }}>
              <Link href="/auth/register" style={{ textDecoration: 'none' }}>
                <div style={{ padding: '14px 32px', borderRadius: 50, background: 'linear-gradient(135deg,#c9973a,#e4b55a)', color: '#0f2044', fontWeight: 700, fontSize: 15, fontFamily: 'var(--font-dm-sans)', cursor: 'pointer', boxShadow: '0 8px 30px rgba(201,151,58,0.35)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  Get started free
                </div>
              </Link>
              <Link href="/hotels" style={{ textDecoration: 'none' }}>
                <div style={{ padding: '14px 32px', borderRadius: 50, background: 'transparent', color: '#ffffff', fontWeight: 500, fontSize: 15, fontFamily: 'var(--font-dm-sans)', cursor: 'pointer', border: '1.5px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Hotel size={16} /> Browse Hotels
                </div>
              </Link>
            </div>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              {[{ icon: CheckCircle2, text: 'Free signup' }, { icon: Shield, text: 'Secure' }, { icon: Clock, text: '24/7 support' }, { icon: Coins, text: 'CHAR payments' }].map(({ icon: Icon, text }) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.5)', fontSize: 13, fontFamily: 'var(--font-dm-sans)' }}>
                  <Icon size={13} style={{ color: '#c9973a' }} /> {text}
                </div>
              ))}
            </div>
          </div>
        </div>
        <svg viewBox="0 0 1440 50" fill="none" style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
          <path d="M0,30 C360,60 1080,0 1440,30 L1440,50 L0,50 Z" fill="#fafaf8"/>
        </svg>
      </section>

      {/* How it works */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <p style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#c9973a', fontFamily: "'DM Sans',sans-serif", marginBottom: 12 }}>Simple process</p>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(1.8rem,3vw,2.6rem)', fontWeight: 700, marginBottom: 16 }}>Up and running in minutes</h2>
          <div style={{ width: 60, height: 3, background: 'linear-gradient(90deg,#c9973a,#f0c96a)', borderRadius: 2, margin: '0 auto 20px' }} />
          <p style={{ color: '#6b6560', maxWidth: 480, margin: '0 auto', lineHeight: 1.8, fontFamily: "'DM Sans',sans-serif" }}>
            Create an account, verify your identity, and access everything MyTownship has to offer.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 20 }}>
          {[
            {
              step: '01',
              title: 'Create account',
              desc: 'Sign up with your name, email and country. Takes under a minute.',
              color: '#0f2044', bg: '#e8eaf6',
              href: '/auth/register',
            },
            {
              step: '02',
              title: 'Verify identity',
              desc: 'Nigerians verify instantly with NIN + selfie. International users submit a quick KYC.',
              color: '#c9973a', bg: '#fdf6e8',
              href: '/auth/register',
            },
            {
              step: '03',
              title: 'Access dashboard',
              desc: 'Book hotels, ship packages and shop the marketplace straight away.',
              color: '#a855f7', bg: '#fdf4ff',
              href: '/auth/register',
            },
            {
              step: '04',
              title: 'Apply for a role',
              desc: 'Want to list a hotel, sell products or ride for deliveries? Apply from your dashboard.',
              color: '#22c55e', bg: '#f0fdf4',
              href: '/auth/register',
            },
          ].map(({ step, title, desc, color, bg, href }) => (
            <Link key={step} href={href} style={{ textDecoration: 'none' }}>
              <div style={{ background: '#ffffff', borderRadius: 18, padding: 24, border: '1px solid #e2ddd8', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', height: '100%' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 40px rgba(15,32,68,0.1)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <span style={{ fontFamily: "'Playfair Display',serif", fontSize: '2rem', fontWeight: 800, color: '#e2ddd8', lineHeight: 1 }}>{step}</span>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
                  </div>
                </div>
                <p style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: '1rem', marginBottom: 8, color: '#0d1117' }}>{title}</p>
                <p style={{ fontSize: 13, color: '#6b6560', fontFamily: "'DM Sans',sans-serif", lineHeight: 1.7 }}>{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Services */}
      <section style={{ background: '#f4f0eb', padding: '80px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <p style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#c9973a', fontFamily: 'var(--font-dm-sans)', marginBottom: 12 }}>Core Services</p>
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(1.8rem,3vw,2.6rem)', fontWeight: 700 }}>Everything Connected</h2>
            <div style={{ width: 60, height: 3, background: 'linear-gradient(90deg,#c9973a,#f0c96a)', borderRadius: 2, margin: '16px auto 0' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 20 }}>
            {[
              { icon: Hotel,       title: 'Hotel Booking',       desc: 'Search any city worldwide. Filter by stars, amenities, price. Instant confirmation.', href: '/hotels',      featured: false },
              { icon: Package,     title: 'Logistics',           desc: 'Door-to-door delivery with live tracking, available dispatch riders shown on map.', href: '/logistics',   featured: true  },
              { icon: ShoppingBag, title: 'Marketplace',         desc: 'Buy from local merchants. Delivery handled automatically by available riders.',     href: '/marketplace', featured: false },
              { icon: Coins,       title: 'Charity Token Pay',   desc: 'Pay with CHAR tokens across all services. Zero fees. Support charitable causes.',   href: '/auth/register', featured: false },
            ].map(({ icon: Icon, title, desc, href, featured }) => (
              <Link key={title} href={href} style={{ textDecoration: 'none' }}>
                <div style={{ borderRadius: 20, padding: 28, background: featured ? 'linear-gradient(135deg,#0f2044,#1a3260)' : '#ffffff', border: featured ? 'none' : '1px solid #e2ddd8', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', height: '100%' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 40px rgba(15,32,68,0.12)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
                >
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: featured ? 'rgba(201,151,58,0.2)' : '#e8eaf6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                    <Icon size={22} style={{ color: featured ? '#c9973a' : '#0f2044' }} />
                  </div>
                  <p style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.1rem', fontWeight: 700, color: featured ? '#ffffff' : '#0d1117', marginBottom: 10 }}>{title}</p>
                  <p style={{ fontSize: 14, color: featured ? 'rgba(255,255,255,0.6)' : '#6b6560', fontFamily: 'var(--font-dm-sans)', lineHeight: 1.7, marginBottom: 18 }}>{desc}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: featured ? '#c9973a' : '#0f2044', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-dm-sans)' }}>
                    Explore <ArrowRight size={13} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured hotels */}
      {featuredHotels.length > 0 && (
        <section style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40 }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#c9973a', fontFamily: 'var(--font-dm-sans)', marginBottom: 10 }}>Top Properties</p>
              <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(1.8rem,3vw,2.4rem)', fontWeight: 700 }}>Featured Hotels</h2>
              <div style={{ width: 60, height: 3, background: 'linear-gradient(90deg,#c9973a,#f0c96a)', borderRadius: 2, marginTop: 14 }} />
            </div>
            <Link href="/hotels" style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#0f2044', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-dm-sans)', textDecoration: 'none' }}>
              View all <ChevronRight size={14} />
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 20 }}>
            {featuredHotels.map(hotel => (
              <Link key={hotel.id} href={`/hotels/${hotel.id}`} style={{ textDecoration: 'none' }}>
                <div style={{ background: '#ffffff', borderRadius: 18, overflow: 'hidden', border: '1px solid #e2ddd8', transition: 'transform 0.2s, box-shadow 0.2s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 40px rgba(15,32,68,0.1)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
                >
                  <div style={{ height: 160, background: '#f4f0eb', position: 'relative' }}>
                    {hotel.cover_image
                      ? <img src={hotel.cover_image} alt={hotel.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Hotel size={36} style={{ color: '#c9b99e' }} /></div>
                    }
                    {hotel.star_rating && (
                      <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 2, padding: '5px 10px', borderRadius: 20, background: 'rgba(15,32,68,0.85)', backdropFilter: 'blur(8px)' }}>
                        {Array.from({ length: hotel.star_rating }).map((_: unknown, i: number) => <Star key={i} size={10} style={{ fill: '#c9973a', stroke: '#c9973a' }} />)}
                      </div>
                    )}
                  </div>
                  <div style={{ padding: 18 }}>
                    <p style={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, fontSize: '1rem', marginBottom: 6 }}>{hotel.name}</p>
                    <p style={{ fontSize: 12, color: '#6b6560', fontFamily: 'var(--font-dm-sans)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={11} /> {hotel.city_name}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                      <span style={{ color: '#c9973a', fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-dm-sans)', display: 'flex', alignItems: 'center', gap: 3 }}>
                        View <ArrowRight size={11} />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section style={{ background: 'linear-gradient(135deg,#0a1628,#0f2044,#1a3260)', padding: '80px 0', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 32px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#c9973a', fontFamily: 'var(--font-dm-sans)', marginBottom: 16 }}>Join Today</p>
          <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 700, color: '#ffffff', marginBottom: 20, lineHeight: 1.2 }}>Your Destination Awaits</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1rem', marginBottom: 40, lineHeight: 1.8, fontFamily: 'var(--font-dm-sans)' }}>
            Create your free account, verify your identity, and access hotels, logistics and the marketplace — all in one place.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
            <Link href="/auth/register" style={{ textDecoration: 'none' }}>
              <div style={{ padding: '15px 36px', borderRadius: 50, background: 'linear-gradient(135deg,#c9973a,#e4b55a)', color: '#0f2044', fontWeight: 700, fontSize: 15, fontFamily: 'var(--font-dm-sans)', cursor: 'pointer', boxShadow: '0 8px 30px rgba(201,151,58,0.35)' }}>
                Create Free Account
              </div>
            </Link>
            <Link href="/hotels" style={{ textDecoration: 'none' }}>
              <div style={{ padding: '15px 36px', borderRadius: 50, background: 'transparent', color: '#ffffff', fontWeight: 500, fontSize: 15, fontFamily: 'var(--font-dm-sans)', cursor: 'pointer', border: '1.5px solid rgba(255,255,255,0.3)' }}>
                Browse Hotels
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#0a1628', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '48px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 40, marginBottom: 40 }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.4rem', fontWeight: 700, color: '#ffffff', marginBottom: 10 }}>
                My<span style={{ color: '#c9973a' }}>township</span>
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, lineHeight: 1.8, fontFamily: 'var(--font-dm-sans)', maxWidth: 260 }}>
                Hotel Management & Logistics · Services Connected. Powered by Charity Token.
              </p>
            </div>
            {[
              { title: 'Services', links: [['Hotels','/hotels'],['Logistics','/logistics'],['Marketplace','/marketplace']] },
              { title: 'Roles', links: [['Hotel Manager','/auth/register'],['Merchant','/auth/register'],['Rider','/auth/register']] },
              { title: 'Account', links: [['Sign In','/auth/login'],['Register','/auth/register'],['Dashboard','/dashboard/bookings']] },
            ].map(({ title, links }) => (
              <div key={title}>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-dm-sans)', marginBottom: 14 }}>{title}</p>
                {links.map(([label, href]) => (
                  <Link key={label} href={href} style={{ display: 'block', color: 'rgba(255,255,255,0.35)', fontSize: 13, fontFamily: 'var(--font-dm-sans)', textDecoration: 'none', marginBottom: 8 }}>{label}</Link>
                ))}
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12, fontFamily: 'var(--font-dm-sans)' }}>© {new Date().getFullYear()} MyTownship. All rights reserved.</p>
            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12, fontFamily: 'var(--font-dm-sans)' }}>Built with ♥ for the world</p>
          </div>
        </div>
      </footer>
    </div>
  )
}