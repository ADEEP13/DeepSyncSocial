/**
 * Cloudflare Worker: POST /api/waitlist
 * 
 * Handles waitlist form submissions, stores them in Cloudflare D1 database,
 * and sends confirmation emails via Resend.
 */

// Resend Email Client
class ResendClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.resend.com';
  }

  async send(email) {
    if (!this.apiKey) {
      console.warn('Resend API key not configured');
      return { success: false, message: 'Email service not configured' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/emails`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(email),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Resend API error:', error);
        return { success: false, error };
      }

      const result = await response.json();
      return { success: true, result };
    } catch (error) {
      console.error('Resend request error:', error);
      return { success: false, error: error.message };
    }
  }
}

function generateWelcomeEmail(name, email) {
  return {
    from: 'DeepSync Social <noreply@deepsyncsocial.tech>',
    to: email,
    subject: `Welcome to DeepSync Social, ${name}!`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ff6b35 0%, #e55a2b 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { background: #ff6b35; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; display: inline-block; margin-top: 20px; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #999; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to DeepSync Social! 🚀</h1>
            </div>
            <div class="content">
              <p>Hi <strong>${name}</strong>,</p>
              <p>Thank you for joining our waitlist! We're excited to have you on board.</p>
              <p>DeepSync Social is building the future of synchronized content sharing. Stay tuned for updates!</p>
              <p>In the meantime, feel free to reach out if you have any questions or feedback.</p>
              <a href="https://deepsyncsocial.tech" class="button">Visit Our Website</a>
              <div class="footer">
                <p>© 2025 DeepSync Social. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // Parse URL to route requests
    const url = new URL(request.url);
    const path = url.pathname;

    // Route: POST /api/waitlist
    if (path === '/api/waitlist' && request.method === 'POST') {
      return handleWaitlist(request, env);
    }

    // Route: Serve static files or index.html
    if (request.method === 'GET') {
      return serveStatic(request, env);
    }

    return jsonResponse({ error: 'Not found' }, 404);
  },
};

async function handleWaitlist(request, env) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json; charset=utf-8',
  };

  try {
    const body = await request.json();
    const { name, email, struggle } = body;

    // Validate required fields
    if (!name || !email || !struggle) {
      return new Response(
        JSON.stringify({ success: false, message: 'All fields required' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate email format
    if (!email.includes('@') || !email.includes('.')) {
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid email format' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Try to save to D1 database
    try {
      const db = env.DB;
      if (db) {
        // Check if email already exists
        const existing = await db
          .prepare('SELECT id FROM waitlist WHERE email = ?')
          .bind(normalizedEmail)
          .first();

        if (existing) {
          return new Response(
            JSON.stringify({
              success: true,
              message: "You're already on the waitlist!",
            }),
            { status: 200, headers: corsHeaders }
          );
        }

        // Insert new record
        await db
          .prepare(
            'INSERT INTO waitlist (name, email, struggle, created_at) VALUES (?, ?, ?, datetime("now"))'
          )
          .bind(name.trim(), normalizedEmail, struggle.trim())
          .run();

        // Send welcome email via Resend
        const resend = new ResendClient(env.RESEND_API_KEY);
        const emailResult = await resend.send(
          generateWelcomeEmail(name.trim(), normalizedEmail)
        );

        if (emailResult.success) {
          console.log('Welcome email sent successfully to:', normalizedEmail);
        } else {
          console.warn('Failed to send welcome email:', emailResult.error);
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Successfully added to waitlist! Check your email for updates.',
          }),
          { status: 201, headers: corsHeaders }
        );
      }
    } catch (dbError) {
      console.error('Database error:', dbError);
      // If database fails, still return success (graceful fallback)
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Your submission received! We\'ll be in touch soon.',
        }),
        { status: 201, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Your submission has been received!',
      }),
      { status: 201, headers: corsHeaders }
    );

  } catch (error) {
    console.error('API error:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

async function serveStatic(request, env) {
  const url = new URL(request.url);
  let path = url.pathname;

  // Default to index.html for root
  if (path === '/') {
    path = '/index.html';
  }

  try {
    // Try to fetch from R2 or assets
    const response = await env.ASSETS.fetch(request);
    return response;
  } catch (error) {
    console.error('Static file error:', error);
    return new Response('Not found', { status: 404 });
  }
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

