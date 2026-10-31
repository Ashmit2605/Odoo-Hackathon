const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

export async function register({ name, email, password }) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
  } catch {
    throw new Error(
      "Unable to connect to the registration API. Check that the backend is running."
    );
  }

  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error("The registration API returned an invalid response.");
  }

  if (!response.ok) {
    const validationMessage = result.issues?.[0]?.message;
    throw new Error(
      validationMessage || result.error || "Unable to create your account."
    );
  }

  if (!result.token || !result.user || !result.redirectTo) {
    throw new Error("The registration API returned incomplete account details.");
  }

  return result;
}

export async function login({ email, password }) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    throw new Error(
      "Unable to connect to the login API. Check that the backend is running."
    );
  }

  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error("The login API returned an invalid response.");
  }

  if (!response.ok) {
    const validationMessage = result.issues?.[0]?.message;
    throw new Error(
      validationMessage || result.error || "Unable to sign in."
    );
  }

  if (!result.token || !result.user || !result.redirectTo) {
    throw new Error("The login API returned incomplete account details.");
  }

  return result;
}

export const logout = async () => {};
