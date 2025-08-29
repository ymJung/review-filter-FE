import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accessToken = searchParams.get('access_token');

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Missing access token' },
        { status: 400 }
      );
    }

    // Fetch user profile from Naver API using the access token
    const response = await fetch('https://openapi.naver.com/v1/nid/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Naver API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch Naver profile' },
        { status: response.status }
      );
    }

    const profileData = await response.json();

    if (profileData.resultcode !== '00') {
      return NextResponse.json(
        { error: 'Naver profile retrieval failed', details: profileData.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ profile: profileData.response });
  } catch (error) {
    console.error('Error fetching Naver profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}