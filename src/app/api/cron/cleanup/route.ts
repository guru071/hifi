import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  // Optional: Vercel Cron secures the endpoint using a secret token
  const authHeader = request.headers.get('authorization');
  if (
    process.env.CRON_SECRET && 
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServerClient();
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  try {
    // We can fetch custom designs created before oneMonthAgo
    const { data: oldDesigns, error: err1 } = await supabase
      .from('custom_designs')
      .select('id, design_image_url, created_at')
      .lt('created_at', oneMonthAgo.toISOString());

    if (err1) throw err1;

    // We can fetch custom designs linked to delivered orders
    const { data: deliveredOrderItems, error: err2 } = await supabase
      .from('order_items')
      .select('custom_design_id, orders!inner(status)')
      .eq('orders.status', 'delivered')
      .not('custom_design_id', 'is', null);

    if (err2) throw err2;

    const deliveredDesignIds = new Set(deliveredOrderItems.map(item => item.custom_design_id));

    // Combine them
    const designsToDelete = new Set<string>();
    const imagePathsToDelete = new Set<string>();

    for (const d of (oldDesigns || [])) {
      designsToDelete.add(d.id);
      if (d.design_image_url) imagePathsToDelete.add(d.design_image_url);
    }

    for (const dId of deliveredDesignIds) {
      if (dId) {
        designsToDelete.add(dId as string);
        const { data: dData } = await supabase.from('custom_designs').select('design_image_url').eq('id', dId).single();
        if (dData && dData.design_image_url) {
          imagePathsToDelete.add(dData.design_image_url);
        }
      }
    }

    const paths = Array.from(imagePathsToDelete).map(url => {
      const parts = url.split('/');
      return parts[parts.length - 1];
    });

    if (paths.length > 0) {
      const { error: storageError } = await supabase.storage.from('designs').remove(paths);
      if (storageError) console.error("Error deleting storage items:", storageError);
    }

    if (designsToDelete.size > 0) {
      const { error: dbError } = await supabase.from('custom_designs').delete().in('id', Array.from(designsToDelete));
      if (dbError) console.error("Error deleting db rows:", dbError);
    }

    // Clean up junk in supabase: e.g. pending orders older than 1 week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const { error: junkError } = await supabase
      .from('orders')
      .delete()
      .in('status', ['pending', 'pending_payment'])
      .lt('created_at', oneWeekAgo.toISOString());
    if (junkError) console.error("Error deleting junk orders:", junkError);

    return NextResponse.json({ 
      success: true, 
      deletedDesigns: designsToDelete.size,
      deletedImages: paths.length
    });
  } catch (error) {
    console.error("Cron Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
