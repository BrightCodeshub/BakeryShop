'use client'

import { useState, useEffect } from 'react'
import type { Order } from '@/app/types/order'
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client' // <- Must use client here!

function getStatusIcon(status: string) {
  switch (status) {
    case 'completed':
      return <CheckCircle className="w-4 h-4 text-green-600" />
    case 'cancelled':
      return <XCircle className="w-4 h-4 text-red-600" />
    default:
      return <Clock className="w-4 h-4 text-amber-600" />
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800'
    case 'cancelled':
      return 'bg-red-100 text-red-800'
    case 'preparing':
      return 'bg-blue-100 text-blue-800'
    case 'ready':
      return 'bg-purple-100 text-purple-800'
    default:
      return 'bg-amber-100 text-amber-800'
  }
}

interface Props {
  user: any
  initialOrders: Order[]
}

export default function CustomerDashboardClient({ initialOrders }: Props) {
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchOrders() {
      setLoading(true)
      setError(null)
      try {
        const supabase = createClient()
        // Fetch the user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
          window.location.href = '/auth/signin'
          return
        }
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (
              quantity,
              price,
              menu_items (name, image_url)
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) {
          setError(error.message)
          setOrders([])
        } else {
          setOrders(data || [])
        }
      } catch {
        setError('Failed to fetch orders.')
        setOrders([])
      }
      setLoading(false)
    }

    fetchOrders()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        Loading orders...
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <Card className="max-w-md w-full bg-red-50">
          <CardContent>
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 text-center mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} className="bg-red-600">
              Reload
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-amber-50 py-12">
      <div className="max-w-6xl px-4 mx-auto sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-800">My Orders</h1>
        <p className="text-gray-600 mb-8">Track your Sweet Dreams bakery orders</p>
        {orders.length > 0 ? (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order.id} className="hover:shadow-lg overflow-hidden transition-shadow">
                <CardHeader className="bg-white flex justify-between items-center p-4 rounded-t-lg">
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-800">
                      Order #{order.id.slice(0, 8)}
                    </CardTitle>
                    <p className="text-sm text-gray-600">
                      {new Date(order.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <Badge className={`${getStatusColor(order.status)}`}>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(order.status)}
                      <span className="capitalize">{order.status}</span>
                    </div>
                  </Badge>
                  <p className="text-lg font-bold text-rose-600">${order.total.toFixed(2)}</p>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {order.order_items.map((item, idx) => (
                      <div key={idx} className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gray-100 flex-shrink-0 rounded-lg overflow-hidden">
                          <img
                            src={
                              item.menu_items.image_url ??
                              'https://images.pexels.com/photos/1055270/pexels-photo-1055270.jpeg'
                            }
                            alt={item.menu_items.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-800">{item.menu_items.name}</h4>
                          <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                        </div>
                        <div className="text-right font-bold text-gray-800">
                          ${(item.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-gray-600 mb-6">No orders yet. Start by browsing our delicious menu!</p>
              <Link href="/menu" passHref legacyBehavior>
                <Button className="bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white">
                  Browse Menu
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
