import { fetchWithAuth } from '@/lib/fetch-refresh-token';
import { getTokenServer } from '@/lib/token-server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { accessToken, refreshToken } = await getTokenServer();
    const { searchParams } = new URL(request.url);

    const queryParams = new URLSearchParams({
      page: searchParams.get('page') || '1',
      billing_cycle: searchParams.get('billing_cycle') || '',
      max_price: searchParams.get('max_price') || '',
      min_price: searchParams.get('min_price') || '',
      max_renewal_date: searchParams.get('max_renewal_date') || '',
      min_renewal_date: searchParams.get('min_renewal_date') || '',
      service_name: searchParams.get('service_name') || '',
    }).toString();

    const apiRes = await fetchWithAuth(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/subscriptions/?${queryParams}`,
      { method: 'GET', headers: { Authorization: `Bearer ${accessToken}` } },
      refreshToken as string
    );

    if (apiRes.error)
      return NextResponse.json(
        { error: apiRes.error },
        { status: apiRes.status }
      );

    const data = await apiRes.json();

    if (!apiRes.ok)
      return NextResponse.json(
        { error: data.detail },
        { status: apiRes.status }
      );

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { accessToken, refreshToken } = await getTokenServer();
    const body = await request.json();

    const apiRes = await fetchWithAuth(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/subscriptions/`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      },
      refreshToken as string
    );

    if (apiRes.error)
      return NextResponse.json(
        { error: apiRes.error },
        { status: apiRes.status }
      );

    const data = await apiRes.json();

    if (!apiRes.ok)
      return NextResponse.json(
        { error: data.detail || data },
        { status: apiRes.status }
      );

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { accessToken, refreshToken } = await getTokenServer();
    const id = new URL(request.url).searchParams.get('id');
    if (!id)
      return NextResponse.json(
        { error: 'Subscription ID required' },
        { status: 400 }
      );

    const apiRes = await fetchWithAuth(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/subscriptions/${id}/`,
      { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } },
      refreshToken as string
    );

    if (apiRes.error)
      return NextResponse.json(
        { error: apiRes.error },
        { status: apiRes.status }
      );

    if (!apiRes.ok)
      return NextResponse.json(
        { error: 'Failed to delete subscription' },
        { status: apiRes.status }
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { accessToken, refreshToken } = await getTokenServer();
    const id = new URL(request.url).searchParams.get('id');
    if (!id)
      return NextResponse.json(
        { error: 'Subscription ID required' },
        { status: 400 }
      );

    const body = await request.json();

    const apiRes = await fetchWithAuth(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/subscriptions/${id}/`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      },
      refreshToken as string
    );

    if (apiRes.error)
      return NextResponse.json(
        { error: apiRes.error },
        { status: apiRes.status }
      );

    const data = await apiRes.json();

    if (!apiRes.ok)
      return NextResponse.json(
        { error: data.detail || 'Failed to update subscription' },
        { status: apiRes.status }
      );

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
