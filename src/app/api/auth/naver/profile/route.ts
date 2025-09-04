import { NextRequest, NextResponse } from 'next/server';

// Server-side proxy to fetch Naver profile with access token to avoid CORS on the client
export async function POST(req: NextRequest) {
  try {
    const { accessToken } = await req.json();

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Missing accessToken' },
        { status: 400 }
      );
    }

    const res = await fetch('https://openapi.naver.com/v1/nid/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      // Ensure we don't cache sensitive responses
      cache: 'no-store',
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: 'Failed to fetch Naver profile', details: text },
        { status: res.status }
      );
    }

    const data = await res.json();

    // Naver returns resultcode '00' on success
    if (data.resultcode !== '00') {
      return NextResponse.json(
        { error: 'Invalid Naver profile response', details: data },
        { status: 502 }
      );
    }

    return NextResponse.json({ profile: data.response });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Unexpected error fetching Naver profile', details: err?.message },
      { status: 500 }
    );
  }
}

