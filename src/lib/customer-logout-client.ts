export async function requestCustomerLogout(
  fetcher: typeof fetch = fetch
): Promise<void> {
  const response = await fetcher("/api/auth/customer/logout", {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Customer logout request failed.");
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error("Customer logout response was invalid.");
  }

  if (
    !payload ||
    typeof payload !== "object" ||
    !("success" in payload) ||
    payload.success !== true ||
    !("redirectUrl" in payload) ||
    payload.redirectUrl !== "/login"
  ) {
    throw new Error("Customer logout response was invalid.");
  }
}
