export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'customer' | 'employee' | 'manager'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: 'customer' | 'employee' | 'manager'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'customer' | 'employee' | 'manager'
          created_at?: string
          updated_at?: string
        }
      }
      menu_items: {
        Row: {
          id: string
          name: string
          description: string | null
          price: number
          image_url: string | null
          category: string
          available: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          price: number
          image_url?: string | null
          category?: string
          available?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          price?: number
          image_url?: string | null
          category?: string
          available?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string
          status: 'pending' | 'paid' | 'preparing' | 'ready' | 'completed' | 'cancelled'
          total: number
          customer_email: string
          payment_intent_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          status?: 'pending' | 'paid' | 'preparing' | 'ready' | 'completed' | 'cancelled'
          total?: number
          customer_email: string
          payment_intent_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          status?: 'pending' | 'paid' | 'preparing' | 'ready' | 'completed' | 'cancelled'
          total?: number
          customer_email?: string
          payment_intent_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          menu_item_id: string
          quantity: number
          price: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          menu_item_id: string
          quantity: number
          price: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          menu_item_id?: string
          quantity?: number
          price?: number
          created_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          order_id: string
          stripe_payment_intent_id: string
          amount: number
          status: 'pending' | 'succeeded' | 'failed' | 'cancelled'
          receipt_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_id: string
          stripe_payment_intent_id: string
          amount: number
          status?: 'pending' | 'succeeded' | 'failed' | 'cancelled'
          receipt_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          stripe_payment_intent_id?: string
          amount?: number
          status?: 'pending' | 'succeeded' | 'failed' | 'cancelled'
          receipt_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}