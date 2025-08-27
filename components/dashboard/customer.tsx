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
import { Clock, CheckCircle, XCircle, AlertTriangle, Calendar, Filter, X, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

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
      return 'bg-green-100 text-green-800 border-green-200'
    case 'cancelled':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'preparing':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'ready':
      return 'bg-purple-100 text-purple-800 border-purple-200'
    default:
      return 'bg-amber-100 text-amber-800 border-amber-200'
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
  const [refreshing, setRefreshing] = useState(false)

  const [page, setPage] = useState(1)
  const pageSize = 5

  // Enhanced date filter state
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)
  const [hasActiveFilters, setHasActiveFilters] = useState(false)

  // Quick date filter presets
  const quickFilters = [
    { label: 'Today', days: 0 },
    { label: 'Last 7 days', days: 7 },
    { label: 'Last 30 days', days: 30 },
    { label: 'Last 90 days', days: 90 },
  ]

  const applyQuickFilter = (days: number) => {
    const today = new Date()
    const pastDate = new Date()
    pastDate.setDate(today.getDate() - days)

    setStartDate(pastDate.toISOString().split('T')[0])
    setEndDate(today.toISOString().split('T')[0])
    setPage(1)
  }

  const clearFilters = () => {
    setStartDate('')
    setEndDate('')
    setPage(1)
  }

  const refreshOrders = async () => {
    setRefreshing(true)
    await fetchOrders()
    setRefreshing(false)
  }

  const fetchOrders = async () => {
    if (!refreshing) setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        window.location.href = '/auth/signin'
        return
      }

      let query = supabase
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

      if (startDate) {
        query = query.gte('created_at', startDate + 'T00:00:00.000Z')
      }
      if (endDate) {
        query = query.lte('created_at', endDate + 'T23:59:59.999Z')
      }

      query = query.order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1)

      const { data, error } = await query

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
    if (!refreshing) setLoading(false)
  }

  useEffect(() => {
    fetchOrders()
  }, [page, startDate, endDate])

  useEffect(() => {
    setHasActiveFilters(!!startDate || !!endDate)
  }, [startDate, endDate])

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-rose-50 to-amber-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading your orders...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-rose-50 to-amber-50">
        <Card className="max-w-md w-full bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 text-center mb-4">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              Reload Page
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-amber-50">
      <div className="max-w-6xl px-4 mx-auto sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Orders</h1>
              <p className="text-gray-600">Track your Sweet Dreams bakery orders</p>
            </div>
            <Button
              onClick={refreshOrders}
              disabled={refreshing}
              variant="outline"
              className="flex items-center gap-2 hover:bg-rose-50 border-rose-200"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Enhanced Filter Controls */}
        <Card className="mb-6 overflow-hidden border-0 shadow-sm bg-white/70 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-800">Filter Orders</h3>
                {hasActiveFilters && (
                  <Badge variant="secondary" className="bg-rose-100 text-rose-800">
                    Active
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="text-gray-600 hover:text-gray-900"
              >
                {showFilters ? 'Hide' : 'Show'} Filters
              </Button>
            </div>
          </CardHeader>

          {showFilters && (
            <CardContent className="pt-0 space-y-4">
              {/* Quick Filter Buttons */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Quick Filters</label>
                <div className="flex flex-wrap gap-2">
                  {quickFilters.map((filter) => (
                    <Button
                      key={filter.label}
                      variant="outline"
                      size="sm"
                      onClick={() => applyQuickFilter(filter.days)}
                      className="hover:bg-rose-50 hover:border-rose-300"
                    >
                      {filter.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Custom Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="startDate" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Start Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      id="startDate"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-colors bg-white"
                      value={startDate}
                      onChange={(e) => {
                        setPage(1)
                        setStartDate(e.target.value)
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="endDate" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    End Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      id="endDate"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-colors bg-white"
                      value={endDate}
                      min={startDate}
                      onChange={(e) => {
                        setPage(1)
                        setEndDate(e.target.value)
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <div className="flex justify-end pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-gray-600 hover:text-gray-900 flex items-center gap-1"
                  >
                    <X className="w-4 h-4" />
                    Clear Filters
                  </Button>
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Orders List */}
        {orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="hover:shadow-lg transition-all duration-200 border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-white to-gray-50/50 pb-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-xl font-bold text-gray-900">
                        Order #{order.id.slice(0, 8).toUpperCase()}
                      </CardTitle>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(order.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={`${getStatusColor(order.status)} px-3 py-1 rounded-full border font-medium`}>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(order.status)}
                          <span className="capitalize">{order.status}</span>
                        </div>
                      </Badge>
                      <p className="text-xl font-bold text-rose-600">${order.total.toFixed(2)}</p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-4">
                  <div className="space-y-3">
                    {order.order_items.map((item, idx) => (
                      <div key={idx} className="flex items-center space-x-4 p-3 bg-gray-50/50 rounded-lg">
                        <div className="w-16 h-16 bg-gray-200 flex-shrink-0 rounded-lg overflow-hidden">
                          <img
                            src={
                              item.menu_items.image_url ??
                              'https://images.pexels.com/photos/1055270/pexels-photo-1055270.jpeg'
                            }
                            alt={item.menu_items.name}
                            className="w-full h-full object-cover transition-transform hover:scale-105"
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{item.menu_items.name}</h4>
                          <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                          <p className="text-xs text-gray-500">${item.price.toFixed(2)} each</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Enhanced Pagination */}
            <div className="flex justify-center items-center space-x-4 mt-8 py-4">
              <Button
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                variant="outline"
                className="flex items-center gap-2 hover:bg-rose-50 border-rose-200"
              >
                ← Previous
              </Button>

              <div className="flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-sm rounded-lg border">
                <span className="text-gray-700 font-medium">Page {page}</span>
              </div>

              <Button
                disabled={orders.length < pageSize}
                onClick={() => setPage(p => p + 1)}
                variant="outline"
                className="flex items-center gap-2 hover:bg-rose-50 border-rose-200"
              >
                Next →
              </Button>
            </div>
          </div>
        ) : (
          <Card className="text-center py-16 border-0 bg-white/70 backdrop-blur-sm">
            <CardContent>
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders found</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                {hasActiveFilters ?
                  "No orders match your current filters. Try adjusting your date range or clearing filters." :
                  "You haven't placed any orders yet. Start by browsing our delicious menu!"
                }
              </p>
              <div className="flex justify-center gap-4">
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="hover:bg-gray-50"
                  >
                    Clear Filters
                  </Button>
                )}
                <Link href="/menu" className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white px-6 py-2 rounded inline-block text-center font-semibold">
                  Browse Menu
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}