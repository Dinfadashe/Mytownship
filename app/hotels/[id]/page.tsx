import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { BookingForm } from '@/components/booking/booking-form'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Hotel, MapPin, Star, Wifi, Car, Coffee, Waves, Dumbbell,
  ArrowLeft, CheckCircle2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Metadata } from 'next'

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('hotels').select('name, city').eq('id', id).single()
  return { title: data ? `${data.name} — ${data.city}` : 'Hotel' }
}

const amenityIcons: Record<string, { icon: React.ReactNode; label: string }> = {
  wifi:       { icon: <Wifi size={16} />,      label: 'Free WiFi' },
  parking:    { icon: <Car size={16} />,       label: 'Free Parking' },
  breakfast:  { icon: <Coffee size={16} />,    label: 'Breakfast' },
  pool:       { icon: <Waves size={16} />,     label: 'Swimming Pool' },
  gym:        { icon: <Dumbbell size={16} />,  label: 'Gym/Fitness' },
}

export default async function HotelDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  let profile = null
  if (user) {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    profile = data
  }

  const { data: hotel } = await supabase
    .from('hotels')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .single()

  if (!hotel) notFound()

  const { data: rooms } = await supabase
    .from('rooms')
    .select('*')
    .eq('hotel_id', id)
    .eq('is_available', true)
    .order('price_per_night')

  const { data: reviews } = await supabase
    .from('reviews')
    .select('*, profiles(full_name, avatar_url)')
    .eq('hotel_id', id)
    .order('created_at', { ascending: false })
    .limit(5)

  const avgRating = reviews && reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null

  return (
    <div className="min-h-screen bg-background">
      <Navbar profile={profile} />

      {/* Back */}
      <div className="container mx-auto px-4 py-4">
        <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
          <Link href="/hotels" className="flex items-center gap-1.5">
            <ArrowLeft size={14} /> Back to hotels
          </Link>
        </Button>
      </div>

      {/* Hero image */}
      <div className="container mx-auto px-4 mb-6">
        <div className="relative rounded-2xl overflow-hidden h-64 md:h-80 bg-muted">
          {hotel.cover_image ? (
            <img src={hotel.cover_image} alt={hotel.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <Hotel size={60} className="text-primary/30" />
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 pb-16">
        <div className="grid lg:grid-cols-3 gap-8">

          {/* Left col — hotel info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-start justify-between gap-4 mb-2">
                <h1 className="font-sora text-2xl md:text-3xl font-bold">{hotel.name}</h1>
                {hotel.star_rating && (
                  <div className="flex items-center gap-1 shrink-0 bg-yellow-50 dark:bg-yellow-950 px-3 py-1.5 rounded-lg">
                    {Array.from({ length: hotel.star_rating }).map((_, i) => (
                      <Star key={i} size={14} className="fill-yellow-400 stroke-yellow-400" />
                    ))}
                  </div>
                )}
              </div>
              <p className="text-muted-foreground flex items-center gap-1.5">
                <MapPin size={14} />
                {hotel.address}, {hotel.city}, {hotel.state}, {hotel.country}
              </p>
              {avgRating && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-lg">
                    <Star size={12} className="fill-primary" />
                    <span className="text-sm font-semibold">{avgRating}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {reviews?.length} review{reviews?.length !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>

            <Separator />

            {/* Description */}
            {hotel.description && (
              <div>
                <h2 className="font-sora font-semibold mb-2">About this hotel</h2>
                <p className="text-muted-foreground leading-relaxed text-sm">{hotel.description}</p>
              </div>
            )}

            {/* Amenities */}
            {hotel.amenities && hotel.amenities.length > 0 && (
              <div>
                <h2 className="font-sora font-semibold mb-3">Amenities</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {hotel.amenities.map(a => {
                    const info = amenityIcons[a.toLowerCase()]
                    return (
                      <div key={a} className="flex items-center gap-2.5 p-3 rounded-lg bg-muted/60">
                        <div className="text-primary">{info?.icon || <CheckCircle2 size={16} />}</div>
                        <span className="text-sm">{info?.label || a}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Available rooms */}
            {rooms && rooms.length > 0 && (
              <div>
                <h2 className="font-sora font-semibold mb-3">Available Rooms</h2>
                <div className="space-y-3">
                  {rooms.map(room => (
                    <Card key={room.id}>
                      <CardContent className="p-4 flex items-center justify-between gap-4">
                        <div>
                          <p className="font-medium capitalize">{room.room_type} Room</p>
                          {room.description && (
                            <p className="text-sm text-muted-foreground mt-0.5">{room.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1.5">
                            <Badge variant="outline" className="text-xs">
                              {room.capacity} guest{room.capacity !== 1 ? 's' : ''}
                            </Badge>
                            {room.amenities?.slice(0, 2).map(a => (
                              <Badge key={a} variant="outline" className="text-xs">{a}</Badge>
                            ))}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-sora font-bold text-lg text-primary">
                            ₦{room.price_per_night.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">per night</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            {reviews && reviews.length > 0 && (
              <div>
                <h2 className="font-sora font-semibold mb-3">Guest Reviews</h2>
                <div className="space-y-3">
                  {reviews.map(review => (
                    <Card key={review.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-sm">
                            {(review as any).profiles?.full_name || 'Guest'}
                          </p>
                          <div className="flex">
                            {Array.from({ length: review.rating }).map((_, i) => (
                              <Star key={i} size={12} className="fill-yellow-400 stroke-yellow-400" />
                            ))}
                          </div>
                        </div>
                        {review.title && <p className="text-sm font-medium mb-1">{review.title}</p>}
                        {review.body && <p className="text-sm text-muted-foreground">{review.body}</p>}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right col — booking form */}
          <div>
            <div className="sticky top-24">
              <BookingForm hotel={hotel} rooms={rooms || []} userId={user?.id || null} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
