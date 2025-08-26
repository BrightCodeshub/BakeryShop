import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

if (!process.env.STRIPE_SECRET_KEY) {
 throw new Error('STRIPE_SECRET_KEY environment variable is missing');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
})

export async function POST(req: NextRequest) {
  try {
    const { orderId, items, customerEmail } = await req.json()

    if (!orderId || !items || !customerEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create line items for Stripe
    const lineItems = items.map((item: any) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
          images: item.image_url ? [item.image_url] : [],
        },
        unit_amount: Math.round(item.price * 100), // Convert to cents
      },
      quantity: item.quantity,
    }))

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      customer_email: customerEmail,
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/order/cart`,
      metadata: {
        orderId,
      },
    })

    // After session is created, update your order with session ID
    await supabase
      .from('orders')
      .update({ stripe_session_id: session.id })
      .eq('id', orderId)

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
  console.error('Stripe session creation error:', error.message, error);
  return NextResponse.json(
    { error: error.message || 'Failed to create checkout session' },
    { status: 500 }
  );
  }
}
