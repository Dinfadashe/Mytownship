'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Package } from 'lucide-react'
import { toast } from 'sonner'

const NIGERIAN_CITIES = [
  'Abuja','Lagos','Port Harcourt','Kano','Ibadan','Kaduna','Jos','Benin City',
  'Enugu','Aba','Uyo','Warri','Calabar','Maiduguri','Sokoto','Ilorin','Osogbo',
]

function generateTrackingCode() {
  return 'MT' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase()
}

interface NewShipmentFormProps { userId: string | null }

export function NewShipmentForm({ userId }: NewShipmentFormProps) {
  const router = useRouter()
  const [form, setForm] = useState({
    description: '',
    weight_kg: '',
    origin_address: '',
    origin_city: '',
    dest_address: '',
    dest_city: '',
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) { router.push('/auth/login'); return }

    setLoading(true)
    setError('')

    const tracking_code = generateTrackingCode()

    const supabase = createClient()
    const { data: shipment, error: err } = await supabase
      .from('shipments')
      .insert({
        user_id: userId,
        tracking_code,
        description: form.description || null,
        weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
        origin_address: form.origin_address,
        origin_city: form.origin_city,
        dest_address: form.dest_address,
        dest_city: form.dest_city,
        notes: form.notes || null,
        status: 'pending',
        currency: 'NGN',
      })
      .select()
      .single()

    setLoading(false)

    if (err) { setError(err.message); return }

    // Create initial event
    await supabase.from('shipment_events').insert({
      shipment_id: shipment.id,
      status: 'pending',
      location: form.origin_city,
      notes: 'Shipment created, awaiting pickup',
    })

    toast.success(`Shipment created! Tracking: ${tracking_code}`)
    router.push('/dashboard/bookings')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-sora flex items-center gap-2">
          <Package size={18} className="text-amber-600" />
          New Shipment
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <Alert variant="destructive" className="py-2">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!userId && (
            <Alert className="py-2 border-primary/30 bg-primary/5">
              <AlertDescription className="text-sm">
                <a href="/auth/login" className="font-medium text-primary underline">Sign in</a> to create a shipment
              </AlertDescription>
            </Alert>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Item description</Label>
              <Input placeholder="e.g. Electronics, Clothing..." value={form.description} onChange={e => set('description', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Weight (kg)</Label>
              <Input type="number" step="0.1" min="0.1" placeholder="2.5" value={form.weight_kg} onChange={e => set('weight_kg', e.target.value)} />
            </div>
          </div>

          <div className="border rounded-lg p-4 space-y-3">
            <h4 className="font-medium text-sm">Pickup (Origin)</h4>
            <div className="space-y-1.5">
              <Label>Address</Label>
              <Input placeholder="12 Main Street, Garki" value={form.origin_address} onChange={e => set('origin_address', e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>City</Label>
              <Select value={form.origin_city} onValueChange={v => set('origin_city', v)} required>
                <SelectTrigger><SelectValue placeholder="Select city..." /></SelectTrigger>
                <SelectContent>
                  {NIGERIAN_CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border rounded-lg p-4 space-y-3">
            <h4 className="font-medium text-sm">Delivery (Destination)</h4>
            <div className="space-y-1.5">
              <Label>Address</Label>
              <Input placeholder="45 Palm Avenue, Victoria Island" value={form.dest_address} onChange={e => set('dest_address', e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>City</Label>
              <Select value={form.dest_city} onValueChange={v => set('dest_city', v)} required>
                <SelectTrigger><SelectValue placeholder="Select city..." /></SelectTrigger>
                <SelectContent>
                  {NIGERIAN_CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Notes (optional)</Label>
            <Textarea placeholder="Fragile, handle with care..." value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} className="resize-none" />
          </div>

          <Button type="submit" disabled={loading || !userId} className="w-full">
            {loading && <Loader2 size={16} className="mr-2 animate-spin" />}
            Create Shipment
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
