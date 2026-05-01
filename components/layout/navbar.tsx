'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types/database'
import { Hotel, Package, ShoppingBag, LayoutDashboard, LogOut, User, Menu, X, Coins, ChevronDown, Settings } from 'lucide-react'

interface NavbarProps { profile?: Profile | null }

export function Navbar({ profile }: NavbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const isHero = pathname === '/'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-dropdown]')) setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const solid = scrolled || !isHero
  const textColor = solid ? '#0d1117' : '#ffffff'
  const initials = profile?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'

  const navLinks = [
    { label: 'Hotels',      href: '/hotels',      icon: Hotel },
    { label: 'Logistics',   href: '/logistics',   icon: Package },
    { label: 'Marketplace', href: '/marketplace', icon: ShoppingBag },
  ]

  return (
    <>
      {/* ── NAVBAR ── */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: 64,
        background: solid ? 'rgba(255,255,255,0.97)' : 'transparent',
        backdropFilter: solid ? 'blur(20px)' : 'none',
        borderBottom: solid ? '1px solid rgba(226,221,216,0.8)' : 'none',
        boxShadow: solid ? '0 2px 24px rgba(15,32,68,0.07)' : 'none',
        transition: 'background 0.3s, box-shadow 0.3s, border-color 0.3s',
      }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto',
          padding: '0 24px',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 24,
        }}>

          {/* Logo */}
          <Link href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
            <span style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 22, fontWeight: 700,
              color: solid ? '#0f2044' : '#ffffff',
              transition: 'color 0.3s',
              letterSpacing: '-0.01em',
            }}>
              My<span style={{ color: '#c9973a' }}>township</span>
            </span>
          </Link>

          {/* Desktop nav links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, justifyContent: 'center' }} className="hidden-mobile">
            {navLinks.map(({ label, href }) => {
              const active = pathname.startsWith(href)
              return (
                <Link key={href} href={href} style={{ textDecoration: 'none' }}>
                  <div style={{
                    padding: '8px 14px',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: active ? 600 : 500,
                    fontFamily: "'DM Sans', sans-serif",
                    color: active
                      ? '#c9973a'
                      : solid ? '#4a4a4a' : 'rgba(255,255,255,0.85)',
                    background: active
                      ? solid ? 'rgba(201,151,58,0.1)' : 'rgba(201,151,58,0.15)'
                      : 'transparent',
                    transition: 'all 0.2s',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}>
                    {label}
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }} className="hidden-mobile">

            {/* CHAR badge */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 11px', borderRadius: 20,
              background: 'rgba(201,151,58,0.12)',
              border: '1px solid rgba(201,151,58,0.3)',
              color: '#c9973a', fontSize: 12, fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif",
              whiteSpace: 'nowrap',
            }}>
              <Coins size={12} /> CHAR Pay
            </div>

            {profile ? (
              <div style={{ position: 'relative' }} data-dropdown>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '6px 10px 6px 6px', borderRadius: 50,
                    background: solid ? '#f0ede8' : 'rgba(255,255,255,0.12)',
                    border: 'none', cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}>
                  {/* Avatar */}
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: 'linear-gradient(135deg,#0f2044,#1a3260)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#c9973a', fontSize: 11, fontWeight: 700,
                    fontFamily: "'DM Sans', sans-serif",
                    flexShrink: 0,
                  }}>{initials}</div>
                  <span style={{
                    fontSize: 14, fontWeight: 500,
                    fontFamily: "'DM Sans', sans-serif",
                    color: textColor,
                    maxWidth: 100, overflow: 'hidden',
                    textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {profile.full_name?.split(' ')[0]}
                  </span>
                  <ChevronDown size={13} style={{
                    color: solid ? '#6b6560' : 'rgba(255,255,255,0.6)',
                    transition: 'transform 0.2s',
                    transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  }} />
                </button>

                {/* Dropdown */}
                {dropdownOpen && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                    background: '#ffffff', borderRadius: 16, padding: '8px',
                    boxShadow: '0 16px 48px rgba(15,32,68,0.14)',
                    border: '1px solid #e2ddd8', minWidth: 210, zIndex: 200,
                  }}>
                    <div style={{ padding: '10px 14px 10px', borderBottom: '1px solid #f0ede8', marginBottom: 4 }}>
                      <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 14, color: '#0d1117', marginBottom: 2 }}>
                        {profile.full_name}
                      </p>
                      <p style={{ fontSize: 11, color: '#6b6560', fontFamily: "'DM Sans', sans-serif", textTransform: 'capitalize' }}>
                        {profile.role?.replace('_', ' ')}
                      </p>
                    </div>

                    {[
                      { label: 'Dashboard',  href: '/dashboard/bookings', icon: LayoutDashboard },
                      { label: 'Apply for Role', href: '/apply',          icon: User },
                      ...(profile.role === 'admin' ? [{ label: 'Admin Panel', href: '/dashboard/admin', icon: Settings }] : []),
                    ].map(({ label, href, icon: Icon }) => (
                      <Link key={label} href={href} onClick={() => setDropdownOpen(false)} style={{ textDecoration: 'none' }}>
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '9px 14px', borderRadius: 10,
                          fontSize: 13, fontFamily: "'DM Sans', sans-serif",
                          color: label === 'Admin Panel' ? '#dc2626' : '#0d1117',
                          cursor: 'pointer', transition: 'background 0.15s',
                        }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#f4f0eb'}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                        >
                          <Icon size={14} style={{ color: label === 'Admin Panel' ? '#dc2626' : '#6b6560' }} />
                          {label}
                        </div>
                      </Link>
                    ))}

                    <div style={{ borderTop: '1px solid #f0ede8', marginTop: 4, paddingTop: 4 }}>
                      <button onClick={handleSignOut} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '9px 14px', borderRadius: 10,
                        fontSize: 13, fontFamily: "'DM Sans', sans-serif",
                        color: '#dc2626', cursor: 'pointer',
                        background: 'transparent', border: 'none', width: '100%',
                        transition: 'background 0.15s',
                      }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#fef2f2'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                      >
                        <LogOut size={14} /> Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Link href="/auth/login" style={{ textDecoration: 'none' }}>
                  <button style={{
                    padding: '8px 18px', borderRadius: 8, border: 'none',
                    background: 'transparent', cursor: 'pointer',
                    fontSize: 14, fontWeight: 500,
                    fontFamily: "'DM Sans', sans-serif",
                    color: textColor, transition: 'all 0.2s',
                  }}>Sign in</button>
                </Link>
                <Link href="/auth/register" style={{ textDecoration: 'none' }}>
                  <button style={{
                    padding: '9px 20px', borderRadius: 8, border: 'none',
                    background: 'linear-gradient(135deg,#c9973a,#e4b55a)',
                    cursor: 'pointer', fontSize: 14, fontWeight: 700,
                    fontFamily: "'DM Sans', sans-serif",
                    color: '#0f2044',
                    boxShadow: '0 3px 12px rgba(201,151,58,0.3)',
                    whiteSpace: 'nowrap',
                  }}>Get started</button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="show-mobile"
            style={{
              background: 'transparent', border: 'none',
              cursor: 'pointer', padding: 6,
              color: textColor, display: 'none',
            }}>
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* Spacer for non-hero pages */}
      {!isHero && <div style={{ height: 64 }} />}

      {/* ── MOBILE MENU ── */}
      {mobileOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99,
          background: '#0a1628',
          display: 'flex', flexDirection: 'column',
          padding: '84px 24px 32px',
        }}>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 32 }}>
            {navLinks.map(({ label, href, icon: Icon }) => (
              <Link key={href} href={href} onClick={() => setMobileOpen(false)} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 18px', borderRadius: 12,
                  background: pathname.startsWith(href) ? 'rgba(201,151,58,0.12)' : 'transparent',
                  color: pathname.startsWith(href) ? '#c9973a' : '#ffffff',
                  fontSize: 17, fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
                  transition: 'background 0.2s',
                }}>
                  <Icon size={19} style={{ color: pathname.startsWith(href) ? '#c9973a' : 'rgba(255,255,255,0.5)' }} />
                  {label}
                </div>
              </Link>
            ))}
            {profile && (
              <>
                <Link href="/dashboard/bookings" onClick={() => setMobileOpen(false)} style={{ textDecoration: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderRadius: 12, color: '#ffffff', fontSize: 17, fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>
                    <LayoutDashboard size={19} style={{ color: 'rgba(255,255,255,0.5)' }} /> Dashboard
                  </div>
                </Link>
                <Link href="/apply" onClick={() => setMobileOpen(false)} style={{ textDecoration: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderRadius: 12, color: '#ffffff', fontSize: 17, fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>
                    <User size={19} style={{ color: 'rgba(255,255,255,0.5)' }} /> Apply for Role
                  </div>
                </Link>
              </>
            )}
          </nav>

          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {profile ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', marginBottom: 8 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#0f2044,#1a3260)', border: '2px solid #c9973a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c9973a', fontSize: 14, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>
                    {initials}
                  </div>
                  <div>
                    <p style={{ color: '#ffffff', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 15 }}>{profile.full_name}</p>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontFamily: "'DM Sans', sans-serif", fontSize: 12, textTransform: 'capitalize' }}>{profile.role?.replace('_', ' ')}</p>
                  </div>
                </div>
                <button onClick={() => { setMobileOpen(false); handleSignOut() }} style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: '#ffffff', fontSize: 15, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <LogOut size={17} /> Sign out
                </button>
              </div>
            ) : (
              <>
                <Link href="/auth/register" onClick={() => setMobileOpen(false)} style={{ textDecoration: 'none' }}>
                  <button style={{ width: '100%', padding: '15px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#c9973a,#e4b55a)', color: '#0f2044', fontSize: 16, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer' }}>
                    Get started free
                  </button>
                </Link>
                <Link href="/auth/login" onClick={() => setMobileOpen(false)} style={{ textDecoration: 'none' }}>
                  <button style={{ width: '100%', padding: '15px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#ffffff', fontSize: 16, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer' }}>
                    Sign in
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
        }
        @media (min-width: 769px) {
          .show-mobile { display: none !important; }
          .hidden-mobile { display: flex !important; }
        }
      `}</style>
    </>
  )
}