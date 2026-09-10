import { GoogleGenAI, Type } from '@google/genai';
import { createServerClient } from '@/lib/supabase/server';
import { createPaymentLink } from '@/lib/services/payments';

const ai = new GoogleGenAI({});

const searchProductsDeclaration = {
  name: 'search_products',
  description: 'Search the HiFi product catalog by category, color, or price.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      category: { type: Type.STRING, description: 'Product category' },
      color: { type: Type.STRING, description: 'Product color' },
      max_price: { type: Type.NUMBER, description: 'Maximum price in INR.' },
    },
  },
};

const createOrderDeclaration = {
  name: 'create_order',
  description: 'Create an order for a specific product and generate a Razorpay payment link to send to the user.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      product_id: { type: Type.STRING, description: 'The UUID of the product to buy' },
      quantity: { type: Type.NUMBER, description: 'How many items they want to buy' },
    },
    required: ['product_id', 'quantity'],
  },
};

export async function processWhatsAppChat(userMessage: string, senderPhone: string): Promise<string> {
  const supabase = createServerClient();

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userMessage,
      config: {
        systemInstruction: `You are a friendly, enthusiastic sales assistant for 'HiFi', a clothing and custom design brand.
Your goal is to chat casually with customers on WhatsApp, answer their questions, and help them find products.
Always keep your responses short, conversational, and formatted nicely for WhatsApp (use *bold* and emojis).
If a user wants to explore products, use 'search_products'.
If a user wants to buy a specific product you just showed them, use 'create_order' to instantly generate a payment link for them. Never ask for their address, tell them they can fill it out on the payment page.
If they ask for a custom design, tell them to simply send an image to this chat and you will process it automatically.`,
        tools: [{ functionDeclarations: [searchProductsDeclaration as any, createOrderDeclaration as any] }],
        temperature: 0.7,
      },
    });

    if (response.functionCalls && response.functionCalls.length > 0) {
      const call = response.functionCalls[0];
      
      if (call.name === 'search_products') {
        const args = call.args as any;
        let query = supabase.from('products').select('id, name, base_price, description').eq('is_active', true);
        if (args.category) query = query.ilike('category', `%${args.category}%`);
        if (args.color) query = query.or(`name.ilike.%${args.color}%,description.ilike.%${args.color}%`);
        if (args.max_price) query = query.lte('base_price', args.max_price);
        const { data: products } = await query.limit(5);

        const secondResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            { role: 'user', parts: [{ text: userMessage }] },
            { role: 'model', parts: [{ functionCall: call }] },
            { role: 'function', parts: [{ functionResponse: { name: 'search_products', response: { products: products || [] } } }] }
          ],
          config: { systemInstruction: `You are a friendly sales assistant for HiFi. Present the found products to the user nicely with emojis. Ask them if they'd like to order any of them right now.` }
        });
        return secondResponse.text || "I couldn't find any products matching that description, sorry!";
      }

      if (call.name === 'create_order') {
        const { product_id, quantity } = call.args as { product_id: string, quantity: number };
        
        // 1. Fetch Product
        const { data: product } = await supabase.from('products').select('*').eq('id', product_id).single();
        if (!product) return "Sorry, I couldn't find that product in our system anymore.";

        // 2. Create Order in DB
        const { data: userProfile } = await supabase.from('users').select('id').eq('phone', senderPhone).maybeSingle();
        
        const totalAmount = product.base_price * quantity;
        
        const { data: newOrder, error: orderError } = await supabase.from('orders').insert({
          user_id: userProfile?.id || null, // Guest checkout if no profile
          total_amount: totalAmount,
          currency: 'INR',
          status: 'pending_payment',
          payment_status: 'pending',
          shipping_fee: 0,
        }).select('id').single();

        if (orderError || !newOrder) return "I had a technical hiccup creating your order. Please try again!";

        // Insert Order Items
        await supabase.from('order_items').insert({
          order_id: newOrder.id,
          product_id: product.id,
          quantity: quantity,
          unit_price: product.base_price,
          total_price: totalAmount,
        });

        // 3. Create Razorpay Payment Link
        const paymentLink = await createPaymentLink(
          newOrder.id, 
          totalAmount, 
          senderPhone, 
          `Payment for ${quantity}x ${product.title}`
        );

        if (!paymentLink) {
          return "I created your order, but I couldn't generate the payment link. Please contact support!";
        }

        const finalMsg = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            { role: 'user', parts: [{ text: userMessage }] },
            { role: 'model', parts: [{ functionCall: call }] },
            { role: 'function', parts: [{ functionResponse: { name: 'create_order', response: { success: true, payment_link: paymentLink } } }] }
          ],
          config: { systemInstruction: `Tell the user you've created their order! Give them the payment link (${paymentLink}) and tell them to click it to securely pay via Razorpay. Remind them they can enter their shipping address on the checkout page.` }
        });
        
        return finalMsg.text || `Great! Please click here to pay and enter your shipping address: ${paymentLink}`;
      }
    }

    return response.text || "I'm having a little trouble understanding right now, but I'm here to help!";
  } catch (error) {
    console.error('Gemini API Error:', error);
    return "Sorry, our AI assistant is currently taking a coffee break! ☕ Please try again in a moment.";
  }
}
