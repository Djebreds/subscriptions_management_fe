import api from "@/lib/api";

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
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function getSubscription(id: string) {
  if (!id) return { error: "Subscription ID is required" };

  try {
    const { data } = await api.get(`/subscriptions/${id}/`);
    return { data };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function createSubscription(payload: any) {
  try {
    const { data } = await api.post("/subscriptions/", payload);
    return { data };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deleteSubscription(id: string) {
  if (!id) return { error: "Subscription ID required" };

  try {
    await api.delete(`/subscriptions/${id}/`);
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateSubscription(id: string, payload: any) {
  if (!id) return { error: "Subscription ID required" };

  try {
    const { data } = await api.patch(`/subscriptions/${id}/`, payload);
    return { data };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function getPriceHistories(id: string) {
  if (!id) return { error: "Subscription ID is required" };

  try {
    const { data } = await api.get(`/subscriptions/${id}/price_histories/`);

    return { data };
  } catch (error: any) {
    return { error: error.message };
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
  } catch (error: any) {
    return { error: error.message };
  }
}
