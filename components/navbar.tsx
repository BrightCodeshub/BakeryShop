'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Menu, X, User, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getCartItemCount } from '@/lib/cart'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { clearCart } from '@/lib/cart'
export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [cartCount, setCartCount] = useState(0)
  const [userRole, setUserRole] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()
  useEffect(() => {
    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) {
        getUserRole(user.id)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        getUserRole(session.user.id)
      } else {
        setUserRole(null)
      }
    })

    // Listen for cart updates
    const updateCartCount = () => setCartCount(getCartItemCount())
    updateCartCount()
    window.addEventListener('cart-updated', updateCartCount)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('cart-updated', updateCartCount)
    }
  }, [])

  const getUserRole = async (userId: string) => {
    const { data: profile,error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle()
    
    if (error) {
    console.error('Error fetching user role:', error.message)
    setUserRole(null)
    return
  }
    setUserRole(profile?.role || null)
  }

   const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Sign out error:', error.message)
      return
    }
    setUser(null)
    setUserRole(null)
       // Clear the cart on sign out
    clearCart()

    // Reset cart count state
    setCartCount(0)
    router.push('/')  // Redirect after signout
  }

  const getDashboardPath = () => {
    if (userRole === 'manager') return '/dashboard/manager'
    if (userRole === 'employee') return '/dashboard/employee'
    return '/dashboard/customer'
  }

  return (
    <nav className="bg-white/95 backdrop-blur-sm shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-rose-400 to-amber-400 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">SD</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent">
              Sweet Dreams
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/#about" className="text-gray-700 hover:text-rose-600 transition-colors">
              About
            </Link>
            <Link href="/menu" className="text-gray-700 hover:text-rose-600 transition-colors">
              Menu
            </Link>
            <Link href="/#gallery" className="text-gray-700 hover:text-rose-600 transition-colors">
              Gallery
            </Link>
            <Link href="/#contact" className="text-gray-700 hover:text-rose-600 transition-colors">
              Contact
            </Link>
            
            {user ? (
              <div className="flex items-center space-x-4">
                <Link href="/order/cart" className="relative">
                  <Button variant="outline" size="sm" className="p-2">
                    <ShoppingCart className="w-4 h-4" />
                    {cartCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {cartCount}
                      </span>
                    )}
                  </Button>
                </Link>
                
                <Link href={getDashboardPath()}>
                  <Button variant="outline" size="sm">
                    <User className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link href="/order/cart" className="relative">
                  <Button variant="outline" size="sm" className="p-2">
                    <ShoppingCart className="w-4 h-4" />
                    {cartCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {cartCount}
                      </span>
                    )}
                  </Button>
                </Link>
                
                <Link href="/auth/signin">
                  <Button variant="outline" size="sm">
                    Sign In
                  </Button>
                </Link>
                
                <Link href="/menu">
                  <Button className="bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white">
                    Order Online
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col space-y-4">
              <Link href="/#about" className="text-gray-700 hover:text-rose-600 transition-colors" onClick={() => setIsOpen(false)}>
                About
              </Link>
              <Link href="/menu" className="text-gray-700 hover:text-rose-600 transition-colors" onClick={() => setIsOpen(false)}>
                Menu
              </Link>
              <Link href="/#gallery" className="text-gray-700 hover:text-rose-600 transition-colors" onClick={() => setIsOpen(false)}>
                Gallery
              </Link>
              <Link href="/#contact" className="text-gray-700 hover:text-rose-600 transition-colors" onClick={() => setIsOpen(false)}>
                Contact
              </Link>
              
              <div className="pt-4 border-t space-y-2">
                <Link href="/order/cart" className="flex items-center space-x-2 text-gray-700 hover:text-rose-600" onClick={() => setIsOpen(false)}>
                  <ShoppingCart className="w-4 h-4" />
                  <span>Cart ({cartCount})</span>
                </Link>
                
                {user ? (
                  <>
                    <Link href={getDashboardPath()} className="flex items-center space-x-2 text-gray-700 hover:text-rose-600" onClick={() => setIsOpen(false)}>
                      <User className="w-4 h-4" />
                      <span>Dashboard</span>
                    </Link>
                    <button onClick={() => { handleSignOut(); setIsOpen(false); }} className="flex items-center space-x-2 text-gray-700 hover:text-rose-600">
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/auth/signin" className="text-gray-700 hover:text-rose-600" onClick={() => setIsOpen(false)}>
                      Sign In
                    </Link>
                    <Link href="/menu" onClick={() => setIsOpen(false)}>
                      <Button className="w-full bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white">
                        Order Online
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}