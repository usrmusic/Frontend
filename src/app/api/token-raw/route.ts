// Get raw access token for Postman/external use
import { auth0 } from "@/src/lib/auth0";

export async function GET() {
  try {
    const session = await auth0.getSession();

    if (!session) {
      return Response.json({
        error: 'Not logged in. Please visit http://localhost:3000 and log in first.'
      }, { status: 401 });
    }

    const accessToken = await auth0.getAccessToken({
      audience: process.env.AUTH0_AUDIENCE
    });

    if (!accessToken.token) {
      return Response.json({
        error: 'No access token available'
      }, { status: 500 });
    }

    // Return just the raw token for easy copying
    return new Response(accessToken.token, {
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache'
      }
    });

  } catch {
    return Response.json({
      error: 'Failed to get token'
    }, { status: 500 });
  }
}