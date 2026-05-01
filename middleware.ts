import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // Public paths — no auth needed
  const publicPaths = ['/', '/hotels', '/logistics', '/marketplace', '/auth/login', '/auth/register', '/auth/forgot-password', '/auth/callback']
  const isPublic = publicPaths.some(p => path === p || path.startsWith('/hotels/') || path.startsWith('/api/'))

  // Not logged in — redirect to login for protected paths
  if (!user && (path.startsWith('/dashboard') || path.startsWith('/apply') || path.startsWith('/verify'))) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Logged in — check KYC for dashboard and apply pages
  if (user && (path.startsWith('/dashboard') || path.startsWith('/apply'))) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('kyc_status, role')
      .eq('id', user.id)
      .single()

    // Admins bypass KYC gate
    if (profile?.role === 'admin') return supabaseResponse

    // Unverified users — send to verify page
    if (!profile?.kyc_status || profile.kyc_status === 'unverified') {
      return NextResponse.redirect(new URL('/verify', request.url))
    }

    // Pending/manual review — only block /apply routes, allow /dashboard
    if ((profile?.kyc_status === 'pending' || profile?.kyc_status === 'manual_review') && path.startsWith('/apply')) {
      return NextResponse.redirect(new URL('/dashboard/bookings', request.url))
    }

    // Rejected — send back to verify
    if (profile?.kyc_status === 'rejected') {
      return NextResponse.redirect(new URL('/verify', request.url))
    }
  }

  // Logged in — redirect away from auth pages
  if (user && (path.startsWith('/auth/login') || path.startsWith('/auth/register'))) {
    return NextResponse.redirect(new URL('/dashboard/bookings', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}