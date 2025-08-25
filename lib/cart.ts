export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image_url?: string
}

export function getCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  const cart = localStorage.getItem('bakery-cart')
  return cart ? JSON.parse(cart) : []
}

export function addToCart(item: Omit<CartItem, 'quantity'>, quantity: number = 1) {
  const cart = getCart()
  const existingItem = cart.find(cartItem => cartItem.id === item.id)
  
  if (existingItem) {
    existingItem.quantity += quantity
  } else {
    cart.push({ ...item, quantity })
  }
  
  localStorage.setItem('bakery-cart', JSON.stringify(cart))
  window.dispatchEvent(new Event('cart-updated'))
}

export function updateCartItem(itemId: string, quantity: number) {
  const cart = getCart()
  const item = cart.find(cartItem => cartItem.id === itemId)
  
  if (item) {
    if (quantity <= 0) {
      removeFromCart(itemId)
    } else {
      item.quantity = quantity
      localStorage.setItem('bakery-cart', JSON.stringify(cart))
      window.dispatchEvent(new Event('cart-updated'))
    }
  }
}

export function removeFromCart(itemId: string) {
  const cart = getCart()
  const filteredCart = cart.filter(item => item.id !== itemId)
  localStorage.setItem('bakery-cart', JSON.stringify(filteredCart))
  window.dispatchEvent(new Event('cart-updated'))
}

export function clearCart() {
  localStorage.removeItem('bakery-cart')
  window.dispatchEvent(new Event('cart-updated'))
}

export function getCartTotal(): number {
  const cart = getCart()
  return cart.reduce((total, item) => total + (item.price * item.quantity), 0)
}

export function getCartItemCount(): number {
  const cart = getCart()
  return cart.reduce((count, item) => count + item.quantity, 0)
}