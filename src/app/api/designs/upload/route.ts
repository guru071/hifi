import { NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/supabase/server';
import { getProfileByAuthId } from '@/lib/services/users';

export async function POST(request: Request) {
  try {
    const formData = (await request.formData()) as any;
    const file = formData.get('file') as File | null;
    const referenceCode = formData.get('referenceCode') as string | null;

    if (!file || !referenceCode) {
      return NextResponse.json({ error: 'Missing file or referenceCode' }, { status: 400 });
    }

    const routeClient = await createRouteClient();
    
    // Check for authenticated user (optional, as they could be a guest)
    const { data: { user } } = await routeClient.auth.getUser();
    const profile = user ? await getProfileByAuthId(user.id, routeClient) : null;

    // 1. Upload to storage
    const extension = file.name.split('.').pop() || 'jpg';
    const fileName = `${referenceCode.replace(/[^A-Z0-9-]/g, '_')}_${Date.now()}.${extension}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: storageError } = await routeClient.storage
      .from('designs')
      .upload(fileName, buffer, { 
        contentType: file.type || 'image/jpeg',
        upsert: false 
      });

    if (storageError) {
      console.error('Storage upload failed:', storageError);
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }

    // 2. Create custom design record
    const { data: existing } = await routeClient
      .from('custom_designs')
      .select('id')
      .eq('reference_code', referenceCode)
      .maybeSingle();

    let customDesignId;
    if (existing) {
      // If it exists, update it
      await routeClient
        .from('custom_designs')
        .update({
          status: 'received',
          media_url: fileName,
          design_image_url: fileName,
          media_mime_type: file.type
        })
        .eq('id', existing.id);
      customDesignId = existing.id;
    } else {
      // Create new
      const { data: newDesign } = await routeClient
        .from('custom_designs')
        .insert({
          user_id: profile?.id ?? null,
          reference_code: referenceCode,
          status: 'received',
          media_url: fileName,
          design_image_url: fileName,
          media_mime_type: file.type
        })
        .select('id')
        .single();
      customDesignId = newDesign?.id;
    }

    return NextResponse.json({ success: true, fileName, designId: customDesignId });
  } catch (err) {
    console.error('Upload handler error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
