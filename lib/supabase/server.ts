import { createServerClient as createSupabaseServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
}

if (!supabaseAnonKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set');
}

export async function createServerClient() {
  const cookieStore = await cookies();

  return createSupabaseServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions = {}) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Ignore write attempts during Server Component renders.
        }
      },
      remove(name: string, options: CookieOptions = {}) {
        try {
          const removeOptions = { ...options } as CookieOptions & { expires?: Date };
          delete removeOptions.expires;
          cookieStore.delete({ name, ...removeOptions });
        } catch {
          // Ignore delete attempts during Server Component renders.
        }
      },
    },
  });
}
