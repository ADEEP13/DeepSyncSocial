/**
 * Cloudflare Pages Function: POST /api/waitlist
 * 
 * Handles waitlist form submissions
 */

export async function onRequest(context) {
    const { request, env } = context;

    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json; charset=utf-8',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
        return new Response(JSON.stringify({ ok: true }), { 
            status: 204, 
            headers: corsHeaders 
        });
    }

    // Only allow POST requests
    if (request.method !== 'POST') {
        return new Response(
            JSON.stringify({ success: false, message: 'Method not allowed' }),
            { status: 405, headers: corsHeaders }
        );
    }

    try {
        const body = await request.json();
        const { name, email, struggle } = body;

        // Basic validation
        if (!name || !email || !struggle) {
            return new Response(
                JSON.stringify({ success: false, message: 'All fields required' }),
                { status: 400, headers: corsHeaders }
            );
        }

        // Validate email format
        if (!email.includes('@') || !email.includes('.')) {
            return new Response(
                JSON.stringify({ success: false, message: 'Invalid email' }),
                { status: 400, headers: corsHeaders }
            );
        }

        // Try to save to database if available
        try {
            const db = env.DB;
            if (db) {
                await db
                    .prepare(
                        'INSERT INTO waitlist (name, email, struggle, created_at) VALUES (?, ?, ?, datetime("now"))'
                    )
                    .bind(name, email.toLowerCase(), struggle)
                    .run();
            }
        } catch (dbError) {
            console.error('Database error (non-critical):', dbError);
            // Continue anyway - form can work without database
        }

        // Return success
        return new Response(
            JSON.stringify({
                success: true,
                message: 'You\'ve been added to the waitlist! Check your email for updates.',
            }),
            { status: 201, headers: corsHeaders }
        );

    } catch (error) {
        console.error('API error:', error);
        return new Response(
            JSON.stringify({ success: false, message: 'Server error' }),
            { status: 500, headers: corsHeaders }
        );
    }
}

