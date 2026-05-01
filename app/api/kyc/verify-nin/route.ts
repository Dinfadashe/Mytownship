import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { nin, user_id } = await req.json()

    if (!nin || nin.replace(/\s/g,'').length !== 11) {
      return NextResponse.json({ error: 'NIN must be exactly 11 digits' }, { status: 400 })
    }

    const cleanNin = nin.replace(/\s/g,'')
    const apiKey = process.env.PREMBLY_API_KEY
    const appId  = process.env.PREMBLY_APP_ID

    if (apiKey && appId) {
      const res = await fetch('https://api.prembly.com/identitypass/verification/nin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'app-id': appId,
        },
        body: JSON.stringify({ number: cleanNin }),
      })
      const data = await res.json()
      if (!res.ok || !data.status) {
        return NextResponse.json({ verified: false, error: data.detail || 'NIN not found' }, { status: 200 })
      }
      const d = data.data || {}
      const supabase = await createAdminClient()
      await supabase.from('kyc_verifications').upsert({
        user_id, kyc_type: 'nin_selfie', status: 'pending',
        nin_number: cleanNin,
        nin_first_name: d.firstname || d.first_name || '',
        nin_last_name: d.lastname || d.surname || '',
        nin_date_of_birth: d.birthdate || d.date_of_birth || '',
        nin_phone: d.phone || d.phone1 || '',
        nin_verified: true, nin_response: data,
      }, { onConflict: 'user_id' })
      return NextResponse.json({ verified: true, first_name: d.firstname || d.first_name, last_name: d.lastname || d.surname, date_of_birth: d.birthdate, phone: d.phone || d.phone1, photo: d.photo })
    }

    // Demo mode — works without API keys
    const supabase = await createAdminClient()
    await supabase.from('kyc_verifications').upsert({
      user_id, kyc_type: 'nin_selfie', status: 'pending',
      nin_number: cleanNin, nin_first_name: 'Test', nin_last_name: 'User',
      nin_date_of_birth: '1990-01-01', nin_phone: '08012345678',
      nin_verified: true, nin_response: { demo: true, nin: cleanNin },
    }, { onConflict: 'user_id' })
    return NextResponse.json({ verified: true, first_name: 'Test', last_name: 'User', date_of_birth: '1990-01-01', phone: '08012345678', demo: true })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}