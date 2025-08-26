import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { EmailOtpType } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = (searchParams.get('type') as EmailOtpType) ?? null
  const nextUrl = searchParams.get('next') ?? '/dashboard/customer'

  if (!token_hash || !type) {
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.verifyOtp({ type, token_hash })

  const url = new URL(nextUrl, request.url)

  if (error) {
    url.searchParams.set('error', encodeURIComponent(error.message))
  } else {
    url.searchParams.set('success', 'true')
  }

  return NextResponse.redirect(url)
}