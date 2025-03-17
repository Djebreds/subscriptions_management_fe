import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const apiRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/register`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );

    const data = await apiRes.json();

    if (apiRes.status === 401 || apiRes.status === 400) {
      let errorMessages = 'Registration failed.';

      if (data && typeof data === 'object' && !Array.isArray(data)) {
        errorMessages = Object.entries(data)
          .map(([key, value]) => {
            if (Array.isArray(value)) {
              return `${key}: ${value.join(', ')}`;
            }
            return `${key}: ${String(value)}`;
          })
          .join(' | ');
      } else if (typeof data === 'string') {
        errorMessages = data;
      }

      return NextResponse.json(
        { error: errorMessages },
        { status: apiRes.status }
      );
    }

    return NextResponse.json({ user: data });
  } catch (error: unknown) {
    let errorMessage = 'Something went wrong.';

    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
