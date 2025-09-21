import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';

import { updateUserEntitlements } from '@/lib/entitlements-server';
import { createServerClient } from '@/lib/supabase/server';
import type { EntitlementTier } from '@/lib/entitlements-server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Map Stripe price IDs to tiers
const PRICE_ID_TO_TIER: Record<string, EntitlementTier> = {
  [process.env.STRIPE_PRICE_ID_PRO_MONTHLY!]: 'pro',
  [process.env.STRIPE_PRICE_ID_PRO_YEARLY!]: 'pro',
  [process.env.STRIPE_PRICE_ID_PLUS_MONTHLY!]: 'plus',
  [process.env.STRIPE_PRICE_ID_PLUS_YEARLY!]: 'plus',
};

// Find user ID from Stripe customer ID
async function getUserIdFromCustomerId(customerId: string): Promise<string | null> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle();

  if (error) {
    console.error('Error finding user from customer ID:', error);
    return null;
  }

  return data?.id || null;
}

export async function GET() {
  return NextResponse.json({
    status: 'Webhook endpoint is active',
    endpoint: '/api/billing/webhook',
    configuredEvents: [
      'checkout.session.completed',
      'customer.subscription.created',
      'customer.subscription.updated',
      'customer.subscription.deleted',
      'invoice.payment_succeeded',
      'invoice.payment_failed'
    ]
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const sig = (await headers()).get('stripe-signature')!;

    console.log('Webhook received - Body length:', body.length);
    console.log('Signature present:', !!sig);

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log('Webhook event type:', event.type);
    console.log('Webhook event ID:', event.id);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        console.log('=== CHECKOUT SESSION COMPLETED ===');
        console.log('Session ID:', session.id);
        console.log('Session metadata:', session.metadata);
        console.log('Session customer:', session.customer);
        console.log('Session payment status:', session.payment_status);

        // Get user ID from session metadata
        const userId = session.metadata?.user_id;
        if (!userId) {
          console.error('❌ No user_id in session metadata:', session.metadata);
          break;
        }
        console.log('✅ Found user_id:', userId);

        // Determine tier from the line items
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
        console.log('Line items:', lineItems.data);

        const priceId = lineItems.data[0]?.price?.id;
        if (!priceId) {
          console.error('❌ No price ID found in checkout session line items');
          break;
        }
        console.log('✅ Found price ID:', priceId);

        const tier = PRICE_ID_TO_TIER[priceId];
        if (!tier) {
          console.error('❌ Unknown price ID:', priceId, 'Available mappings:', PRICE_ID_TO_TIER);
          break;
        }
        console.log('✅ Mapped to tier:', tier);

        // Store Stripe customer ID in user's profile
        const customerId = session.customer as string;
        console.log('✅ Customer ID:', customerId);

        const supabase = await createServerClient();
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ stripe_customer_id: customerId })
          .eq('id', userId);

        if (profileError) {
          console.error('❌ Error updating profile with customer ID:', profileError);
        } else {
          console.log('✅ Updated profile with customer ID');
        }

        // Update user entitlements
        console.log('📝 Updating entitlements for user:', userId, 'to tier:', tier);
        const success = await updateUserEntitlements(userId, tier, {
          subscriptionId: session.subscription as string,
          customerId: customerId,
        });

        if (success) {
          console.log('✅ Successfully updated user', userId, 'to tier', tier);
        } else {
          console.error('❌ Failed to update user', userId, 'to tier', tier);
        }

        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;

        console.log('Subscription updated:', subscription.id, subscription.status);

        if (subscription.status === 'active') {
          // Get the price ID from the subscription items
          const priceId = subscription.items.data[0]?.price?.id;
          if (!priceId) {
            console.error('No price ID found in subscription');
            break;
          }

          const tier = PRICE_ID_TO_TIER[priceId];
          if (!tier) {
            console.error('Unknown price ID in subscription:', priceId);
            break;
          }

          // Get customer ID and map to user ID
          const customerId = subscription.customer as string;
          const userId = await getUserIdFromCustomerId(customerId);

          if (userId) {
            const success = await updateUserEntitlements(userId, tier, {
              subscriptionId: subscription.id,
              customerId: customerId,
            });

            if (success) {
              console.log(`Updated user ${userId} to tier ${tier}`);
            } else {
              console.error(`Failed to update user ${userId} to tier ${tier}`);
            }
          } else {
            console.error('Could not find user ID for customer:', customerId);
          }
        }

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        console.log('Subscription cancelled:', subscription.id);

        // Downgrade user to free tier when subscription is cancelled
        const customerId = subscription.customer as string;
        const userId = await getUserIdFromCustomerId(customerId);

        if (userId) {
          const success = await updateUserEntitlements(userId, 'free', {});

          if (success) {
            console.log(`Downgraded user ${userId} to free tier`);
          } else {
            console.error(`Failed to downgrade user ${userId} to free tier`);
          }
        } else {
          console.error('Could not find user ID for customer:', customerId);
        }

        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;

        if (invoice.subscription) {
          console.log('Payment succeeded for subscription:', invoice.subscription);
          // Handle successful payment
        }

        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;

        if (invoice.subscription) {
          console.log('Payment failed for subscription:', invoice.subscription);
          // Handle failed payment
        }

        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
