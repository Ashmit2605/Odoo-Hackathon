const BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

export async function getAdminOverview() {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  let response;
  try {
    response = await fetch(`${BASE_URL}/api/admin/overview`, {
      headers: token
        ? { Authorization: "Bearer " + token }
        : {},
    });
  } catch {
    throw new Error("Unable to connect to the dashboard API. Check that the backend is running.");
  }

  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error("The dashboard API returned an invalid response.");
  }

  if (!response.ok) {
    throw new Error(result.error || "Unable to load the admin dashboard.");
  }
  return result.data;
}
