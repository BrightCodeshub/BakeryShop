'use client'
import { Suspense } from 'react'
import OrderSuccessContent from './ordersuccesscontent'

export default function OrderSuccessPage() {
  // Suspense fallback as per Next.js recommendations
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  )
}
