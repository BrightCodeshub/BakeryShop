'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableRow, TableCell, TableBody } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'

export default function InvoiceHistoryPage() {
  const [payments, setPayments] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    async function fetchInvoices() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data, error } = await supabase
          .from('payments')
          .select('*, orders(id, total, created_at, status, customer_email)')
          .eq('customer_email', user.email)
          .order('created_at', { ascending: false })
        if (error) {
          toast.error('Failed to fetch invoices')
        } else {
          setPayments(data!)
        }
      }
    }
    fetchInvoices()
  }, [])

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h2 className="text-3xl font-bold mb-4">My Invoice History</h2>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Order ID</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map(pay => (
              <TableRow key={pay.id}>
                <TableCell>{new Date(pay.created_at).toLocaleDateString()}</TableCell>
                <TableCell>${pay.amount.toFixed(2)}</TableCell>
                <TableCell><Badge>{pay.status}</Badge></TableCell>
                <TableCell>{pay.order_id.slice(0, 8)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
