'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, ArrowRight } from 'lucide-react'

interface Order {
  id: string
  total: number
  status: string
  created_at: string
  order_items: {
    quantity: number
    price: number
    menu_items: {
      name: string
    }
  }[]
}

export default function OrderSuccessContent() {
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get('session_id')
  const supabase = createClient()

  useEffect(() => {
    if (!sessionId) {
      setError('Missing session ID. Redirecting...')
      setTimeout(() => router.replace('/order/cart'), 2000)
      return
    }

    const fetchOrderDetails = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
          setError('User not authenticated.')
          setTimeout(() => router.replace('/auth/signin'), 2000)
          return
        }

        // You might want to link orders to sessionId on Stripe for real apps
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (
              quantity,
              price,
              menu_items (name)
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (orderError) {
          setError('Failed to fetch order details.')
          return
        }
        setOrder(orderData)
      } catch (err) {
        setError('An unexpected error occurred.')
      } finally {
        setIsLoading(false)
      }
    }
    fetchOrderDetails()
  }, [sessionId, router, supabase])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-rose-400 to-amber-400 rounded-full animate-pulse mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your order details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600 text-lg">{error}</p>
      </div>
    )
  }

   return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-amber-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Order Confirmed!</h1>
          <p className="text-gray-600">Thank you for your order. We're preparing your delicious treats!</p>
        </div>

        {order && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-800">Order Details</CardTitle>
              <p className="text-sm text-gray-600">Order #{order.id.slice(0, 8)}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {order.order_items.map((item, index) => (
                  <div key={index} className="flex justify-between">
                    <span className="text-gray-700">
                      {item.menu_items.name} × {item.quantity}
                    </span>
                    <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              
              <hr className="border-rose-200" />
              
              <div className="flex justify-between text-lg font-bold text-rose-600">
                <span>Total Paid</span>
                <span>${order.total.toFixed(2)}</span>
              </div>
              
              <div className="bg-rose-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">What's Next?</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• You'll receive an email confirmation shortly</li>
                  <li>• We'll start preparing your order right away</li>
                  <li>• Typical preparation time is 15-30 minutes</li>
                  <li>• You can track your order status in your dashboard</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="text-center space-y-4">
          <Link href="/dashboard/customer">
            <Button className="bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white">
              View Order History
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          
          <div>
            <Link href="/menu">
              <Button variant="outline" className="border-rose-300 text-rose-700 hover:bg-rose-50">
                Order Again
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )

}
