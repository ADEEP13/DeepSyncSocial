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
  // Professional HTML template with personalized name
  const htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to DeepSync Social</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f9fafb;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .email-header {
            background: linear-gradient(135deg, #ff6b35 0%, #e55a2b 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        .email-header h1 {
            font-size: 28px;
            font-weight: 700;
            margin: 0 0 10px 0;
        }
        .email-header p {
            font-size: 14px;
            opacity: 0.9;
            margin: 0;
        }
        .email-icon {
            font-size: 48px;
            margin-bottom: 15px;
        }
        .email-content {
            padding: 40px 30px;
            background-color: #f9fafb;
        }
        .email-content h2 {
            font-size: 20px;
            color: #111827;
            margin-bottom: 20px;
            font-weight: 600;
        }
        .email-content p {
            font-size: 14px;
            color: #6b7280;
            line-height: 1.8;
            margin-bottom: 15px;
        }
        .email-content strong {
            color: #111827;
            font-weight: 600;
        }
        .feature-section {
            background-color: white;
            padding: 25px;
            border-radius: 6px;
            margin: 25px 0;
            border-left: 4px solid #ff6b35;
        }
        .feature-section h3 {
            font-size: 16px;
            color: #ff6b35;
            margin-bottom: 10px;
            font-weight: 600;
        }
        .feature-section p {
            font-size: 13px;
            color: #6b7280;
            margin: 0;
        }
        .cta-button {
            display: inline-block;
            background-color: #ff6b35;
            color: white;
            padding: 12px 32px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 600;
            font-size: 14px;
            margin: 25px 0;
        }
        .divider {
            border-top: 1px solid #e5e7eb;
            margin: 30px 0;
        }
        .social-links {
            text-align: center;
            margin: 20px 0;
        }
        .social-link {
            display: inline-block;
            width: 40px;
            height: 40px;
            background-color: #f3f4f6;
            border-radius: 50%;
            line-height: 40px;
            text-align: center;
            margin: 0 8px;
            text-decoration: none;
            color: #ff6b35;
            font-weight: 600;
        }
        .email-footer {
            background-color: #111827;
            color: #d1d5db;
            padding: 30px;
            text-align: center;
            font-size: 12px;
        }
        .email-footer p {
            margin: 5px 0;
            color: #d1d5db;
        }
        .email-footer a {
            color: #ff6b35;
            text-decoration: none;
        }
        .footer-divider {
            border-top: 1px solid #374151;
            margin: 15px 0;
        }
    </style>
</head>
<body>
    <table cellpadding="0" cellspacing="0" width="100%" style="background-color: #f9fafb;">
        <tr>
            <td align="center" style="padding: 20px;">
                <div class="email-container">
                    <!-- Header -->
                    <table cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                            <td class="email-header">
                                <div class="email-icon">🚀</div>
                                <h1>Welcome to DeepSync Social!</h1>
                                <p>You're now part of our community</p>
                            </td>
                        </tr>
                    </table>

                    <!-- Content -->
                    <table cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                            <td class="email-content">
                                <h2>Hi <strong>${name}</strong>,</h2>
                                
                                <p>Thank you for joining our waitlist! We're thrilled to have you as part of the DeepSync Social community.</p>
                                
                                <p>We're building something special – <strong>the future of synchronized content sharing</strong>. This platform will revolutionize how creators and businesses collaborate and amplify their message.</p>

                                <!-- Feature Section -->
                                <div class="feature-section">
                                    <h3>✨ What's Coming</h3>
                                    <p>Stay tuned for exciting updates about features, beta access, and exclusive opportunities for our early supporters.</p>
                                </div>

                                <div class="feature-section">
                                    <h3>💬 Questions?</h3>
                                    <p>Feel free to reach out to us anytime. We'd love to hear your thoughts, questions, or feedback about DeepSync Social.</p>
                                </div>

                                <center>
                                    <a href="https://deepsyncsocial.tech" class="cta-button">Visit Our Website</a>
                                </center>

                                <div class="divider"></div>

                                <p style="font-size: 13px; text-align: center; color: #9ca3af;">
                                    Follow us for the latest updates
                                </p>

                                <div class="social-links">
                                    <a href="https://twitter.com/deepsyncsocial" class="social-link">𝕏</a>
                                    <a href="https://linkedin.com/company/deepsyncsocial" class="social-link">in</a>
                                    <a href="https://instagram.com/deepsyncsocial" class="social-link">📷</a>
                                </div>

                                <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 25px;">
                                    We're excited to share what we've been building. This is just the beginning!
                                </p>
                            </td>
                        </tr>
                    </table>

                    <!-- Footer -->
                    <table cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                            <td class="email-footer">
                                <p>© 2025 DeepSync Social. All rights reserved.</p>
                                <div class="footer-divider"></div>
                                <p>
                                    <a href="https://deepsyncsocial.tech">Website</a> • 
                                    <a href="https://deepsyncsocial.tech#privacy">Privacy Policy</a> • 
                                    <a href="https://deepsyncsocial.tech#contact">Contact Us</a>
                                </p>
                                <p style="margin-top: 10px;">
                                    Have feedback? <a href="mailto:support@deepsyncsocial.tech">Let us know</a>
                                </p>
                            </td>
                        </tr>
                    </table>
                </div>
            </td>
        </tr>
    </table>
</body>
</html>`;

  return {
    from: 'DeepSync Social <noreply@deepsyncsocial.tech>',
    to: email,
    subject: `Welcome to DeepSync Social, ${name}!`,
    html: htmlTemplate,
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

    // Route: POST /api/send-bulk-email (send emails to all users)
    if (path === '/api/send-bulk-email' && request.method === 'POST') {
      return handleBulkEmail(request, env);
    }

    // Route: GET /api/test (test endpoint)
    if (path === '/api/test' && request.method === 'GET') {
      return jsonResponse({ success: true, message: 'API is working', time: new Date().toISOString() });
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

async function handleBulkEmail(request, env) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json; charset=utf-8',
  };

  try {
    const db = env.DB;
    if (!db) {
      return new Response(
        JSON.stringify({ success: false, message: 'Database not available' }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Fetch all users from waitlist
    const users = await db
      .prepare('SELECT name, email FROM waitlist ORDER BY created_at DESC')
      .all();

    if (!users.results || users.results.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No users to email', sent: 0 }),
        { status: 200, headers: corsHeaders }
      );
    }

    // Send emails to all users
    const resend = new ResendClient(env.RESEND_API_KEY);
    let successCount = 0;
    let failureCount = 0;
    const failures = [];

    for (const user of users.results) {
      const emailResult = await resend.send(
        generateWelcomeEmail(user.name, user.email)
      );

      if (emailResult.success) {
        successCount++;
        console.log(`Email sent to ${user.email}`);
      } else {
        failureCount++;
        failures.push({ email: user.email, error: emailResult.error });
        console.warn(`Failed to send email to ${user.email}:`, emailResult.error);
      }

      // Add slight delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Bulk email campaign completed`,
        total: users.results.length,
        sent: successCount,
        failed: failureCount,
        failures: failureCount > 0 ? failures : [],
      }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    console.error('Bulk email error:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Server error', error: error.message }),
      { status: 500, headers: corsHeaders }
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

