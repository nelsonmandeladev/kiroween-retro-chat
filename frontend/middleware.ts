import { NextRequest, NextResponse } from "next/server";
import { getCookieCache } from "better-auth/cookies";

export async function middleware(request: NextRequest) {
    // Optimistically check for session cookie
    // Note: This only checks existence, not validity
    // Actual validation happens in each protected page
    const session = await getCookieCache(request, {
        cookiePrefix: "retrochat",
    });

    if (!session) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/chat/:path*", "/profile-setup/:path*"],
};
