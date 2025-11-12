import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function GET(request: NextRequest) {
    const url = new URL(request.url);
    const path = url.pathname.replace("/api/auth", "");
    const backendUrl = `${API_URL}/api/auth${path}${url.search}`;

    const response = await fetch(backendUrl, {
        method: "GET",
        headers: request.headers,
    });

    return new NextResponse(response.body, {
        status: response.status,
        headers: response.headers,
    });
}

export async function POST(request: NextRequest) {
    const url = new URL(request.url);
    const path = url.pathname.replace("/api/auth", "");
    const backendUrl = `${API_URL}/api/auth${path}${url.search}`;

    const body = await request.text();

    const response = await fetch(backendUrl, {
        method: "POST",
        headers: request.headers,
        body,
    });

    return new NextResponse(response.body, {
        status: response.status,
        headers: response.headers,
    });
}
