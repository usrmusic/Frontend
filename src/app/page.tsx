import { auth0 } from "@/src/lib/auth0";
import { redirect } from "next/navigation";

export default async function Home() {
  // Check if user is authenticated
  const session = await auth0.getSession();

  if (session) {
    // Redirect authenticated users to dashboard
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to USR Music
          </h1>
          <p className="text-gray-600 mb-8">
            Discover, Play, and Share Your Favorite Tunes
          </p>

          <div className="space-y-4">
            <a
              href="/auth/login?screen_hint=signup"
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Sign Up
            </a>
            <a
              href="/auth/login"
              className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Log In
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
