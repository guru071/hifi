import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { verifyFirebaseToken } from '@/lib/firebase/admin';
import { getProfileByAuthId } from '@/lib/services/users';

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const referenceCode = formData.get('referenceCode') as string | null;

    if (!file || !referenceCode) {
      return NextResponse.json({ error: 'Missing file or referenceCode' }, { status: 400 });
    }

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'Only JPG, PNG, and WebP images are allowed' }, { status: 400 });
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: 'File must be 10MB or smaller' }, { status: 400 });
    }

    const authUser = await verifyFirebaseToken(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerClient();
    const profile = await getProfileByAuthId(authUser.uid, supabase);
    if (!profile) {
      return NextResponse.json({ error: 'Account profile not found' }, { status: 404 });
    }

    const { data: existing, error: existingError } = await supabase
      .from('custom_designs')
      .select('id, user_id')
      .eq('reference_code', referenceCode)
      .maybeSingle();

    if (existingError) {
      console.error('Design lookup failed:', existingError);
      return NextResponse.json({ error: 'Failed to process upload' }, { status: 500 });
    }

    if (existing?.user_id && existing.user_id !== profile.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 1. Upload to storage after auth and ownership checks pass.
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

    // 2. Create or update the custom design record.
    let customDesignId;
    if (existing) {
      // If it exists, update it
      const { error: updateError } = await supabase
        .from('custom_designs')
        .update({
          user_id: profile.id,
          status: 'received',
          media_url: fileName,
          design_image_url: fileName,
          media_mime_type: file.type
        })
        .eq('id', existing.id);
      if (updateError) {
        console.error('Design update failed:', updateError);
        return NextResponse.json({ error: 'Failed to save upload' }, { status: 500 });
      }
      customDesignId = existing.id;
    } else {
      // Create new
      const { data: newDesign, error: insertError } = await supabase
        .from('custom_designs')
        .insert({
          user_id: profile.id,
          reference_code: referenceCode,
          status: 'received',
          media_url: fileName,
          design_image_url: fileName,
          media_mime_type: file.type
        })
        .select('id')
        .single();
      if (insertError) {
        console.error('Design insert failed:', insertError);
        return NextResponse.json({ error: 'Failed to save upload' }, { status: 500 });
      }
      customDesignId = newDesign?.id;
    }

    return NextResponse.json({ success: true, fileName, designId: customDesignId });
  } catch (err) {
    console.error('Upload handler error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
