import { NextResponse } from 'next/server';
import { verifyFirebaseToken } from '@/lib/firebase/admin';
import { createServerClient } from '@/lib/supabase/server';
import { getProfileByAuthId } from '@/lib/services/users';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const referenceCode = formData.get('referenceCode') as string | null;

    if (!file || !referenceCode) {
      return NextResponse.json({ error: 'Missing file or referenceCode' }, { status: 400 });
    }

    const supabase = createServerClient();

    // Optional Firebase auth: link upload to a known profile when available.
    const decoded = await verifyFirebaseToken(request);
    const profile = decoded ? await getProfileByAuthId(decoded.uid, supabase) : null;

    // 1. Upload to storage
    const extension = file.name.split('.').pop() || 'jpg';
    const fileName = `${referenceCode.replace(/[^A-Z0-9-]/g, '_')}_${Date.now()}.${extension}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: storageError } = await supabase.storage
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
    const { data: existing } = await supabase
      .from('custom_designs')
      .select('id')
      .eq('reference_code', referenceCode)
      .maybeSingle();

    let customDesignId;
    if (existing) {
      // If it exists, update it
      const { error: updateError } = await supabase
        .from('custom_designs')
        .update({
          status: 'received',
          media_url: fileName,
          design_image_url: fileName,
          media_mime_type: file.type,
          ...(profile?.id ? { user_id: profile.id } : {}),
        })
        .eq('id', existing.id);
      if (updateError) {
        console.error('Custom design update failed:', updateError);
        return NextResponse.json({ error: 'Failed to update design record' }, { status: 500 });
      }
      customDesignId = existing.id;
    } else {
      // Create new
      const { data: newDesign, error: insertError } = await supabase
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
      if (insertError) {
        console.error('Custom design insert failed:', insertError);
        return NextResponse.json({ error: 'Failed to create design record' }, { status: 500 });
      }
      customDesignId = newDesign?.id;
    }

    return NextResponse.json({ success: true, fileName, designId: customDesignId });
  } catch (err) {
    console.error('Upload handler error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
