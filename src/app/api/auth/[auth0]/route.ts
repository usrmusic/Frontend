import { auth0 } from "@/src/lib/auth0";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { pathname } = new URL(request.url);
  const authType = pathname.split('/').pop();

  try {
    switch (authType) {
      case 'login':
        return auth0.startInteractiveLogin();
      case 'logout':
        // For logout, we'll redirect to Auth0 logout endpoint
        const logoutUrl = `https://${process.env.AUTH0_DOMAIN}/v2/logout?client_id=${process.env.AUTH0_CLIENT_ID}&returnTo=${encodeURIComponent(process.env.APP_BASE_URL!)}`;
        return NextResponse.redirect(logoutUrl);
      case 'callback':
        // Handle the callback
        const session = await auth0.getSession(request);
        if (session) {
          // Redirect to dashboard on successful login
          return NextResponse.redirect(new URL('/dashboard', request.url));
        } else {
          return NextResponse.redirect(new URL('/?error=auth_failed', request.url));
        }
      default:
        return new Response('Not found', { status: 404 });
    }
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.redirect(new URL('/?error=auth_error', request.url));
  }
}