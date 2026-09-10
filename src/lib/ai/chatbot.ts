import { GoogleGenAI } from '@google/genai';
import { createServerClient } from '@/lib/supabase/server';

// Initialize the Gemini client
// Note: Requires GEMINI_API_KEY in .env
const ai = new GoogleGenAI({});

// Tool schema for Gemini to search products
const searchProductsDeclaration = {
  name: 'search_products',
  description: 'Search the HiFi product catalog by category, color, or price.',
  parameters: {
    type: 'OBJECT',
    properties: {
      category: {
        type: 'STRING',
        description: 'Product category (e.g., shirts, pants, accessories).',
      },
      color: {
        type: 'STRING',
        description: 'Product color (e.g., red, black, blue).',
      },
      max_price: {
        type: 'NUMBER',
        description: 'Maximum price in INR.',
      },
    },
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
If a user wants to buy something, encourage them and provide a link to our website: https://hificustom.goatech.tech
If they ask for specific products, use the search_products tool to find them in our database.`,
        tools: [{ functionDeclarations: [searchProductsDeclaration] }],
        temperature: 0.7,
      },
    });

    // Check if the model decided to call a function
    if (response.functionCalls && response.functionCalls.length > 0) {
      const call = response.functionCalls[0];
      if (call.name === 'search_products') {
        const args = call.args as { category?: string; color?: string; max_price?: number };
        
        // Execute the database query
        let query = supabase.from('products').select('id, name, price, description, images').eq('is_active', true);
        
        if (args.category) {
          query = query.ilike('category', `%${args.category}%`);
        }
        if (args.color) {
          // Assuming color is in the name or description for now
          query = query.or(`name.ilike.%${args.color}%,description.ilike.%${args.color}%`);
        }
        if (args.max_price) {
          query = query.lte('price', args.max_price);
        }

        const { data: products } = await query.limit(5);

        // Send the result back to Gemini to generate a final response
        const secondResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            { role: 'user', parts: [{ text: userMessage }] },
            { role: 'model', parts: [{ functionCall: call }] },
            {
              role: 'function',
              parts: [{
                functionResponse: {
                  name: 'search_products',
                  response: { products: products || [] },
                }
              }]
            }
          ],
          config: {
            systemInstruction: `You are a friendly sales assistant for HiFi. Present the found products nicely to the user. Include the price (₹) and a brief description. Tell them they can purchase at https://hificustom.goatech.tech/products/[id]`,
          }
        });

        return secondResponse.text || "I couldn't find any products matching that description, sorry!";
      }
    }

    // Normal text response
    return response.text || "I'm having a little trouble understanding right now, but I'm here to help!";
  } catch (error) {
    console.error('Gemini API Error:', error);
    return "Sorry, our AI assistant is currently taking a coffee break! ☕ Please try again in a moment.";
  }
}
