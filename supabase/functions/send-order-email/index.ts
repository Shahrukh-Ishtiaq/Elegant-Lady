import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// HTML entity escaping for XSS prevention in email templates
function escapeHtml(unsafe: string): string {
  if (typeof unsafe !== 'string') return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Sanitize a string for safe use in HTML email templates
function sanitizeForEmail(input: string | undefined | null): string {
  if (!input || typeof input !== 'string') return '';
  // Trim, limit length, and escape HTML
  return escapeHtml(input.trim().substring(0, 500));
}

// Sanitize numeric values
function sanitizeNumber(input: number | string): number {
  const num = typeof input === 'string' ? parseFloat(input) : input;
  return isNaN(num) ? 0 : num;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Admin email for notifications
const ADMIN_EMAIL = "admin@daisy.com";

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

async function sendAdminNotification(
  orderId: string,
  customerName: string,
  customerEmail: string,
  items: OrderItem[],
  total: number,
  shippingAddress: ShippingAddress,
  paymentMethod: string,
  adminEmail: string
) {
  console.log("Sending admin notification to:", adminEmail);
  
  // Sanitize all user inputs for safe HTML rendering
  const safeCustomerName = sanitizeForEmail(customerName);
  const safeCustomerEmail = sanitizeForEmail(customerEmail);
  const safeOrderId = sanitizeForEmail(orderId);
  const safeTotal = sanitizeNumber(total);
  const safePaymentMethod = sanitizeForEmail(paymentMethod);
  
  // Sanitize shipping address
  const safeAddress = {
    firstName: sanitizeForEmail(shippingAddress.firstName),
    lastName: sanitizeForEmail(shippingAddress.lastName),
    phone: sanitizeForEmail(shippingAddress.phone),
    address: sanitizeForEmail(shippingAddress.address),
    city: sanitizeForEmail(shippingAddress.city),
    state: sanitizeForEmail(shippingAddress.state),
    zip: sanitizeForEmail(shippingAddress.zip),
  };
  
  // Sanitize item names and ensure numeric values are safe
  const itemsList = items.map(item => {
    const safeName = sanitizeForEmail(item.name);
    const safeQty = sanitizeNumber(item.quantity);
    const safePrice = sanitizeNumber(item.price);
    return `• ${safeName} (Qty: ${safeQty}) - PKR ${(safePrice * safeQty).toLocaleString()}`;
  }).join('<br>');

  try {
    const response = await resend.emails.send({
      from: "DAISY Orders <onboarding@resend.dev>",
      to: [adminEmail],
      subject: `🛒 New Order #${safeOrderId.slice(0, 8).toUpperCase()} - PKR ${safeTotal.toLocaleString()}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0f4f8;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px 20px; text-align: center;">
              <h1 style="color: #d4a5a5; margin: 0; font-size: 28px; font-weight: 600; letter-spacing: 1px;">🔔 NEW ORDER ALERT</h1>
              <p style="color: #ffffff; margin: 8px 0 0; font-size: 14px;">Action required - New order received</p>
            </div>
            
            <div style="padding: 30px;">
              <div style="background: linear-gradient(135deg, #d4a5a5 0%, #e8c4c4 100%); padding: 20px; border-radius: 12px; margin-bottom: 24px; text-align: center;">
                <p style="margin: 0; font-size: 14px; color: #333; font-weight: 600;">Order Number</p>
                <p style="margin: 8px 0 0; font-size: 24px; font-weight: 700; color: #1a1a2e; letter-spacing: 2px;">#${safeOrderId.slice(0, 8).toUpperCase()}</p>
                <p style="margin: 12px 0 0; font-size: 28px; font-weight: 700; color: #1a1a2e;">PKR ${safeTotal.toLocaleString()}</p>
              </div>
              
              <div style="margin-bottom: 24px;">
                <h3 style="color: #333; margin: 0 0 12px; font-size: 16px; border-bottom: 2px solid #d4a5a5; padding-bottom: 8px;">👤 Customer Details</h3>
                <p style="margin: 0; line-height: 1.8; color: #555;">
                  <strong>Name:</strong> ${safeCustomerName}<br>
                  <strong>Email:</strong> ${safeCustomerEmail}<br>
                  <strong>Phone:</strong> ${safeAddress.phone}
                </p>
              </div>
              
              <div style="margin-bottom: 24px;">
                <h3 style="color: #333; margin: 0 0 12px; font-size: 16px; border-bottom: 2px solid #d4a5a5; padding-bottom: 8px;">📦 Order Items</h3>
                <p style="margin: 0; line-height: 1.8; color: #555;">${itemsList}</p>
              </div>
              
              <div style="margin-bottom: 24px;">
                <h3 style="color: #333; margin: 0 0 12px; font-size: 16px; border-bottom: 2px solid #d4a5a5; padding-bottom: 8px;">📍 Shipping Address</h3>
                <p style="margin: 0; line-height: 1.6; color: #555;">
                  ${safeAddress.firstName} ${safeAddress.lastName}<br>
                  ${safeAddress.address}<br>
                  ${safeAddress.city}, ${safeAddress.state} ${safeAddress.zip}
                </p>
              </div>
              
              <div style="margin-bottom: 24px;">
                <h3 style="color: #333; margin: 0 0 12px; font-size: 16px; border-bottom: 2px solid #d4a5a5; padding-bottom: 8px;">💳 Payment Method</h3>
                <p style="margin: 0; color: #555; font-weight: 600;">
                  ${safePaymentMethod === 'cod' ? '💵 Cash on Delivery' : '💳 Credit/Debit Card'}
                </p>
              </div>
              
              <div style="background-color: #fff3cd; padding: 16px; border-radius: 8px; border-left: 4px solid #ffc107;">
                <p style="margin: 0; color: #856404; font-weight: 600;">⚡ Action Required</p>
                <p style="margin: 8px 0 0; color: #856404; font-size: 14px;">Please process this order in your admin dashboard.</p>
              </div>
            </div>
            
            <div style="background-color: #1a1a2e; padding: 20px; text-align: center;">
              <p style="color: #d4a5a5; margin: 0 0 4px; font-size: 16px; letter-spacing: 2px; font-weight: 600;">DAISY</p>
              <p style="color: #888; margin: 0; font-size: 11px;">Admin Order Notification</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
    
    console.log("Admin notification sent:", response);
    return response;
  } catch (error) {
    console.error("Error sending admin notification:", error);
    throw error;
  }
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-order-email function called");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // JWT Authentication - verify the user is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error("Missing or invalid Authorization header");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Create client with user's auth token for verification
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify the JWT token by getting user
    const { data: userData, error: userError } = await supabaseAuth.auth.getUser();
    
    if (userError || !userData?.user) {
      console.error("JWT verification failed:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const userId = userData.user.id;
    console.log("Authenticated user:", userId);

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

    // Use service role client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Database-backed rate limiting using check_rate_limit function
    const { data: rateLimitAllowed, error: rateLimitError } = await supabase.rpc(
      'check_rate_limit',
      {
        p_identifier: customerEmail,
        p_endpoint: 'send_order_email',
        p_max_requests: 5,
        p_window_minutes: 60
      }
    );

    if (rateLimitError) {
      console.error("Rate limit check failed:", rateLimitError);
      // Continue on error - don't block legitimate requests due to rate limit errors
    } else if (rateLimitAllowed === false) {
      console.warn(`Rate limit exceeded for email: ${customerEmail}`);
      return new Response(
        JSON.stringify({ error: "Too many email requests. Please try again later." }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify order exists in database and belongs to the authenticated user
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, status, user_id")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      console.error("Order not found:", orderId);
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify the order belongs to the authenticated user
    if (order.user_id !== userId) {
      console.error("User not authorized to access this order:", { userId, orderUserId: order.user_id });
      return new Response(
        JSON.stringify({ error: "Unauthorized - order does not belong to user" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Processing order email for:", customerEmail);

    // Sanitize all user inputs for the customer email
    const safeCustomerName = sanitizeForEmail(customerName);
    const safeOrderId = sanitizeForEmail(orderId);
    const safeTotal = sanitizeNumber(total);
    const safePaymentMethod = sanitizeForEmail(paymentMethod);
    
    // Sanitize shipping address for customer email
    const safeAddress = {
      firstName: sanitizeForEmail(shippingAddress.firstName),
      lastName: sanitizeForEmail(shippingAddress.lastName),
      phone: sanitizeForEmail(shippingAddress.phone),
      address: sanitizeForEmail(shippingAddress.address),
      city: sanitizeForEmail(shippingAddress.city),
      state: sanitizeForEmail(shippingAddress.state),
      zip: sanitizeForEmail(shippingAddress.zip),
    };

    const itemsHtml = items.map(item => {
      const safeName = sanitizeForEmail(item.name);
      const safeSize = item.selectedSize ? sanitizeForEmail(item.selectedSize) : '';
      const safeColor = item.selectedColor ? sanitizeForEmail(item.selectedColor) : '';
      const safeQty = sanitizeNumber(item.quantity);
      const safePrice = sanitizeNumber(item.price);
      return `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">
          <p style="margin: 0; font-weight: 600; color: #333;">${safeName}</p>
          <p style="margin: 4px 0 0; font-size: 12px; color: #666;">
            ${safeSize ? `Size: ${safeSize}` : ''} 
            ${safeColor ? `| Color: ${safeColor}` : ''}
          </p>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${safeQty}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; font-weight: 600;">PKR ${(safePrice * safeQty).toLocaleString()}</td>
      </tr>
    `;
    }).join('');

    // Send customer confirmation email
    const emailResponse = await resend.emails.send({
      from: "DAISY <onboarding@resend.dev>",
      to: [customerEmail],
      subject: `Order Confirmed - #${safeOrderId.slice(0, 8).toUpperCase()}`,
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
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 300; letter-spacing: 2px;">DAISY</h1>
              <p style="color: #ffffff; margin: 8px 0 0; font-size: 14px; opacity: 0.9;">Seamless comfort anytime</p>
            </div>
            
            <div style="padding: 40px 30px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #333; margin: 0 0 8px; font-size: 24px;">Thank You for Your Order!</h2>
                <p style="color: #666; margin: 0;">Hi ${safeCustomerName}, your order has been confirmed.</p>
              </div>
              
              <div style="background-color: #f9f5f3; padding: 20px; border-radius: 12px; margin-bottom: 24px;">
                <p style="margin: 0 0 8px; font-size: 14px; color: #666;">Order Number</p>
                <p style="margin: 0; font-size: 18px; font-weight: 600; color: #333; letter-spacing: 1px;">#${safeOrderId.slice(0, 8).toUpperCase()}</p>
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
                    <td style="padding: 16px 12px; text-align: right; font-weight: 700; font-size: 20px; color: #d4a5a5;">PKR ${safeTotal.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
              
              <div style="margin-bottom: 24px;">
                <h4 style="color: #333; margin: 0 0 12px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Shipping Address</h4>
                <p style="color: #666; margin: 0; line-height: 1.6;">
                  ${safeAddress.firstName} ${safeAddress.lastName}<br>
                  ${safeAddress.address}<br>
                  ${safeAddress.city}, ${safeAddress.state} ${safeAddress.zip}<br>
                  Phone: ${safeAddress.phone}
                </p>
              </div>
              
              <div style="margin-bottom: 24px;">
                <h4 style="color: #333; margin: 0 0 12px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Payment Method</h4>
                <p style="color: #666; margin: 0;">${safePaymentMethod === 'cod' ? 'Cash on Delivery' : 'Credit/Debit Card'}</p>
              </div>
              
              <div style="background-color: #f9f5f3; padding: 20px; border-radius: 12px; text-align: center;">
                <p style="margin: 0; color: #666; font-size: 14px;">
                  Questions about your order? Contact us on WhatsApp!
                </p>
              </div>
            </div>
            
            <div style="background-color: #333; padding: 24px; text-align: center;">
              <p style="color: #fff; margin: 0 0 8px; font-size: 18px; letter-spacing: 2px;">DAISY</p>
              <p style="color: #999; margin: 0; font-size: 12px;">© 2024 DAISY. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Customer email sent successfully:", emailResponse);

    // Send admin notification email - always use server-side configured ADMIN_EMAIL
    try {
      await sendAdminNotification(
        orderId,
        customerName,
        customerEmail,
        items,
        total,
        shippingAddress,
        paymentMethod,
        ADMIN_EMAIL
      );
    } catch (adminError) {
      console.error("Admin notification failed but customer email sent:", adminError);
      // Don't fail the whole request if admin email fails
    }

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
