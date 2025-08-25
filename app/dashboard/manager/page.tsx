import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import MenuManagement from '@/components/dashboard/menu-management'
import OrderQueue from '@/components/dashboard/order-queue'
import { ShoppingBag, Users, DollarSign, TrendingUp } from 'lucide-react'
import { cookies } from 'next/headers'
import { Roles } from '@/lib/constants'
import { createServerClient } from '@supabase/ssr'
export default async function ManagerDashboard() {
  await requireRole([Roles.Manager])
  
  const cookieStore = await cookies()
  const supabase =  await createClient()
  
  // Get dashboard stats
  const [
    { count: totalOrders },
    { count: todayOrders },
    { data: revenueData },
    { count: totalCustomers }
  ] = await Promise.all([
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', new Date().toISOString().split('T')[0]),
    supabase.from('orders').select('total,created_at').eq('status', 'completed'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer')
  ])

  const totalRevenue = revenueData?.reduce((sum, order) => sum + order.total, 0) || 0
  const todayRevenue = revenueData?.filter(order => 
    new Date(order.created_at).toDateString() === new Date().toDateString()
  ).reduce((sum, order) => sum + order.total, 0) || 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-amber-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Manager Dashboard</h1>
          <p className="text-gray-600">Manage your bakery operations</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-800">{totalOrders || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Today's Orders</p>
                  <p className="text-2xl font-bold text-gray-800">{todayOrders || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-rose-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-800">${totalRevenue.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Customers</p>
                  <p className="text-2xl font-bold text-gray-800">{totalCustomers || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Management Tabs */}
        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-white">
            <TabsTrigger value="orders">Order Queue</TabsTrigger>
            <TabsTrigger value="menu">Menu Management</TabsTrigger>
          </TabsList>
          
          <TabsContent value="orders">
            <OrderQueue />
          </TabsContent>
          
          <TabsContent value="menu">
            <MenuManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
