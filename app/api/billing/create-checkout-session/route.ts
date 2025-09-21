import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

// Server-side price ID mapping - more secure than exposing to client
const PLAN_TYPE_TO_PRICE_ID: Record<string, string> = {
  'pro-monthly': process.env.STRIPE_PRICE_ID_PRO_MONTHLY!,
  'pro-yearly': process.env.STRIPE_PRICE_ID_PRO_YEARLY!,
  'plus-monthly': process.env.STRIPE_PRICE_ID_PLUS_MONTHLY!,
  'plus-yearly': process.env.STRIPE_PRICE_ID_PLUS_YEARLY!,
};

// Verify price IDs are properly loaded
console.log('Loaded price IDs:', {
  'pro-monthly': process.env.STRIPE_PRICE_ID_PRO_MONTHLY,
  'pro-yearly': process.env.STRIPE_PRICE_ID_PRO_YEARLY,
  'plus-monthly': process.env.STRIPE_PRICE_ID_PLUS_MONTHLY,
  'plus-yearly': process.env.STRIPE_PRICE_ID_PLUS_YEARLY,
});

export async function GET() {
  // Simple test endpoint to verify Stripe is working
  try {
    const balance = await stripe.balance.retrieve();
    return NextResponse.json({
      status: 'ok',
      balance: balance.available[0]?.amount || 0,
      currency: balance.available[0]?.currency || 'unknown',
      loadedPriceIds: {
        'pro-monthly': process.env.STRIPE_PRICE_ID_PRO_MONTHLY,
        'pro-yearly': process.env.STRIPE_PRICE_ID_PRO_YEARLY,
        'plus-monthly': process.env.STRIPE_PRICE_ID_PLUS_MONTHLY,
        'plus-yearly': process.env.STRIPE_PRICE_ID_PLUS_YEARLY,
      }
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Stripe not configured',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { planType, successUrl, cancelUrl, userId } = await request.json();

    if (!planType || !successUrl || !cancelUrl || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const priceId = PLAN_TYPE_TO_PRICE_ID[planType];
    if (!priceId) {
      return NextResponse.json(
        { error: 'Invalid plan type' },
        { status: 400 }
      );
    }

    // Note: Authentication is handled by the fact that only logged-in users can reach the pricing page
    // The userId from the session metadata will be used to identify the user

    console.log('Creating checkout session with:', {
      planType,
      priceId,
      successUrl,
      cancelUrl,
      userId
    });

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          user_id: userId,
        },
        allow_promotion_codes: true,
        billing_address_collection: 'auto',
      });

      console.log('Checkout session created successfully:', {
        sessionId: session.id,
        url: session.url,
        priceId: priceId,
        planType: planType
      });

      return NextResponse.json({ sessionId: session.id, url: session.url });
    } catch (stripeError: unknown) {
      const errorDetails = stripeError && typeof stripeError === 'object' && stripeError !== null
        ? {
            type: 'type' in stripeError ? stripeError.type : undefined,
            code: 'code' in stripeError ? stripeError.code : undefined,
            message: 'message' in stripeError ? stripeError.message : undefined,
            param: 'param' in stripeError ? stripeError.param : undefined,
          }
        : { message: String(stripeError) };

      console.error('Stripe error details:', errorDetails);
      return NextResponse.json(
        { error: 'Stripe error', details: errorDetails.message },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
