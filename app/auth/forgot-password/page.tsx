'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`, // or your site URL
    })
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Password reset email sent! Check your inbox.')
      setEmail('')
      // Optionally redirect to sign-in:
      // router.replace('/auth/signin')
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-amber-50 p-4">
      <Card className="max-w-md w-full shadow-md">
        <CardHeader>
          <CardTitle>Forgot Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleReset}>
            <div>
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="border-rose-300 focus:ring-rose-500"
              />
            </div>
            <Button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-rose-500 to-amber-500">
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
