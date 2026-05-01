'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types/database'
import { Hotel, Package, LayoutDashboard, LogOut, User, Menu, X, Coins, ChevronDown } from 'lucide-react'

interface NavbarProps { profile?: Profile | null }

export function Navbar({ profile }: NavbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const isHero = pathname === '/'
  const initials = profile?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'

  const navStyle: React.CSSProperties = {
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
    transition: 'all 0.3s ease',
    background: scrolled || !isHero
      ? 'rgba(255,255,255,0.97)'
      : 'transparent',
    backdropFilter: scrolled || !isHero ? 'blur(20px)' : 'none',
    borderBottom: scrolled || !isHero ? '1px solid rgba(226,221,216,0.8)' : 'none',
    boxShadow: scrolled ? '0 4px 30px rgba(15,32,68,0.08)' : 'none',
  }

  const linkColor = scrolled || !isHero ? '#0d1117' : '#ffffff'
  const logoColor = scrolled || !isHero ? '#0f2044' : '#ffffff'
  const logoGold = '#c9973a'

  return (
    <>
      <nav style={navStyle}>
        <div className="container mx-auto px-6 lg:px-12 h-16 flex items-center justify-between">

          {/* Logo */}
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.4rem', fontWeight: 700, color: logoColor, transition: 'color 0.3s' }}>
              My<span style={{ color: logoGold }}>township</span>
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {[
              { label: 'Hotels', href: '/hotels', icon: Hotel },
              { label: 'Logistics', href: '/logistics', icon: Package },
            ].map(({ label, href, icon: Icon }) => {
              const active = pathname.startsWith(href)
              return (
                <Link key={href} href={href} style={{ textDecoration: 'none' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px 16px', borderRadius: '8px', cursor: 'pointer',
                    color: active ? logoGold : linkColor,
                    background: active ? (scrolled || !isHero ? 'rgba(201,151,58,0.08)' : 'rgba(255,255,255,0.1)') : 'transparent',
                    fontSize: '14px', fontWeight: 500, fontFamily: 'var(--font-dm-sans)',
                    transition: 'all 0.2s'
                  }}>
                    <Icon size={15} /> {label}
                  </div>
                </Link>
              )
            })}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {/* CHAR badge */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 12px', borderRadius: '20px',
              background: 'rgba(201,151,58,0.12)',
              border: '1px solid rgba(201,151,58,0.3)',
              color: '#c9973a', fontSize: '12px', fontWeight: 600,
              fontFamily: 'var(--font-dm-sans)'
            }}>
              <Coins size={12} /> CHAR Pay
            </div>

            {profile ? (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '6px 12px 6px 6px', borderRadius: '50px',
                    background: scrolled || !isHero ? '#f0ede8' : 'rgba(255,255,255,0.15)',
                    border: 'none', cursor: 'pointer', transition: 'all 0.2s'
                  }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #0f2044, #1a3260)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#c9973a', fontSize: '12px', fontWeight: 700, fontFamily: 'var(--font-dm-sans)'
                  }}>{initials}</div>
                  <span style={{ color: linkColor, fontSize: '14px', fontWeight: 500, fontFamily: 'var(--font-dm-sans)', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {profile.full_name?.split(' ')[0]}
                  </span>
                  <ChevronDown size={14} style={{ color: linkColor, transition: 'transform 0.2s', transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                </button>

                {dropdownOpen && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                    background: '#ffffff', borderRadius: '16px', padding: '8px',
                    boxShadow: '0 20px 60px rgba(15,32,68,0.15)',
                    border: '1px solid #e2ddd8', minWidth: '200px', zIndex: 200
                  }}>
                    <div style={{ padding: '12px 16px 8px', borderBottom: '1px solid #f0ede8', marginBottom: '4px' }}>
                      <p style={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, color: '#0d1117', fontSize: '14px' }}>{profile.full_name}</p>
                      <p style={{ color: '#6b6560', fontSize: '12px', fontFamily: 'var(--font-dm-sans)', textTransform: 'capitalize' }}>{profile.role}</p>
                    </div>
                    {[
                      { label: 'Dashboard', href: '/dashboard/bookings', icon: LayoutDashboard },
                      { label: 'Profile', href: '/dashboard/profile', icon: User },
                    ].map(({ label, href, icon: Icon }) => (
                      <Link key={label} href={href} onClick={() => setDropdownOpen(false)}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', borderRadius: '10px', color: '#0d1117', fontSize: '14px', fontFamily: 'var(--font-dm-sans)', cursor: 'pointer', transition: 'background 0.15s' }}
                          onMouseOver={e => (e.currentTarget as HTMLElement).style.background = '#f4f0eb'}
                          onMouseOut={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                          <Icon size={15} style={{ color: '#6b6560' }} /> {label}
                        </div>
                      </Link>
                    ))}
                    <button onClick={handleSignOut} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', borderRadius: '10px', color: '#dc2626', fontSize: '14px', fontFamily: 'var(--font-dm-sans)', cursor: 'pointer', background: 'transparent', border: 'none', width: '100%', transition: 'background 0.15s' }}
                      onMouseOver={e => (e.currentTarget as HTMLElement).style.background = '#fef2f2'}
                      onMouseOut={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                      <LogOut size={15} /> Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Link href="/auth/login">
                  <button style={{
                    padding: '8px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                    background: 'transparent', color: linkColor,
                    fontSize: '14px', fontWeight: 500, fontFamily: 'var(--font-dm-sans)',
                    transition: 'all 0.2s'
                  }}>Sign in</button>
                </Link>
                <Link href="/auth/register">
                  <button style={{
                    padding: '9px 22px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                    background: 'linear-gradient(135deg, #c9973a, #e4b55a)',
                    color: '#0f2044', fontSize: '14px', fontWeight: 700,
                    fontFamily: 'var(--font-dm-sans)',
                    boxShadow: '0 4px 15px rgba(201,151,58,0.3)',
                    transition: 'transform 0.2s'
                  }}>Get started</button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: linkColor, padding: '4px' }}>
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Spacer for non-hero pages */}
      {!isHero && <div style={{ height: '64px' }} />}

      {/* Mobile menu */}
      {mobileOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99,
          background: 'rgba(10,22,40,0.97)', display: 'flex', flexDirection: 'column',
          padding: '80px 24px 32px'
        }}>
          <div className="space-y-2">
            {[
              { label: 'Hotels', href: '/hotels', icon: Hotel },
              { label: 'Logistics', href: '/logistics', icon: Package },
              { label: 'Dashboard', href: '/dashboard/bookings', icon: LayoutDashboard },
            ].map(({ label, href, icon: Icon }) => (
              <Link key={label} href={href} onClick={() => setMobileOpen(false)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 20px', borderRadius: '14px', color: '#ffffff', fontSize: '18px', fontFamily: 'var(--font-playfair)', fontWeight: 600, background: pathname.startsWith(href) ? 'rgba(201,151,58,0.15)' : 'transparent', transition: 'background 0.2s' }}>
                  <Icon size={20} style={{ color: '#c9973a' }} /> {label}
                </div>
              </Link>
            ))}
          </div>
          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {profile ? (
              <button onClick={() => { setMobileOpen(false); handleSignOut() }} style={{ padding: '16px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: '#ffffff', fontSize: '16px', fontFamily: 'var(--font-dm-sans)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <LogOut size={18} /> Sign out
              </button>
            ) : (
              <>
                <Link href="/auth/register" onClick={() => setMobileOpen(false)}>
                  <button style={{ width: '100%', padding: '16px', borderRadius: '14px', border: 'none', background: 'linear-gradient(135deg, #c9973a, #e4b55a)', color: '#0f2044', fontSize: '16px', fontWeight: 700, fontFamily: 'var(--font-dm-sans)', cursor: 'pointer' }}>Get started free</button>
                </Link>
                <Link href="/auth/login" onClick={() => setMobileOpen(false)}>
                  <button style={{ width: '100%', padding: '16px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#ffffff', fontSize: '16px', fontFamily: 'var(--font-dm-sans)', cursor: 'pointer' }}>Sign in</button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}