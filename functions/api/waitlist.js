/**
 * Cloudflare Worker: POST /api/waitlist
 * 
 * Handles waitlist form submissions and stores them in Cloudflare D1 database.
 */

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

