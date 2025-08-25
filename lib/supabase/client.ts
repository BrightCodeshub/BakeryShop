/*import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from './database.types'

export const createClient = () => createClientComponentClient<Database>()
*/

import { createBrowserClient } from '@supabase/ssr';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export function createClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
  );
}