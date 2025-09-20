declare namespace NodeJS {
  interface ProcessEnv {
    readonly NEXT_PUBLIC_SUPABASE_URL: string;
    readonly NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
    readonly GOOGLE_OAUTH_CLIENT_ID?: string;
    readonly GOOGLE_OAUTH_CLIENT_SECRET?: string;
  }
}
