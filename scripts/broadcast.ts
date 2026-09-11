import WebSocket from "ws";
(global as any).WebSocket = WebSocket;
import { createClient } from '@supabase/supabase-js';
import path from 'path';

// Load environment variables

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;

// Define a simplified version of sendWhatsAppList to run directly from the script
async function sendWhatsAppList(to: string, body: string, buttonLabel: string, rows: any[], header?: string) {
  const token = process.env.MAGHGO_BOT_TOKEN;
  const maghgoApi = process.env.MAGHGO_OUTBOUND_API_URL;
  if (!maghgoApi || !token) {
    throw new Error('MAGHGO_OUTBOUND_API_URL or MAGHGO_BOT_TOKEN not configured.');
  }

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'interactive',
    interactive: {
      type: 'list',
      ...(header ? { header: { type: 'text', text: header.slice(0, 60) } } : {}),
      body: { text: body.slice(0, 1024) },
      action: {
        button: buttonLabel.slice(0, 20),
        sections: [{ title: 'Options', rows: rows.slice(0, 10).map((r: any) => ({
          id: r.id, 
          title: r.title.slice(0, 24),
          ...(r.description ? { description: r.description.slice(0, 72) } : {})
        }))}],
      },
    },
  };

  const res = await fetch(maghgoApi, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Maghgo WhatsApp send failed (${res.status}): ${errBody}`);
  }
}

async function sendWhatsAppMessage(to: string, bodyText: string) {
  const token = process.env.MAGHGO_BOT_TOKEN;
  const maghgoApi = process.env.MAGHGO_OUTBOUND_API_URL;
  const payload = {
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body: bodyText, preview_url: false },
  };
  const res = await fetch(maghgoApi!, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
}

async function run() {
  console.log("Fetching customers...");
  const { data: customers, error } = await supabase
    .from('users')
    .select('id, full_name, phone')
    .eq('role', 'customer')
    .not('phone', 'is', null);

  if (error) {
    console.error("Error fetching customers:", error);
    process.exit(1);
  }

  console.log(`Found ${customers?.length || 0} customers with phone numbers.`);

  console.log("Fetching latest products...");
  const { data: products } = await supabase
    .from('products')
    .select('id, title, base_price')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(3);

  let rows: any[] = [];
  if (products && products.length > 0) {
    rows = products.map((p: any) => ({
      id: `view_product_${p.id}`,
      title: p.title.slice(0, 24),
      description: `₹${p.base_price}`
    }));
  }

  let count = 0;
  for (const customer of customers) {
    const phone = customer.phone?.replace(/[^0-9]/g, '');
    if (!phone || phone.length < 10) continue;
    
    const name = customer.full_name || 'there';
    
    const msg = `👋 *Welcome back to HIFI!*

Hi ${name}! Great to see you again.

We've got fresh designs waiting for you!

_Powered by Maghgo_`;

    try {
      if (rows.length > 0) {
        await sendWhatsAppList(phone, msg, 'Explore Products', rows, '🆕 Latest Arrivals');
      } else {
        await sendWhatsAppMessage(phone, msg);
      }
      console.log(`Sent GUI list to ${name} (${phone})`);
      count++;
    } catch (err: any) {
      console.error(`Failed to send to ${name} (${phone}):`, err.message);
    }
    
    // Rate limit
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`Finished sending to ${count} customers.`);
}

run();
