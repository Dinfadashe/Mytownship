import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { NewShipmentForm } from '@/components/logistics/new-shipment-form'
import { TrackShipment } from '@/components/logistics/track-shipment'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Package, MapPin, Clock, CheckCircle2, Truck } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Logistics & Delivery' }

export default async function LogisticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let profile = null
  if (user) {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    profile = data
  }

  // User's recent shipments
  let recentShipments = null
  if (user) {
    const { data } = await supabase
      .from('shipments')
      .select('*, shipment_events(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)
    recentShipments = data
  }

  const statusColors: Record<string, string> = {
    pending:           'bg-yellow-100 text-yellow-700 border-yellow-200',
    picked_up:         'bg-blue-100 text-blue-700 border-blue-200',
    in_transit:        'bg-blue-100 text-blue-700 border-blue-200',
    out_for_delivery:  'bg-orange-100 text-orange-700 border-orange-200',
    delivered:         'bg-green-100 text-green-700 border-green-200',
    failed:            'bg-red-100 text-red-700 border-red-200',
    returned:          'bg-gray-100 text-gray-700 border-gray-200',
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar profile={profile} />

      {/* Hero */}
      <div className="bg-gradient-to-b from-amber-500/10 to-transparent border-b">
        <div className="container mx-auto px-4 py-10">
          <div className="flex items-center gap-3 mb-2">
            <Package size={24} className="text-amber-600" />
            <h1 className="font-sora text-2xl font-bold">Logistics & Delivery</h1>
          </div>
          <p className="text-muted-foreground">
            Ship packages door-to-door across Nigeria. Real-time tracking, competitive rates.
          </p>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-muted/20 border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Package, label: 'Create shipment', color: 'text-amber-600' },
              { icon: MapPin, label: 'Pickup arranged', color: 'text-blue-600' },
              { icon: Truck, label: 'In transit', color: 'text-purple-600' },
              { icon: CheckCircle2, label: 'Delivered', color: 'text-green-600' },
            ].map(({ icon: Icon, label, color }, i) => (
              <div key={label} className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full bg-muted flex items-center justify-center ${color} text-xs font-bold`}>
                    {i + 1}
                  </div>
                  <div>
                    <Icon size={14} className={color} />
                  </div>
                  <span className="text-sm font-medium">{label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="new">
          <TabsList className="mb-6">
            <TabsTrigger value="new">New Shipment</TabsTrigger>
            <TabsTrigger value="track">Track Package</TabsTrigger>
            {user && <TabsTrigger value="history">My Shipments</TabsTrigger>}
          </TabsList>

          <TabsContent value="new">
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <NewShipmentForm userId={user?.id || null} />
              </div>
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-5 space-y-4">
                    <h3 className="font-sora font-semibold">Pricing Guide</h3>
                    <div className="space-y-2 text-sm">
                      {[
                        { range: 'Up to 1kg', price: '₦1,500' },
                        { range: '1kg – 5kg', price: '₦3,000' },
                        { range: '5kg – 20kg', price: '₦6,500' },
                        { range: '20kg+', price: 'Custom quote' },
                      ].map(({ range, price }) => (
                        <div key={range} className="flex justify-between py-1.5 border-b last:border-0">
                          <span className="text-muted-foreground">{range}</span>
                          <span className="font-medium">{price}</span>
                        </div>
                      ))}
                    </div>
                    <Badge className="w-full justify-center bg-purple-500/10 text-purple-600 border-purple-200 text-xs">
                      Pay with CHAR Token — 0% extra fees
                    </Badge>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="track">
            <TrackShipment />
          </TabsContent>

          {user && (
            <TabsContent value="history">
              <div className="space-y-3">
                {!recentShipments || recentShipments.length === 0 ? (
                  <div className="text-center py-12">
                    <Package size={32} className="mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">No shipments yet. Create your first one!</p>
                  </div>
                ) : (
                  recentShipments.map(shipment => (
                    <Card key={shipment.id}>
                      <CardContent className="p-4 flex items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-sm font-medium">{shipment.tracking_code}</span>
                            <Badge variant="outline" className={`text-xs ${statusColors[shipment.status]}`}>
                              {shipment.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {shipment.origin_city} → {shipment.dest_city}
                          </p>
                          {shipment.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">{shipment.description}</p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          {shipment.price && (
                            <p className="font-semibold text-sm">₦{shipment.price.toLocaleString()}</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {new Date(shipment.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  )
}
