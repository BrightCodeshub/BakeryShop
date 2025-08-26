'use client'

import { useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function ConfirmPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const success = searchParams.get('success')
    const error = searchParams.get('error')

    if (success) {
     toast.success('Signed in successfully!', { duration: 3000 })
      setTimeout(() => router.replace('/dashboard/customer'), 3000)  // Navigate after toast
    } else if (error) {
      toast.error(decodeURIComponent(error))
       setTimeout(() => router.replace('/auth/signin'), 3000)         // Navigate back to signin on error
    } else {
      // No params: just redirect to signin
      router.replace('/auth/signin')
    }
  }, [searchParams, router])

  // Optionally, render loading or blank UI while redirecting
  return null
}