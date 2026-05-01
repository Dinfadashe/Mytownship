'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Hotel, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    setLoading(false)
    if (err) { setError(err.message); return }
    setSent(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[oklch(0.14_0.05_240)] via-[oklch(0.18_0.06_235)] to-[oklch(0.12_0.04_240)] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 mb-4">
            <Hotel size={28} className="text-white" />
          </div>
          <h1 className="font-sora text-2xl font-bold text-white">Reset password</h1>
          <p className="text-white/60 text-sm mt-1">We'll send a reset link to your email</p>
        </div>

        <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
          <CardContent className="pt-6">
            {sent ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 size={24} className="text-green-400" />
                </div>
                <p className="text-white font-medium mb-1">Check your email</p>
                <p className="text-white/60 text-sm">Reset link sent to <strong className="text-white">{email}</strong></p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive" className="py-2">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-1.5">
                  <Label className="text-white/80 text-sm">Email address</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:ring-white/30"
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-white text-[oklch(0.14_0.05_240)] hover:bg-white/90 font-semibold">
                  {loading && <Loader2 size={16} className="mr-2 animate-spin" />}
                  Send reset link
                </Button>
              </form>
            )}

            <div className="mt-4 text-center">
              <Link href="/auth/login" className="text-sm text-white/50 hover:text-white flex items-center justify-center gap-1.5 transition-colors">
                <ArrowLeft size={12} /> Back to sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
