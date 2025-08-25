import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { Roles } from '../constants'

export const createClient = (request: NextRequest) => {
  let supabaseResponse = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  return { supabase, supabaseResponse }
}

export async function updateSession(request: NextRequest) {
  try {
    const { supabase, supabaseResponse } = createClient(request)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    
    const pathname = request.nextUrl.pathname

    if (!user && (pathname.startsWith('/dashboard') || pathname.startsWith('/order/checkout'))) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/signin'
      return NextResponse.redirect(url)
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user?.id)
      .single()

    if (pathname.startsWith('/dashboard/manager') && profile?.role !== Roles.Manager) {
      const url = request.nextUrl.clone()
      url.pathname = '/unauthorized'
      return NextResponse.redirect(url)
    }

    if (pathname.startsWith('/dashboard/customer') && profile?.role !== Roles.Customer) {
      const url = request.nextUrl.clone()
      url.pathname = '/unauthorized'
      return NextResponse.redirect(url)
    }

    if (pathname.startsWith('/dashboard/employee') && profile?.role !== Roles.Employee) {
      const url = request.nextUrl.clone()
      url.pathname = '/unauthorized'
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  } catch (error) {
    return NextResponse.next({ request: { headers: request.headers } })
  }
}
