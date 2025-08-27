'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Password updated! Please sign in with your new password.')
      router.replace('/auth/signin')
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-amber-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Reset Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleResetPassword}>
            <Input
              type="password"
              placeholder="Enter your new password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              minLength={6}
              required
            />
            <Button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-rose-500 to-amber-500">
              {isLoading ? 'Updating...' : 'Reset Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
