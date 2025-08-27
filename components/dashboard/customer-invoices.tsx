'use client'

import { useState } from 'react'
import { Table, TableHeader, TableRow, TableCell, TableBody } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [invoices, setInvoices] = useState<Payment[]>([])
  const [loadingInvoices, setLoadingInvoices] = useState(false)

  const supabase = createClient()

  const loadInvoices = async (customer: Customer) => {
    setSelectedCustomer(customer)
    setLoadingInvoices(true)
    const { data, error } = await supabase
      .from('payments')
      .select('*, orders(id, total, status)')
      .eq('customer_email', customer.email)
      .order('created_at', { ascending: false })
    setLoadingInvoices(false)
    if (error) {
      toast.error('Failed to load invoices')
    } else {
      setInvoices(data || [])
    }
  }

  const sendInvoiceEmail = async (payment: Payment) => {
    // Placeholder: Implement actual sending logic via API or third-party service
    toast.success(`Invoice sent to ${payment.customer_email}`)
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
                    <Button variant="outline" size="sm" onClick={() => loadInvoices(customer)}>
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
                        <Button variant="outline" size="sm" onClick={() => sendInvoiceEmail(payment)}>
                          Send Invoice
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
