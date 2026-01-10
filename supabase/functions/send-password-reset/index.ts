import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
  resetLink: string;
  userName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-password-reset function called");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, resetLink, userName }: PasswordResetRequest = await req.json();

    // Input validation
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      console.error("Invalid email provided");
      return new Response(
        JSON.stringify({ error: "Invalid email address" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!resetLink) {
      console.error("Reset link not provided");
      return new Response(
        JSON.stringify({ error: "Reset link is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Sending password reset email to:", email);

    const displayName = userName || email.split('@')[0];

    const emailResponse = await resend.emails.send({
      from: "DAISY <onboarding@resend.dev>",
      to: [email],
      subject: "Reset Your DAISY Password",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9f5f3;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header with DAISY branding -->
            <div style="background: linear-gradient(135deg, #d4a5a5 0%, #c9a5a5 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 36px; font-weight: 300; letter-spacing: 4px;">DAISY</h1>
              <p style="color: #ffffff; margin: 8px 0 0; font-size: 14px; opacity: 0.9;">Seamless comfort anytime</p>
            </div>
            
            <div style="padding: 40px 30px;">
              <!-- Icon -->
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #d4a5a5 0%, #e8c4c4 100%); border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
                  <span style="font-size: 36px;">🔐</span>
                </div>
              </div>
              
              <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #333; margin: 0 0 8px; font-size: 26px; font-weight: 600;">Password Reset Request</h2>
                <p style="color: #666; margin: 0; font-size: 16px;">Hi ${displayName}, we received a request to reset your password.</p>
              </div>
              
              <!-- Reset Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #d4a5a5 0%, #c9a5a5 100%); color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-size: 16px; font-weight: 600; letter-spacing: 1px; box-shadow: 0 4px 15px rgba(212, 165, 165, 0.4);">
                  Reset My Password
                </a>
              </div>
              
              <!-- Alternative link -->
              <div style="background-color: #f9f5f3; padding: 20px; border-radius: 12px; margin: 24px 0;">
                <p style="margin: 0 0 12px; font-size: 14px; color: #666; text-align: center;">If the button doesn't work, copy and paste this link:</p>
                <p style="margin: 0; font-size: 12px; color: #d4a5a5; word-break: break-all; text-align: center;">
                  ${resetLink}
                </p>
              </div>
              
              <!-- Security Notice -->
              <div style="border-left: 4px solid #d4a5a5; padding-left: 16px; margin: 24px 0;">
                <p style="margin: 0; color: #666; font-size: 14px; line-height: 1.6;">
                  <strong style="color: #333;">⚡ This link expires in 1 hour</strong><br>
                  If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.
                </p>
              </div>
              
              <!-- Help Section -->
              <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #eee;">
                <p style="color: #999; font-size: 13px; margin: 0;">
                  Need help? Contact us on WhatsApp for immediate assistance.
                </p>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #333; padding: 24px; text-align: center;">
              <p style="color: #d4a5a5; margin: 0 0 4px; font-size: 20px; letter-spacing: 3px; font-weight: 300;">DAISY</p>
              <p style="color: #999; margin: 0; font-size: 12px;">Delicate Details, Distinctive You</p>
              <p style="color: #666; margin: 12px 0 0; font-size: 11px;">© 2024 DAISY. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Password reset email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-password-reset function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
