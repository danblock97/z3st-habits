declare namespace NodeJS {
  interface ProcessEnv {
    readonly NEXT_PUBLIC_SUPABASE_URL: string;
    readonly NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
    readonly GOOGLE_OAUTH_CLIENT_ID?: string;
    readonly GOOGLE_OAUTH_CLIENT_SECRET?: string;
    readonly STRIPE_SECRET_KEY: string;
    readonly STRIPE_PUBLISHABLE_KEY: string;
    readonly STRIPE_WEBHOOK_SECRET: string;
    readonly NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: string;
    readonly STRIPE_PRICE_ID_PRO_MONTHLY: string;
    readonly STRIPE_PRICE_ID_PRO_YEARLY: string;
    readonly STRIPE_PRICE_ID_PLUS_MONTHLY: string;
    readonly STRIPE_PRICE_ID_PLUS_YEARLY: string;
  }
}
