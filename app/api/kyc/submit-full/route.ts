import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { user_id, selfie_base64, id_front_base64, id_back_base64, proof_base64, ...formData } = body

    const supabase = await createAdminClient()

    const uploadImage = async (base64: string, path: string) => {
      if (!base64) return null
      const bytes = Buffer.from(base64.replace(/^data:image\/\w+;base64,/, ''), 'base64')
      await supabase.storage.from('kyc-documents').upload(path, bytes, { contentType: 'image/jpeg', upsert: true })
      const { data: { publicUrl } } = supabase.storage.from('kyc-documents').getPublicUrl(path)
      return publicUrl
    }

    const [selfieUrl, idFrontUrl, idBackUrl, proofUrl] = await Promise.all([
      uploadImage(selfie_base64, `kyc/full/${user_id}_selfie.jpg`),
      uploadImage(id_front_base64, `kyc/full/${user_id}_id_front.jpg`),
      uploadImage(id_back_base64, `kyc/full/${user_id}_id_back.jpg`),
      uploadImage(proof_base64, `kyc/full/${user_id}_proof.jpg`),
    ])

    await supabase.from('kyc_verifications').upsert({
      user_id, kyc_type: 'full_kyc', status: 'pending',
      ...formData,
      selfie_url: selfieUrl,
      id_front_url: idFrontUrl,
      id_back_url: idBackUrl,
      proof_of_address_url: proofUrl,
    }, { onConflict: 'user_id' })

    await supabase.from('profiles').update({ kyc_status: 'pending' }).eq('id', user_id)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}