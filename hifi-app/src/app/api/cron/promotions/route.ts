import { NextResponse } from 'next/server';
import { sendProductPromotions } from '@/lib/services/whatsapp-notifications';

/**
 * GET /api/cron/promotions
 *
 * Sends promotional WhatsApp messages with latest products to all customers.
 * Triggered by Vercel Cron (Mon & Thu at 10:00 AM IST) or manual curl.
 *
 * Protected by CRON_SECRET to prevent unauthorized triggers.
 */
export async function GET(request: Request) {
  // Verify cron secret (Vercel sets this header automatically for cron jobs)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await sendProductPromotions();
    return NextResponse.json({
      success: true,
      message: `Promotions sent: ${result.sent}, skipped: ${result.skipped}`,
      ...result,
    });
  } catch (error) {
    console.error('[Cron] Promotions failed:', error);
    return NextResponse.json({ error: 'Failed to send promotions' }, { status: 500 });
  }
}
