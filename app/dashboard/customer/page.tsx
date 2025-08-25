import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Order } from '@/app/types/order'
import CustomerDashboardClient from '@/components/dashboard/customer'

export default async function CustomerDashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/auth/signin')
  }

  const { data: orders, error } = await supabase
    .from('orders')
    .select(
      `
      *,
      order_items (
        quantity,
        price,
        menu_items (name, image_url)
      )
      `
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false }) as { data: Order[] | null, error: any }

  if (error) {
    // Optional: handle server errors or pass empty orders
    return <div>Failed to load orders</div>
  }

  return (
    <CustomerDashboardClient user={user} initialOrders={orders || []} />
  )
}
