import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { useState } from 'react'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type') as EmailOtpType | null
    const next = searchParams.get('next') ?? '/'
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    if (token_hash && type) {
        const supabase = await createClient()

        try {
            const { error } = await supabase.auth.verifyOtp({
                type,
                token_hash,
            })

            if (error) {
                toast.error(error.message)
            } else {
                toast.success('Signed in successfully!')
                router.push('/dashboard/customer')
            }
        } catch (error) {
            toast.error('An unexpected error occurred')
        } finally {
            setIsLoading(false)
        }
    }

}