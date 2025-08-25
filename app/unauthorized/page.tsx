import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Shield, ArrowLeft } from 'lucide-react'

export default function Unauthorized() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-amber-50 flex items-center justify-center">
      <Card className="max-w-md mx-auto text-center">
        <CardContent className="p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-8">
            You don't have permission to access this page. Please contact an administrator if you believe this is an error.
          </p>
          <div className="space-y-3">
            <Link href="/">
              <Button className="w-full bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go to Homepage
              </Button>
            </Link>
            <Link href="/auth/signin">
              <Button variant="outline" className="w-full border-rose-300 text-rose-700 hover:bg-rose-50">
                Sign In
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}