/**
 * Cloudflare Pages Function: POST /api/waitlist
 * 
 * Handles waitlist form submissions and stores them in Cloudflare D1 database.
 * This file is automatically routed by Cloudflare Pages.
 */

export async function onRequest(context) {
    const { request, env } = context;

    // Add CORS headers to all responses
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    // Only allow POST requests
    if (request.method !== 'POST') {
        return new Response(
            JSON.stringify({ success: false, message: 'Method not allowed' }),
            { status: 405, headers: corsHeaders }
        );
    }

    try {
        // Parse request body
        let body;
        try {
            body = await request.json();
        } catch (error) {
            console.error('JSON parse error:', error);
            return new Response(
                JSON.stringify({ success: false, message: 'Invalid JSON' }),
                { status: 400, headers: corsHeaders }
            );
        }

        const { name, email, struggle } = body;

        // Validate required fields
        if (!name || !email || !struggle) {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: 'Name, email, and struggle are required',
                }),
                { status: 400, headers: corsHeaders }
            );
        }

        // Normalize and validate email
        const normalizedEmail = email.trim().toLowerCase();
        if (!isValidEmail(normalizedEmail)) {
            return new Response(
                JSON.stringify({ success: false, message: 'Invalid email' }),
                { status: 400, headers: corsHeaders }
            );
        }

        // Get database binding
        const db = env.DB;
        if (!db) {
            console.error('D1 binding not found');
            return new Response(
                JSON.stringify({ success: false, message: 'Server error' }),
                { status: 500, headers: corsHeaders }
            );
        }

        // Check if email already exists
        try {
            const existing = await db
                .prepare('SELECT id FROM waitlist WHERE email = ?')
                .bind(normalizedEmail)
                .first();

            if (existing) {
                return new Response(
                    JSON.stringify({
                        success: true,
                        message: "You're already on the waitlist",
                    }),
                    { status: 200, headers: corsHeaders }
                );
            }
        } catch (dbError) {
            console.error('Database query error:', dbError);
            // Continue - might not be initialized yet
        }

        // Insert new record
        try {
            await db
                .prepare(
                    'INSERT INTO waitlist (name, email, struggle, created_at) VALUES (?, ?, ?, datetime("now"))'
                )
                .bind(name.trim(), normalizedEmail, struggle.trim())
                .run();

            return new Response(
                JSON.stringify({
                    success: true,
                    message: 'Successfully added to waitlist!',
                }),
                { status: 201, headers: corsHeaders }
            );
        } catch (insertError) {
            console.error('Database insert error:', insertError);

            // If duplicate email, still return success
            if (insertError.message?.includes('UNIQUE')) {
                return new Response(
                    JSON.stringify({
                        success: true,
                        message: "You're already on the waitlist",
                    }),
                    { status: 200, headers: corsHeaders }
                );
            }

            return new Response(
                JSON.stringify({ success: false, message: 'Failed to add to waitlist' }),
                { status: 500, headers: corsHeaders }
            );
        }
    } catch (error) {
        console.error('Unexpected error:', error);
        return new Response(
            JSON.stringify({ success: false, message: 'Server error' }),
            { status: 500, headers: corsHeaders }
        );
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

