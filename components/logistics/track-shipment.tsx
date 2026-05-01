'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, Package, MapPin, CheckCircle2, Truck, Clock } from 'lucide-react'
import type { ShipmentWithEvents } from '@/types/database'

const STATUS_STEPS = ['pending','picked_up','in_transit','out_for_delivery','delivered']

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending:          { label: 'Pending',            color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: <Clock size={14} /> },
  picked_up:        { label: 'Picked Up',          color: 'bg-blue-100 text-blue-700 border-blue-200',   icon: <Package size={14} /> },
  in_transit:       { label: 'In Transit',         color: 'bg-blue-100 text-blue-700 border-blue-200',   icon: <Truck size={14} /> },
  out_for_delivery: { label: 'Out for Delivery',   color: 'bg-orange-100 text-orange-700 border-orange-200', icon: <MapPin size={14} /> },
  delivered:        { label: 'Delivered',          color: 'bg-green-100 text-green-700 border-green-200', icon: <CheckCircle2 size={14} /> },
  failed:           { label: 'Failed',             color: 'bg-red-100 text-red-700 border-red-200',      icon: <Package size={14} /> },
  returned:         { label: 'Returned',           color: 'bg-gray-100 text-gray-700 border-gray-200',   icon: <Package size={14} /> },
}

export function TrackShipment() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [shipment, setShipment] = useState<ShipmentWithEvents | null>(null)
  const [notFound, setNotFound] = useState(false)

  const handleTrack = async () => {
    if (!code.trim()) return
    setLoading(true)
    setNotFound(false)
    setShipment(null)

    const supabase = createClient()
    const { data } = await supabase
      .from('shipments')
      .select('*, shipment_events(*)')
      .eq('tracking_code', code.trim().toUpperCase())
      .single()

    setLoading(false)
    if (!data) { setNotFound(true); return }
    setShipment(data as ShipmentWithEvents)
  }

  const currentStepIdx = shipment ? STATUS_STEPS.indexOf(shipment.status) : -1

  return (
    <div className="max-w-xl">
      <Card className="mb-6">
        <CardContent className="p-5">
          <div className="flex gap-3">
            <Input
              placeholder="Enter tracking code (e.g. MT1A2B3C)"
              value={code}
              onChange={e => setCode(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleTrack()}
              className="font-mono"
            />
            <Button onClick={handleTrack} disabled={loading} className="gap-2">
              <Search size={14} />
              Track
            </Button>
          </div>
        </CardContent>
      </Card>

      {notFound && (
        <Card>
          <CardContent className="p-6 text-center">
            <Package size={32} className="mx-auto text-muted-foreground mb-2" />
            <p className="font-medium">Shipment not found</p>
            <p className="text-sm text-muted-foreground">Check the tracking code and try again</p>
          </CardContent>
        </Card>
      )}

      {shipment && (
        <Card>
          <CardContent className="p-5 space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono font-bold text-lg">{shipment.tracking_code}</p>
                <p className="text-sm text-muted-foreground">
                  {shipment.origin_city} → {shipment.dest_city}
                </p>
              </div>
              <Badge variant="outline" className={statusConfig[shipment.status]?.color || ''}>
                {statusConfig[shipment.status]?.label || shipment.status}
              </Badge>
            </div>

            {/* Progress bar */}
            {STATUS_STEPS.includes(shipment.status) && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  {STATUS_STEPS.map((step, i) => (
                    <div key={step} className="flex items-center flex-1">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 transition-colors
                        ${i <= currentStepIdx
                          ? 'bg-primary text-white'
                          : 'bg-muted text-muted-foreground'
                        }`}>
                        {i < currentStepIdx ? <CheckCircle2 size={14} /> : i + 1}
                      </div>
                      {i < STATUS_STEPS.length - 1 && (
                        <div className={`h-0.5 flex-1 mx-1 ${i < currentStepIdx ? 'bg-primary' : 'bg-muted'}`} />
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Pending</span>
                  <span>Picked Up</span>
                  <span>In Transit</span>
                  <span>Out</span>
                  <span>Delivered</span>
                </div>
              </div>
            )}

            {/* Details */}
            {shipment.description && (
              <div className="text-sm">
                <span className="text-muted-foreground">Contents: </span>
                {shipment.description}
              </div>
            )}

            {/* Events timeline */}
            {shipment.shipment_events && shipment.shipment_events.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-3">Tracking History</h4>
                <div className="space-y-3">
                  {[...shipment.shipment_events]
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .map((event, i) => (
                    <div key={event.id} className="flex gap-3">
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${i === 0 ? 'bg-primary' : 'bg-muted-foreground/40'}`} />
                      <div>
                        <p className="text-sm font-medium capitalize">{event.status.replace('_', ' ')}</p>
                        {event.location && <p className="text-xs text-muted-foreground">{event.location}</p>}
                        {event.notes && <p className="text-xs text-muted-foreground">{event.notes}</p>}
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(event.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
