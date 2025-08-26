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
        {/* ... same order details rendering as your original code ... */}
      </div>
    </div>
  )
}
