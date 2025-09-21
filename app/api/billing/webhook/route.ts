import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';

import { updateUserEntitlements, autoCleanupResources } from '@/lib/entitlements-server';
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server';
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

// Map Stripe products to tiers (for when customers switch plans)
const PRODUCT_ID_TO_TIER: Record<string, EntitlementTier> = {
  [process.env.STRIPE_PRODUCT_ID_PRO!]: 'pro',
  [process.env.STRIPE_PRODUCT_ID_PLUS!]: 'plus',
};

// Find user ID from Stripe customer ID
async function getUserIdFromCustomerId(customerId: string): Promise<string | null> {
  const supabase = await createServerClient();

  console.log('🔍 Looking up customer ID:', customerId);

  // Method 1: Direct JSON query (for JSONB columns)
  const { data: entitlementsData, error: entitlementsError } = await supabase
    .from('entitlements')
    .select('user_id, source')
    .eq('source->>customerId', customerId)
    .maybeSingle();

  if (entitlementsError) {
    console.error('❌ Error finding user from entitlements table:', entitlementsError);
  } else if (entitlementsData) {
    console.log('✅ Found user ID from entitlements:', entitlementsData.user_id);
    console.log('📋 Entitlements source:', entitlementsData.source);
    return entitlementsData.user_id;
  }

  // Method 2: Search through all entitlements and parse JSON strings
  console.log('🔍 Searching all entitlements for customer ID...');
  const { data: allEntitlements, error: allError } = await supabase
    .from('entitlements')
    .select('user_id, source, tier')
    .limit(20); // Check more users

  if (allError) {
    console.error('❌ Error fetching all entitlements:', allError);
    return null;
  }

  if (allEntitlements) {
    console.log(`📋 Found ${allEntitlements.length} entitlement records to check`);

    for (const entitlement of allEntitlements) {
      try {
        let sourceData;

        // Handle different data types
        if (typeof entitlement.source === 'string') {
          sourceData = JSON.parse(entitlement.source);
        } else {
          sourceData = entitlement.source;
        }

        const sourceCustomerId = sourceData?.customerId as string;

        console.log(`📋 User ${entitlement.user_id} (${entitlement.tier}) source:`, sourceData);

        if (sourceCustomerId === customerId) {
          console.log('✅ Found matching customer ID in user:', entitlement.user_id);
          console.log('🎯 User tier in DB:', entitlement.tier);
          return entitlement.user_id;
        }
      } catch (error) {
        console.log('❌ Error parsing source JSON for user:', entitlement.user_id, error);
      }
    }
  }

  console.log('❌ Customer ID not found in any entitlements');
  console.log('🔍 Debug: Available customer IDs in entitlements:');

  // Debug: Show what customer IDs exist
  if (allEntitlements) {
    for (const entitlement of allEntitlements.slice(0, 5)) {
      try {
        const sourceData = typeof entitlement.source === 'string'
          ? JSON.parse(entitlement.source)
          : entitlement.source;
        const sourceCustomerId = sourceData?.customerId as string;
        console.log(`   - User ${entitlement.user_id}: ${sourceCustomerId || 'none'}`);
      } catch (error) {
        console.log(`   - User ${entitlement.user_id}: parse error`);
      }
    }
  }

  return null;
}


// Test endpoint for manual subscription update simulation
export async function PATCH(request: NextRequest) {
  try {
    const { customerId, tier } = await request.json();

    if (!customerId || !tier) {
      return NextResponse.json(
        { error: 'Missing customerId or tier' },
        { status: 400 }
      );
    }

    console.log('=== MANUAL SUBSCRIPTION UPDATE TEST ===');
    console.log('Customer ID:', customerId);
    console.log('Target Tier:', tier);

    // Use the same logic as the webhook
    const supabase = await createServerClient();
    const { data: updateResult, error: updateError } = await supabase
      .from('entitlements')
      .update({
        tier: tier,
        source: {
          customerId: customerId,
          subscriptionId: 'manual_test_sub'
        },
        updated_at: new Date().toISOString()
      })
      .eq('source->>customerId', customerId)
      .select('user_id, tier')
      .maybeSingle();

    if (updateError) {
      console.error('❌ Error updating entitlements:', updateError);
      return NextResponse.json(
        { error: 'Failed to update entitlements', details: updateError.message },
        { status: 500 }
      );
    }

    if (updateResult) {
      console.log('✅ Manual update successful:', updateResult);
      return NextResponse.json({
        success: true,
        userId: updateResult.user_id,
        previousTier: updateResult.tier,
        newTier: tier,
        message: 'Entitlements updated successfully'
      });
    } else {
      return NextResponse.json(
        { error: 'No entitlements record found for customer ID' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Manual subscription update error:', error);
    return NextResponse.json(
      { error: 'Test failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Debug endpoint to check what's in the entitlements table
export async function GET() {
  try {
    const supabase = await createServerClient();
    const { data: entitlements, error } = await supabase
      .from('entitlements')
      .select('user_id, tier, source, updated_at')
      .limit(10);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch entitlements', details: error.message },
        { status: 500 }
      );
    }

    const debugInfo = entitlements?.map(entitlement => {
      let sourceData;
      try {
        sourceData = typeof entitlement.source === 'string'
          ? JSON.parse(entitlement.source)
          : entitlement.source;
      } catch (error) {
        sourceData = { error: 'Failed to parse JSON' };
      }

      return {
        user_id: entitlement.user_id,
        tier: entitlement.tier,
        customer_id: sourceData?.customerId || 'none',
        subscription_id: sourceData?.subscriptionId || 'none',
        updated_at: entitlement.updated_at
      };
    });

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
      ],
      testEndpoint: '/api/test-subscription-update',
      debugInfo: debugInfo
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch debug info', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
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
        const productId = lineItems.data[0]?.price?.product as string;

        if (!priceId && !productId) {
          console.error('❌ No price ID or product ID found in checkout session line items');
          break;
        }

        // Try to get tier from price ID first, then product ID
        let tier = priceId ? PRICE_ID_TO_TIER[priceId] : null;
        if (!tier && productId) {
          tier = PRODUCT_ID_TO_TIER[productId];
        }

        if (!tier) {
          console.error('❌ Unknown price ID:', priceId, 'or product ID:', productId);
          console.log('Available mappings:', { PRICE_ID_TO_TIER, PRODUCT_ID_TO_TIER });
          break;
        }
        console.log('✅ Mapped to tier:', tier);

        // Store Stripe customer ID in user's profile
        const customerId = session.customer as string;
        console.log('✅ Customer ID:', customerId);

        const supabase = createServiceRoleClient();

        // Try to update profile with customer ID, but don't fail if column doesn't exist
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .update({ stripe_customer_id: customerId })
            .eq('id', userId);

          if (profileError) {
            console.log('⚠️ Could not update profile with customer ID (column may not exist):', profileError.message);
          } else {
            console.log('✅ Updated profile with customer ID');
          }
        } catch (error) {
          console.log('⚠️ Error updating profile (column may not exist):', error);
        }

        // Update user entitlements (use service role for webhooks)
        console.log('📝 Updating entitlements for user:', userId, 'to tier:', tier);
        const success = await updateUserEntitlements(userId, tier, {
          subscriptionId: session.subscription as string,
          customerId: customerId,
        }, true); // Use service role to bypass RLS

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
        console.log('Subscription items:', subscription.items.data);

        if (subscription.status === 'active') {
          // Get the price ID and product ID from the subscription items
          const priceId = subscription.items.data[0]?.price?.id;
          const productId = subscription.items.data[0]?.price?.product as string;

          console.log('Price ID:', priceId);
          console.log('Product ID:', productId);

          if (!priceId && !productId) {
            console.error('No price ID or product ID found in subscription');
            break;
          }

          // Try to get tier from price ID first, then product ID
          let tier = priceId ? PRICE_ID_TO_TIER[priceId] : null;
          if (!tier && productId) {
            tier = PRODUCT_ID_TO_TIER[productId];
          }

          console.log('Mapped tier:', tier);

          if (!tier) {
            console.error('Unknown price ID:', priceId, 'or product ID:', productId);
            console.error('Available price mappings:', PRICE_ID_TO_TIER);
            console.error('Available product mappings:', PRODUCT_ID_TO_TIER);
            break;
          }

          // Get customer ID and try to update entitlements directly
          const customerId = subscription.customer as string;
          console.log('Customer ID:', customerId);

          // Try to update entitlements directly using customer ID
          const supabase = await createServerClient();
          const { data: updateResult, error: updateError } = await supabase
            .from('entitlements')
            .update({
              tier: tier,
              source: {
                customerId: customerId,
                subscriptionId: subscription.id
              },
              updated_at: new Date().toISOString()
            })
            .eq('source->>customerId', customerId)
            .select('user_id, tier')
            .maybeSingle();

          if (updateError) {
            console.error('❌ Error updating entitlements:', updateError);
            console.error('Error details:', {
              message: updateError.message,
              code: updateError.code,
              details: updateError.details,
              hint: updateError.hint
            });
          } else if (updateResult) {
            console.log('✅ Successfully updated entitlements:', updateResult);
            console.log(`🎯 Tier changed: ${updateResult.tier} → ${tier}`);
            console.log(`👤 User ID: ${updateResult.user_id}`);
          } else {
            console.log('❌ No entitlements record found to update for customer ID:', customerId);
            console.log('💡 This suggests the customer ID may not exist in the entitlements table');
          }

          // Get current entitlements for downgrade check (after update)
          const { data: entitlementsAfterUpdate } = await supabase
            .from('entitlements')
            .select('tier, source')
            .eq('source->>customerId', customerId)
            .maybeSingle();

          if (entitlementsAfterUpdate) {
            console.log('📊 Final entitlements after update:', entitlementsAfterUpdate);

            // Check if this is a downgrade
            const tierHierarchy = { 'free': 0, 'pro': 1, 'plus': 2 } as const;
            const isDowngrade = tierHierarchy[tier as keyof typeof tierHierarchy] < tierHierarchy[entitlementsAfterUpdate.tier as keyof typeof tierHierarchy];

            if (isDowngrade) {
              console.log(`Downgrade detected: ${entitlementsAfterUpdate.tier} -> ${tier}, triggering auto-cleanup`);

              // Get user ID from the entitlements record (we need to fetch it again with user_id)
              const { data: userEntitlementsRecord } = await supabase
                .from('entitlements')
                .select('user_id')
                .eq('source->>customerId', customerId)
                .maybeSingle();

              if (userEntitlementsRecord?.user_id) {
                const { fetchUserEntitlements, autoCleanupResources } = await import('@/lib/entitlements-server');
                const userEntitlements = await fetchUserEntitlements(userEntitlementsRecord.user_id);

                if (userEntitlements) {
                  try {
                    await autoCleanupResources(userEntitlementsRecord.user_id, tier);
                    console.log(`✅ Auto-cleanup completed for user ${userEntitlementsRecord.user_id}`);
                  } catch (error) {
                    console.error(`❌ Auto-cleanup failed for user ${userEntitlementsRecord.user_id}:`, error);
                  }
                }
              }
            }
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
          const success = await updateUserEntitlements(userId, 'free', {}, true); // Use service role for webhooks

          if (success) {
            console.log(`Downgraded user ${userId} to free tier, triggering auto-cleanup`);
            try {
              await autoCleanupResources(userId, 'free');
              console.log(`✅ Auto-cleanup completed for user ${userId}`);
            } catch (error) {
              console.error(`❌ Auto-cleanup failed for user ${userId}:`, error);
            }
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
