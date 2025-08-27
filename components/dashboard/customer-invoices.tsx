'use client'

import { useState, useEffect } from 'react'
import { Table, TableHeader, TableRow, TableCell, TableBody } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'

interface Customer {
  id: string
  full_name: string
  email: string
}

interface Payment {
  id: string
  amount: number
  status: string
  created_at: string
  order_id: string
  stripe_payment_intent_id: string
  customer_email: string
  orders: {
    id: string
    total: number
    status: string
  }
}

interface Props {
  customers: Customer[]
}

export default function CustomerInvoiceTable({ customers }: Props) {
  const supabase = createClient()
  const pageSize = 10

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [invoices, setInvoices] = useState<Payment[]>([])
  const [loadingInvoices, setLoadingInvoices] = useState(false)

  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<{
    status: string | null
    startDate: string | null
    endDate: string | null
    minAmount: number | null
    maxAmount: number | null
  }>({
    status: null,
    startDate: null,
    endDate: null,
    minAmount: null,
    maxAmount: null,
  })

  const loadInvoices = async (customer: Customer, pageNumber = 1) => {
    setSelectedCustomer(customer)
    setLoadingInvoices(true)

    let query = supabase
      .from('payments')
      .select('*, orders(id, total, status)')
      .eq('customer_email', customer.email)
      .order('created_at', { ascending: false })
      .range((pageNumber - 1) * pageSize, pageNumber * pageSize - 1)

    if (filters.status) {
      query = query.eq('status', filters.status)
    }
    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate)
    }
    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate)
    }
    if (filters.minAmount !== null) {
      query = query.gte('amount', filters.minAmount)
    }
    if (filters.maxAmount !== null) {
      query = query.lte('amount', filters.maxAmount)
    }

    const { data, error } = await query
    setLoadingInvoices(false)
    if (error) {
      toast.error('Failed to load invoices')
    } else {
      setInvoices(data || [])
      setPage(pageNumber)
    }
  }

  // When filters or page change, reload invoices for selected customer
  useEffect(() => {
    if (selectedCustomer) {
      loadInvoices(selectedCustomer, page)
    }
  }, [filters, page])

  const handleSendInvoiceEmail = async (payment: Payment) => {
    try {
      const htmlContent = `
        <h3>Invoice for Order #${payment.orders.id.slice(0, 8)}</h3>
        <p>Amount: $${payment.amount.toFixed(2)}</p>
        <p>Status: ${payment.status}</p>
        <p>Date: ${new Date(payment.created_at).toLocaleDateString()}</p>
      `
      const res = await fetch('/api/send-invoice-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: payment.customer_email,
          subject: `Invoice for Order #${payment.orders.id.slice(0, 8)}`,
          html: htmlContent,
        }),
      })
      if (!res.ok) throw new Error('Failed to send email')
      toast.success('Invoice sent successfully')
    } catch {
      toast.error('Failed to send invoice')
    }
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Select Customer to View Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <Table className="max-w-full">
            <TableHeader>
              <TableRow>
                <TableCell>Full Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell className="text-right">Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map(customer => (
                <TableRow key={customer.id} className="hover:bg-gray-50 cursor-pointer">
                  <TableCell>{customer.full_name}</TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => loadInvoices(customer, 1)}>
                      View Invoices
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedCustomer && (
        <Card>
          <CardHeader>
            <CardTitle>Invoices for {selectedCustomer.full_name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-wrap gap-4">
              {/* Filters */}
              <Select
                value={filters.status ?? 'all'}
                onValueChange={val => setFilters(f => ({ ...f, status: val === 'all' ? null : val }))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="succeeded">Succeeded</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="date"
                className="w-40"
                value={filters.startDate ?? ''}
                onChange={e => setFilters(f => ({ ...f, startDate: e.target.value || null }))}
                placeholder="Start Date"
              />

              <Input
                type="date"
                className="w-40"
                value={filters.endDate ?? ''}
                onChange={e => setFilters(f => ({ ...f, endDate: e.target.value || null }))}
                placeholder="End Date"
              />

              <Input
                type="number"
                className="w-24"
                placeholder="Min Amount"
                value={filters.minAmount ?? ''}
                onChange={e => setFilters(f => ({ ...f, minAmount: e.target.value ? +e.target.value : null }))}
                min={0}
              />

              <Input
                type="number"
                className="w-24"
                placeholder="Max Amount"
                value={filters.maxAmount ?? ''}
                onChange={e => setFilters(f => ({ ...f, maxAmount: e.target.value ? +e.target.value : null }))}
                min={0}
              />
            </div>

            {loadingInvoices ? (
              <p className="text-center text-gray-600">Loading invoices...</p>
            ) : invoices.length === 0 ? (
              <p className="text-center text-gray-600">No invoices found for this customer.</p>
            ) : (
              <Table className="max-w-full">
                <TableHeader>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Order ID</TableCell>
                    <TableCell className="text-right">Send Invoice</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map(payment => (
                    <TableRow key={payment.id} className="hover:bg-gray-50">
                      <TableCell>{new Date(payment.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>${payment.amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${
                            payment.status === 'succeeded'
                              ? 'bg-green-100 text-green-800'
                              : payment.status === 'failed'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {payment.status}
                        </span>
                      </TableCell>
                      <TableCell>{payment.order_id.slice(0, 8)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => handleSendInvoiceEmail(payment)}>
                          Send Invoice
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Pagination Controls */}
            <div className="flex justify-between mt-4">
              <Button onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page === 1}>
                Previous
              </Button>
              <span className="flex items-center">
                Page {page}
              </span>
              <Button onClick={() => setPage(p => (invoices.length < pageSize ? p : p + 1))} disabled={invoices.length < pageSize}>
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
