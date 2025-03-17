import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log(body);

    const apiRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/register`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );

    const data = await apiRes.json();

    if (apiRes.status === 401) {
      return NextResponse.json(
        { error: data.detail },
        { status: apiRes.status }
      );
    }

    if (apiRes.status === 400) {
      return NextResponse.json({ error: data }, { status: apiRes.status });
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
