import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Hotel, MapPin, Star, Wifi, Car, Coffee } from 'lucide-react'
import type { Hotel as HotelType } from '@/types/database'

interface HotelCardProps {
  hotel: HotelType & { rooms?: Array<{ price_per_night: number; is_available: boolean }> }
}

const amenityIcons: Record<string, React.ReactNode> = {
  wifi: <Wifi size={12} />,
  parking: <Car size={12} />,
  breakfast: <Coffee size={12} />,
}

export function HotelCard({ hotel }: HotelCardProps) {
  const availableRooms = hotel.rooms?.filter(r => r.is_available) || []
  const lowestPrice = availableRooms.length > 0
    ? Math.min(...availableRooms.map(r => r.price_per_night))
    : null

  return (
    <Link href={`/hotels/${hotel.id}`}>
      <Card className="overflow-hidden group hover:shadow-lg transition-all duration-200 cursor-pointer h-full">
        {/* Image */}
        <div className="relative h-48 bg-muted overflow-hidden">
          {hotel.cover_image ? (
            <img
              src={hotel.cover_image}
              alt={hotel.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/15 to-secondary/15 flex items-center justify-center">
              <Hotel size={40} className="text-primary/30" />
            </div>
          )}

          {/* Star rating */}
          {hotel.star_rating && (
            <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
              <Star size={10} className="fill-yellow-400 stroke-yellow-400" />
              <span>{hotel.star_rating}</span>
            </div>
          )}

          {/* Available badge */}
          {availableRooms.length > 0 ? (
            <div className="absolute bottom-2 left-2">
              <Badge className="bg-green-600/90 text-white text-xs">
                {availableRooms.length} room{availableRooms.length !== 1 ? 's' : ''} available
              </Badge>
            </div>
          ) : (
            <div className="absolute bottom-2 left-2">
              <Badge variant="secondary" className="text-xs">Fully booked</Badge>
            </div>
          )}
        </div>

        <CardContent className="p-4">
          <h3 className="font-sora font-semibold text-base truncate mb-1">{hotel.name}</h3>
          <p className="text-sm text-muted-foreground flex items-center gap-1 mb-3">
            <MapPin size={12} className="shrink-0" />
            {hotel.city}, {hotel.state}
          </p>

          {/* Amenities */}
          {hotel.amenities && hotel.amenities.length > 0 && (
            <div className="flex items-center gap-1.5 mb-3 flex-wrap">
              {hotel.amenities.slice(0, 3).map(a => (
                <Badge key={a} variant="outline" className="text-xs gap-1 py-0 px-2">
                  {amenityIcons[a.toLowerCase()] || null}
                  {a}
                </Badge>
              ))}
              {hotel.amenities.length > 3 && (
                <span className="text-xs text-muted-foreground">+{hotel.amenities.length - 3} more</span>
              )}
            </div>
          )}

          {/* Price */}
          <div className="flex items-center justify-between pt-2 border-t">
            {lowestPrice ? (
              <div>
                <span className="text-xs text-muted-foreground">From </span>
                <span className="font-sora font-bold text-primary">
                  ₦{lowestPrice.toLocaleString()}
                </span>
                <span className="text-xs text-muted-foreground">/night</span>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">Contact for pricing</span>
            )}
            <span className="text-xs text-primary font-medium">View →</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
