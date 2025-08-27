import { requireRole } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ShoppingBag, Users, DollarSign, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import toast from 'react-hot-toast'
import CustomerInvoiceTable from '@/components/dashboard/customer-invoices'
import MenuManagement from '@/components/dashboard/menu-management'
import OrderQueue from '@/components/dashboard/order-queue'
import { Badge } from '@/components/ui/badge'
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
    { count: totalCustomers },
    { data: customers }
  ] = await Promise.all([
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', new Date().toISOString().split('T')[0]),
    supabase.from('orders').select('total,created_at').eq('status', 'completed'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer'),
    supabase.from('profiles').select('id,full_name,email').eq('role', 'customer')
  ])

  const totalRevenue = revenueData?.reduce((sum, order) => sum + order.total, 0) || 0
  const todayRevenue = revenueData?.filter(order => 
    new Date(order.created_at).toDateString() === new Date().toDateString()
  ).reduce((sum, order) => sum + order.total, 0) || 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-amber-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-1">Manager Dashboard</h1>
          <p className="text-gray-600">Manage your bakery operations</p>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {[{
            icon: <ShoppingBag className="w-6 h-6 text-blue-600" />,
            title: 'Total Orders',
            value: totalOrders || 0,
            bg: 'bg-blue-100'
          }, {
            icon: <TrendingUp className="w-6 h-6 text-green-600" />,
            title: "Today's Orders",
            value: todayOrders || 0,
            bg: 'bg-green-100'
          }, {
            icon: <DollarSign className="w-6 h-6 text-rose-600" />,
            title: 'Total Revenue',
            value: `$${totalRevenue.toFixed(2)}`,
            bg: 'bg-rose-100'
          }, {
            icon: <Users className="w-6 h-6 text-amber-600" />,
            title: 'Total Customers',
            value: totalCustomers || 0,
            bg: 'bg-amber-100'
          }].map(({ icon, title, value, bg }) => (
            <Card key={title} className="shadow-md hover:shadow-lg transition-shadow">
              <CardContent className={`flex items-center p-6 ${bg} rounded-lg`}>
                <div className="p-3 rounded-full bg-white mr-4 flex items-center justify-center">
                  {icon}
                </div>
                <div>
                  <p className="text-gray-600 text-sm">{title}</p>
                  <p className="text-xl font-semibold text-gray-900">{value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Management Tabs */}
        <Tabs defaultValue="customers" className="bg-white rounded-lg shadow-md">
          <TabsList
            className="grid grid-cols-3 border-b border-gray-200 rounded-t-lg overflow-hidden"
            aria-label="Manager dashboard navigation tabs"
          >
            <TabsTrigger
              value="orders"
              className="text-center py-3 font-semibold text-gray-700 hover:bg-gray-50 focus-visible:bg-gray-100 data-[state=active]:bg-rose-100 data-[state=active]:text-rose-700"
            >
              Order Queue
            </TabsTrigger>
            <TabsTrigger
              value="menu"
              className="text-center py-3 font-semibold text-gray-700 hover:bg-gray-50 focus-visible:bg-gray-100 data-[state=active]:bg-rose-100 data-[state=active]:text-rose-700"
            >
              Menu Management
            </TabsTrigger>
            <TabsTrigger
              value="customers"
              className="text-center py-3 font-semibold text-gray-700 hover:bg-gray-50 focus-visible:bg-gray-100 data-[state=active]:bg-rose-100 data-[state=active]:text-rose-700"
            >
              Customer Invoices
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="p-6">
            <OrderQueue />
          </TabsContent>

          <TabsContent value="menu" className="p-6">
            <MenuManagement />
          </TabsContent>

          <TabsContent value="customers" className="p-6">
            <CustomerInvoiceTable customers={customers || []} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
