// Example: Getting access token in your Next.js app
import { auth0 } from "@/src/lib/auth0";

export async function GET() {
  try {
    // Method 1: Get the full session (includes user info)
    const session = await auth0.getSession();

    // Method 2: Get just the access token
    const accessToken = await auth0.getAccessToken({
      audience: process.env.AUTH0_AUDIENCE
    });

    // Method 3: Get token with specific scopes
    const tokenWithScopes = await auth0.getAccessToken({
      audience: process.env.AUTH0_AUDIENCE,
      scope: 'read:users write:data'
    });

    return Response.json({
      user: session?.user,
      hasAccessToken: !!accessToken,
      tokenLength: accessToken?.token?.length || 0,
      // NEVER expose the actual token in production!
      tokenPreview: accessToken?.token?.substring(0, 50) + '...' // Just for debugging
    });
  } catch (error) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 });
  }
}