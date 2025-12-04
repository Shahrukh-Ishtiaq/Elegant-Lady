import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple in-memory rate limiting (resets on function cold start)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 5; // max 5 emails per email address
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in ms

function isRateLimited(email: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(email);
  
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(email, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }
  
  if (entry.count >= RATE_LIMIT) {
    return true;
  }
  
  entry.count++;
  return false;
}

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
  image?: string;
}

interface ShippingAddress {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}

interface OrderEmailRequest {
  orderId: string;
  customerEmail: string;
  customerName: string;
  items: OrderItem[];
  total: number;
  shippingAddress: ShippingAddress;
  paymentMethod: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-order-email function called");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      orderId, 
      customerEmail, 
      customerName, 
      items, 
      total, 
      shippingAddress, 
      paymentMethod 
    }: OrderEmailRequest = await req.json();

    // Input validation
    if (!orderId || typeof orderId !== 'string' || orderId.length < 10) {
      console.error("Invalid orderId provided");
      return new Response(
        JSON.stringify({ error: "Invalid order ID" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!customerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      console.error("Invalid email provided");
      return new Response(
        JSON.stringify({ error: "Invalid email address" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Rate limiting check
    if (isRateLimited(customerEmail)) {
      console.warn(`Rate limit exceeded for email: ${customerEmail}`);
      return new Response(
        JSON.stringify({ error: "Too many email requests. Please try again later." }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify order exists in database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, status")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      console.error("Order not found:", orderId);
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Processing order email for:", customerEmail);

    const itemsHtml = items.map(item => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">
          <p style="margin: 0; font-weight: 600; color: #333;">${item.name}</p>
          <p style="margin: 4px 0 0; font-size: 12px; color: #666;">
            ${item.selectedSize ? `Size: ${item.selectedSize}` : ''} 
            ${item.selectedColor ? `| Color: ${item.selectedColor}` : ''}
          </p>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; font-weight: 600;">PKR ${(item.price * item.quantity).toLocaleString()}</td>
      </tr>
    `).join('');

    const emailResponse = await resend.emails.send({
      from: "Elegant Lady <onboarding@resend.dev>",
      to: [customerEmail],
      subject: `Order Confirmed - #${orderId.slice(0, 8).toUpperCase()}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9f5f3;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <div style="background: linear-gradient(135deg, #d4a5a5 0%, #c9a5a5 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 300; letter-spacing: 2px;">Elegant Lady</h1>
              <p style="color: #ffffff; margin: 8px 0 0; font-size: 14px; opacity: 0.9;">Seamless comfort anytime</p>
            </div>
            
            <div style="padding: 40px 30px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #333; margin: 0 0 8px; font-size: 24px;">Thank You for Your Order!</h2>
                <p style="color: #666; margin: 0;">Hi ${customerName}, your order has been confirmed.</p>
              </div>
              
              <div style="background-color: #f9f5f3; padding: 20px; border-radius: 12px; margin-bottom: 24px;">
                <p style="margin: 0 0 8px; font-size: 14px; color: #666;">Order Number</p>
                <p style="margin: 0; font-size: 18px; font-weight: 600; color: #333; letter-spacing: 1px;">#${orderId.slice(0, 8).toUpperCase()}</p>
              </div>
              
              <h3 style="color: #333; margin: 0 0 16px; font-size: 18px; border-bottom: 2px solid #d4a5a5; padding-bottom: 8px;">Order Details</h3>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                <thead>
                  <tr style="background-color: #f9f5f3;">
                    <th style="padding: 12px; text-align: left; font-weight: 600; color: #333;">Item</th>
                    <th style="padding: 12px; text-align: center; font-weight: 600; color: #333;">Qty</th>
                    <th style="padding: 12px; text-align: right; font-weight: 600; color: #333;">Price</th>
                  </tr>
                </thead>
                <tbody>${itemsHtml}</tbody>
                <tfoot>
                  <tr>
                    <td colspan="2" style="padding: 16px 12px; text-align: right; font-weight: 600; font-size: 18px; color: #333;">Total</td>
                    <td style="padding: 16px 12px; text-align: right; font-weight: 700; font-size: 20px; color: #d4a5a5;">PKR ${total.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
              
              <div style="margin-bottom: 24px;">
                <h4 style="color: #333; margin: 0 0 12px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Shipping Address</h4>
                <p style="color: #666; margin: 0; line-height: 1.6;">
                  ${shippingAddress.firstName} ${shippingAddress.lastName}<br>
                  ${shippingAddress.address}<br>
                  ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zip}<br>
                  Phone: ${shippingAddress.phone}
                </p>
              </div>
              
              <div style="margin-bottom: 24px;">
                <h4 style="color: #333; margin: 0 0 12px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Payment Method</h4>
                <p style="color: #666; margin: 0;">${paymentMethod === 'cod' ? 'Cash on Delivery' : 'Credit/Debit Card'}</p>
              </div>
              
              <div style="background-color: #f9f5f3; padding: 20px; border-radius: 12px; text-align: center;">
                <p style="margin: 0; color: #666; font-size: 14px;">
                  Questions about your order? Contact us at support@elegantlady.com
                </p>
              </div>
            </div>
            
            <div style="background-color: #333; padding: 24px; text-align: center;">
              <p style="color: #fff; margin: 0 0 8px; font-size: 18px; letter-spacing: 2px;">Elegant Lady</p>
              <p style="color: #999; margin: 0; font-size: 12px;">© 2024 Elegant Lady. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-order-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);