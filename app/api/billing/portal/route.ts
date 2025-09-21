import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

export async function POST(request: NextRequest) {
  try {
    const { returnUrl, customerId } = await request.json();

    if (!returnUrl) {
      return NextResponse.json(
        { error: 'Missing return URL' },
        { status: 400 }
      );
    }

    // If no customer ID, redirect to pricing
    if (!customerId) {
      return NextResponse.json({
        error: 'No subscription found',
        redirectTo: '/pricing'
      }, { status: 404 });
    }

    // Create a customer portal session
    const session = await stripe.billingPortal.sessions.create({
      return_url: returnUrl,
      customer: customerId,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating portal session:', error);

    // If customer is missing or other Stripe error, redirect to pricing
    return NextResponse.json({
      error: 'Billing portal not available',
      redirectTo: '/pricing'
    }, { status: 404 });
  }
}
