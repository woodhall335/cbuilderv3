import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function POST(req: Request) {
  const form = await req.formData();
  const jurisdiction = String(form.get('jurisdiction') ?? '');
  const slug = String(form.get('slug') ?? '');
  const payload = String(form.get('payload') ?? '');

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            unit_amount: 1200, // £12 example
            product_data: { name: `${slug} (${jurisdiction.toUpperCase()})` },
          },
          quantity: 1,
        },
      ],
      metadata: { jurisdiction, slug, payload },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/editor/${jurisdiction}/${slug}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/preview/${jurisdiction}/${slug}?canceled=1`,
    });
    return NextResponse.redirect(session.url!, { status: 303 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
