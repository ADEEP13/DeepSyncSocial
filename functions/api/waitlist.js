/**
 * Cloudflare Pages Function: POST /api/waitlist
 *
 * Handles waitlist form submissions and stores them in Cloudflare D1 database.
 *
 * Environment:
 * - Binding: env.DB (Cloudflare D1 database)
 *
 * Request body:
 * {
 *   name: string | null (optional),
 *   email: string (required),
 *   struggle: string (required)
 * }
 *
 * Response:
 * - 201: { success: true, message: string }
 * - 400: { success: false, message: string }
 * - 500: { success: false, message: string }
 */

export async function onRequest(context) {
    const { request, env } = context;

    // Only allow POST requests
    if (request.method !== 'POST') {
        return jsonResponse(
            { success: false, message: 'Method not allowed' },
            405
        );
    }

    try {
        // Parse request body
        let body;
        try {
            body = await request.json();
        } catch (error) {
            return jsonResponse(
                { success: false, message: 'Invalid JSON in request body' },
                400
            );
        }

        const { name, email, struggle } = body;

        // Validate required fields
        if (!name || !email || !struggle) {
            return jsonResponse(
                {
                    success: false,
                    message: 'Name, email, and struggle selection are required',
                },
                400
            );
        }

        // Normalize email
        const normalizedEmail = email.trim().toLowerCase();

        // Validate email format
        if (!isValidEmail(normalizedEmail)) {
            return jsonResponse(
                { success: false, message: 'Invalid email address.' },
                400
            );
        }

        // Validate struggle
        if (typeof struggle !== 'string' || struggle.trim() === '') {
            return jsonResponse(
                { success: false, message: 'Invalid struggle selection' },
                400
            );
        }

        // Get the D1 database binding
        const db = env.DB;

        if (!db) {
            console.error('D1 database binding "DB" not configured');
            return jsonResponse(
                { success: false, message: 'Server error. Please try again later.' },
                500
            );
        }

        // Check if email already exists
        try {
            const existing = await db
                .prepare('SELECT id FROM waitlist WHERE email = ?')
                .bind(normalizedEmail)
                .first();

            if (existing) {
                return jsonResponse(
                    {
                        success: true,
                        message: "You're already on the waitlist.",
                    },
                    200
                );
            }
        } catch (error) {
            console.error('Database query error:', error);
            return jsonResponse(
                { success: false, message: 'Server error. Please try again later.' },
                500
            );
        }

        // Insert into database
        try {
            const result = await db
                .prepare(
                    'INSERT INTO waitlist (name, email, struggle, created_at) VALUES (?, ?, ?, datetime("now"))'
                )
                .bind(
                    name.trim(),
                    normalizedEmail,
                    struggle.trim()
                )
                .run();

            return jsonResponse(
                {
                    success: true,
                    message: 'Added to waitlist. Check your email for updates!',
                },
                201
            );
        } catch (error) {
            console.error('Database insert error:', error);

            // Check if it's a unique constraint violation
            if (error.message && error.message.includes('UNIQUE')) {
                return jsonResponse(
                    {
                        success: true,
                        message: "You're already on the waitlist.",
                    },
                    200
                );
            }

            return jsonResponse(
                { success: false, message: 'Server error. Please try again later.' },
                500
            );
        }
    } catch (error) {
        console.error('Unexpected error:', error);
        return jsonResponse(
            { success: false, message: 'Server error. Please try again later.' },
            500
        );
    }
}

/**
 * Validate email format with regex
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Return JSON response with appropriate headers
 */
function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
        },
    });
}

