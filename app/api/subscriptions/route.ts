import { refreshAccessToken } from '@/lib/refresh-token';
import { getTokenServer } from '@/lib/token-server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { accessToken, refreshToken } = await getTokenServer();
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || 1;
    const billingCycle = searchParams.get('billing_cycle') || '';
    const maxPrice = searchParams.get('max_price') || '';
    const minPrice = searchParams.get('min_price') || '';
    const maxRenewalDate = searchParams.get('max_renewal_date') || '';
    const minRenewalDate = searchParams.get('min_renewal_date') || '';
    const serviceName = searchParams.get('service_name') || '';

    const queryParams = new URLSearchParams({
      page: page.toString(),
      ...(billingCycle && { billing_cycle: billingCycle }),
      ...(maxPrice && { max_price: maxPrice }),
      ...(minPrice && { min_price: minPrice }),
      ...(maxRenewalDate && { max_renewal_date: maxRenewalDate }),
      ...(minRenewalDate && { min_renewal_date: minRenewalDate }),
      ...(serviceName && { service_name: serviceName }),
    }).toString();

    const apiRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/subscriptions/?${queryParams}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!apiRes.ok && apiRes.status === 401) {
      await refreshAccessToken(request, refreshToken);
    }

    const data = await apiRes.json();

    if (!apiRes.ok) {
      return NextResponse.json(
        { error: data.detail || 'Failed to fetch data' },
        { status: apiRes.status }
      );
    }
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Something went wrong',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { accessToken, refreshToken } = await getTokenServer();
    const body = await request.json();

    const apiRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/subscriptions/`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      }
    );

    console.log(apiRes);

    if (!apiRes.ok && apiRes.status === 401) {
      await refreshAccessToken(request, refreshToken);
    }

    const data = await apiRes.json();

    if (apiRes.status === 400) {
      return NextResponse.json({ error: data }, { status: apiRes.status });
    }

    if (!apiRes.ok) {
      return NextResponse.json(
        { error: data.detail || 'Failed to create subscription' },
        { status: apiRes.status }
      );
    }
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Something went wrong',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { accessToken, refreshToken } = await getTokenServer();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id)
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      );

    const apiRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/subscriptions/${id}/`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!apiRes.ok && apiRes.status === 401) {
      await refreshAccessToken(request, refreshToken);
    }

    if (!apiRes.ok) {
      return NextResponse.json(
        { error: 'Failed to delete subscription' },
        { status: apiRes.status }
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Something went wrong',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { accessToken, refreshToken } = await getTokenServer();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id)
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      );

    const body = await request.json();
    const apiRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/subscriptions/${id}/`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      }
    );

    if (!apiRes.ok && apiRes.status === 401) {
      await refreshAccessToken(request, refreshToken);
    }

    const data = await apiRes.json();

    if (!apiRes.ok) {
      return NextResponse.json(
        { error: data.detail || 'Failed to update subscription' },
        { status: apiRes.status }
      );
    }
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Something went wrong',
      },
      { status: 500 }
    );
  }
}

export async function GET_PRICE_HISTORY(request: NextRequest) {
  try {
    const { accessToken, refreshToken } = await getTokenServer();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id)
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      );

    const apiRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/subscriptions/${id}/price-history/`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!apiRes.ok && apiRes.status === 401) {
      await refreshAccessToken(request, refreshToken);
    }

    const data = await apiRes.json();

    if (!apiRes.ok) {
      return NextResponse.json(
        { error: data.detail || 'Failed to fetch price history' },
        { status: apiRes.status }
      );
    }
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Something went wrong',
      },
      { status: 500 }
    );
  }
}

export async function IMPORT_CSV(request: NextRequest) {
  try {
    const { accessToken, refreshToken } = await getTokenServer();
    const formData = await request.formData();
    const apiRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/subscriptions/import_csv`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      }
    );

    if (!apiRes.ok && apiRes.status === 401) {
      await refreshAccessToken(request, refreshToken);
    }

    const data = await apiRes.json();

    if (!apiRes.ok) {
      return NextResponse.json(
        { error: data.detail || 'Failed to import CSV' },
        { status: apiRes.status }
      );
    }
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Something went wrong',
      },
      { status: 500 }
    );
  }
}
