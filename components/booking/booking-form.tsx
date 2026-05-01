'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Calendar, Users, CreditCard, Coins, Loader2, Lock } from 'lucide-react'
import type { Hotel, Room } from '@/types/database'
import { toast } from 'sonner'

interface BookingFormProps {
  hotel: Hotel
  rooms: Room[]
  userId: string | null
}

export function BookingForm({ hotel, rooms, userId }: BookingFormProps) {
  const router = useRouter()
  const [form, setForm] = useState({
    room_id: '',
    check_in: '',
    check_out: '',
    guests: '1',
    payment_method: 'paystack' as const,
    special_requests: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }))

  const selectedRoom = rooms.find(r => r.id === form.room_id)

  const nights = form.check_in && form.check_out
    ? Math.max(0, Math.round(
        (new Date(form.check_out).getTime() - new Date(form.check_in).getTime()) / 86400000
      ))
    : 0

  const total = selectedRoom ? selectedRoom.price_per_night * nights : 0

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) { router.push('/auth/login'); return }
    if (!form.room_id || !form.check_in || !form.check_out) {
      setError('Please fill in all required fields')
      return
    }
    if (nights < 1) { setError('Check-out must be after check-in'); return }

    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: booking, error: bookErr } = await supabase
      .from('bookings')
      .insert({
        user_id: userId,
        hotel_id: hotel.id,
        room_id: form.room_id,
        check_in: form.check_in,
        check_out: form.check_out,
        guests: parseInt(form.guests),
        total_amount: total,
        currency: 'NGN',
        payment_method: form.payment_method,
        special_requests: form.special_requests || null,
        status: 'pending',
        payment_status: 'unpaid',
      })
      .select()
      .single()

    setLoading(false)

    if (bookErr) {
      setError(bookErr.message)
      return
    }

    toast.success('Booking created! Redirecting to payment...')
    router.push(`/booking/${booking.id}`)
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="font-sora text-lg">Reserve a room</CardTitle>
        <p className="text-sm text-muted-foreground">{hotel.name}</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleBook} className="space-y-4">
          {error && (
            <Alert variant="destructive" className="py-2">
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}

          {!userId && (
            <Alert className="py-2 border-primary/30 bg-primary/5">
              <AlertDescription className="text-sm">
                <a href="/auth/login" className="font-medium text-primary underline">Sign in</a> to complete your booking
              </AlertDescription>
            </Alert>
          )}

          {/* Room select */}
          <div className="space-y-1.5">
            <Label className="text-sm">Room type</Label>
            <Select value={form.room_id} onValueChange={v => set('room_id', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a room..." />
              </SelectTrigger>
              <SelectContent>
                {rooms.map(r => (
                  <SelectItem key={r.id} value={r.id}>
                    <span className="capitalize">{r.room_type}</span>
                    {' — '}₦{r.price_per_night.toLocaleString()}/night
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm flex items-center gap-1.5">
                <Calendar size={12} /> Check-in
              </Label>
              <Input
                type="date"
                value={form.check_in}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => set('check_in', e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm flex items-center gap-1.5">
                <Calendar size={12} /> Check-out
              </Label>
              <Input
                type="date"
                value={form.check_out}
                min={form.check_in || new Date().toISOString().split('T')[0]}
                onChange={e => set('check_out', e.target.value)}
                required
              />
            </div>
          </div>

          {/* Guests */}
          <div className="space-y-1.5">
            <Label className="text-sm flex items-center gap-1.5">
              <Users size={12} /> Guests
            </Label>
            <Select value={form.guests} onValueChange={v => set('guests', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map(n => (
                  <SelectItem key={n} value={String(n)}>{n} guest{n !== 1 ? 's' : ''}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Payment method */}
          <div className="space-y-1.5">
            <Label className="text-sm flex items-center gap-1.5">
              <CreditCard size={12} /> Payment method
            </Label>
            <Select value={form.payment_method} onValueChange={v => set('payment_method', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paystack">Paystack (Card/Bank)</SelectItem>
                <SelectItem value="flutterwave">Flutterwave</SelectItem>
                <SelectItem value="char_token">
                  <span className="flex items-center gap-1.5">
                    <Coins size={12} className="text-purple-500" />
                    Charity Token (CHAR) — 0% fee
                  </span>
                </SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {form.payment_method === 'char_token' && (
            <Badge className="w-full justify-center bg-purple-500/10 text-purple-600 border-purple-200">
              <Coins size={12} className="mr-1" /> CHAR payment — zero transaction fees!
            </Badge>
          )}

          {/* Special requests */}
          <div className="space-y-1.5">
            <Label className="text-sm">Special requests (optional)</Label>
            <Textarea
              placeholder="Early check-in, dietary needs..."
              value={form.special_requests}
              onChange={e => set('special_requests', e.target.value)}
              className="resize-none"
              rows={2}
            />
          </div>

          {/* Price breakdown */}
          {selectedRoom && nights > 0 && (
            <div className="bg-muted/50 rounded-lg p-3 space-y-1.5">
              <Separator className="my-1" />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  ₦{selectedRoom.price_per_night.toLocaleString()} × {nights} night{nights !== 1 ? 's' : ''}
                </span>
                <span>₦{(selectedRoom.price_per_night * nights).toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span className="text-primary font-sora">₦{total.toLocaleString()}</span>
              </div>
            </div>
          )}

          <Button type="submit" disabled={loading || !userId} className="w-full gap-2">
            {loading
              ? <><Loader2 size={16} className="animate-spin" /> Processing...</>
              : <><Lock size={14} /> Book Now</>
            }
          </Button>

          <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
            <Lock size={10} /> Secured by Supabase
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
