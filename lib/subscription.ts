import api from "@/lib/api";

interface SubscriptionPayload {
  service_name: string;
  price: number;
  billing_cycle: string;
  renewal_date: string;
  active: boolean;
  [key: string]: string | number | boolean | undefined;
}

export async function getSubscriptions(params: Record<string, string>) {
  try {
    const queryParams = new URLSearchParams({
      page: params.page || "1",
      billing_cycle: params.billing_cycle || "",
      max_price: params.max_price || "",
      min_price: params.min_price || "",
      max_renewal_date: params.max_renewal_date || "",
      min_renewal_date: params.min_renewal_date || "",
      service_name: params.service_name || "",
      active: params.active || "",
    });

    const { data } = await api.get(`/subscriptions/?${queryParams.toString()}`);
    return { data };
  } catch (error: unknown) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "An unknown error occurred" };
  }
}

export async function getSubscription(id: string) {
  if (!id) return { error: "Subscription ID is required" };

  try {
    const { data } = await api.get(`/subscriptions/${id}/`);
    return { data };
  } catch (error: unknown) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "An unknown error occurred" };
  }
}

export async function createSubscription(payload: SubscriptionPayload) {
  try {
    const { data } = await api.post("/subscriptions/", payload);
    return { data };
  } catch (error: unknown) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "An unknown error occurred" };
  }
}

export async function deleteSubscription(id: string) {
  if (!id) return { error: "Subscription ID required" };

  try {
    await api.delete(`/subscriptions/${id}/`);
    return { success: true };
  } catch (error: unknown) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "An unknown error occurred" };
  }
}

export async function updateSubscription(
  id: string,
  payload: Partial<SubscriptionPayload>
) {
  if (!id) return { error: "Subscription ID required" };

  try {
    const { data } = await api.patch(`/subscriptions/${id}/`, payload);
    return { data };
  } catch (error: unknown) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "An unknown error occurred" };
  }
}

export async function getPriceHistories(id: string) {
  if (!id) return { error: "Subscription ID is required" };

  try {
    const { data } = await api.get(`/subscriptions/${id}/price_histories/`);

    return { data };
  } catch (error: unknown) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "An unknown error occurred" };
  }
}

export async function importSubscriptions(formData: FormData) {
  try {
    const { data } = await api.post("/subscriptions/import_csv/", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return { data };
  } catch (error: unknown) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "An unknown error occurred" };
  }
}
