'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Star, X } from 'lucide-react'

interface HotelFiltersProps {
  cities: string[]
  currentParams: Record<string, string | undefined>
}

export function HotelFilters({ cities, currentParams }: HotelFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`/hotels?${params.toString()}`)
  }

  const clearAll = () => router.push('/hotels')
  const hasFilters = currentParams.city || currentParams.stars

  return (
    <div className="space-y-5 sticky top-24">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Filters</h3>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearAll} className="h-7 text-xs text-muted-foreground">
            <X size={12} className="mr-1" /> Clear all
          </Button>
        )}
      </div>

      {/* City */}
      {cities.length > 0 && (
        <div>
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3 block">City</Label>
          <div className="space-y-1.5">
            {cities.map(city => (
              <button
                key={city}
                onClick={() => updateFilter('city', currentParams.city === city ? null : city)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors
                  ${currentParams.city === city
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'hover:bg-muted text-foreground'
                  }`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>
      )}

      <Separator />

      {/* Star rating */}
      <div>
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3 block">Star Rating</Label>
        <div className="space-y-1.5">
          {[5, 4, 3, 2, 1].map(stars => (
            <button
              key={stars}
              onClick={() => updateFilter('stars', currentParams.stars === String(stars) ? null : String(stars))}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors
                ${currentParams.stars === String(stars)
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-muted text-foreground'
                }`}
            >
              <div className="flex">
                {Array.from({ length: stars }).map((_, i) => (
                  <Star key={i} size={12} className="fill-yellow-400 stroke-yellow-400" />
                ))}
              </div>
              <span>{stars} star{stars !== 1 ? 's' : ''}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
