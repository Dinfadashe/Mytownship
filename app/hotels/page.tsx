import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { HotelCard } from '@/components/hotel/hotel-card'
import { HotelFilters } from '@/components/hotel/hotel-filters'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Hotel, Search, SlidersHorizontal } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Hotels' }

interface SearchParams {
  city?: string
  min_price?: string
  max_price?: string
  stars?: string
  q?: string
}

export default async function HotelsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  let profile = null
  if (user) {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    profile = data
  }

  // Build query
  let query = supabase
    .from('hotels')
    .select('*, rooms(id, price_per_night, room_type, is_available)')
    .eq('is_active', true)

  if (params.city) query = query.ilike('city', `%${params.city}%`)
  if (params.stars) query = query.eq('star_rating', parseInt(params.stars))
  if (params.q) query = query.ilike('name', `%${params.q}%`)

  const { data: hotels } = await query.order('created_at', { ascending: false })

  // Get unique cities for filter
  const { data: cities } = await supabase
    .from('hotels')
    .select('city')
    .eq('is_active', true)

  const uniqueCities = [...new Set(cities?.map(h => h.city) || [])]

  return (
    <div className="min-h-screen bg-background">
      <Navbar profile={profile} />

      {/* Header */}
      <div className="bg-gradient-to-b from-primary/8 to-transparent border-b">
        <div className="container mx-auto px-4 py-10">
          <div className="flex items-center gap-3 mb-2">
            <Hotel size={24} className="text-primary" />
            <h1 className="font-sora text-2xl font-bold">Hotels</h1>
          </div>
          <p className="text-muted-foreground mb-6">
            Find and book the perfect hotel — {hotels?.length || 0} properties available
          </p>

          {/* Search bar */}
          <div className="flex gap-3 max-w-2xl">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <form>
                <Input
                  name="q"
                  defaultValue={params.q}
                  placeholder="Search hotels by name or city..."
                  className="pl-9"
                />
              </form>
            </div>
            <Button variant="outline" className="gap-2">
              <SlidersHorizontal size={16} /> Filters
            </Button>
          </div>

          {/* Active filters */}
          {(params.city || params.stars || params.q) && (
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className="text-sm text-muted-foreground">Filters:</span>
              {params.city && <Badge variant="secondary">{params.city}</Badge>}
              {params.stars && <Badge variant="secondary">{params.stars} stars</Badge>}
              {params.q && <Badge variant="secondary">"{params.q}"</Badge>}
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-6">
          {/* Sidebar filters */}
          <aside className="hidden lg:block w-60 shrink-0">
            <HotelFilters cities={uniqueCities} currentParams={params} />
          </aside>

          {/* Grid */}
          <main className="flex-1">
            {!hotels || hotels.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <Hotel size={28} className="text-muted-foreground" />
                </div>
                <h3 className="font-sora font-semibold text-lg mb-1">No hotels found</h3>
                <p className="text-muted-foreground text-sm">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {hotels.map(hotel => (
                  <HotelCard key={hotel.id} hotel={hotel} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
