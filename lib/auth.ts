import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { Database } from './supabase/database.types'
import { createClient } from '@/lib/supabase/server'
import { Roles } from './constants'

function getCookieStore() {
  return cookies()
}

function createSupabaseClient() {
  const cookieStore = getCookieStore()
  return createClient()
}
export async function getCurrentUser() {
  const supabase =await createSupabaseClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) return null
  return user
}

export async function getCurrentProfile() {
  const supabase =  await createClient()
  const user = await getCurrentUser()
  if (!user) return null
  const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (error) return null
  return profile
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) redirect('/auth/signin')
  return user
}

export async function requireRole(allowedRoles: Roles[]) {
  const profile = await getCurrentProfile()
  if (!profile || !allowedRoles.includes(profile.role as Roles)) redirect('/unauthorized')
  return profile
}
