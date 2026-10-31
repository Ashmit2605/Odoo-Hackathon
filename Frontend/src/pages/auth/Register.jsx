
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { register } from "../../services/authService.js";

const inputClass =
  "w-full rounded-xl border border-gray-200 py-3.5 pl-12 pr-12 outline-none transition focus:border-[#87A96B] focus:ring-2 focus:ring-[#87A96B]/15";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    // Prevent duplicate submissions
    if (loading) return;

    if (Object.values(form).some((value) => !value.trim())) {
      setError("Please fill in all fields.");
      return;
    }

    // Validate email
    const email = form.email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (form.password.length < 9) {
      setError("Password must contain at least 9 characters.");
      return;
    }
    if (!/[A-Z]/.test(form.password)) {
      setError("Password must contain an uppercase letter.");
      return;
    }
    if (!/[a-z]/.test(form.password)) {
      setError("Password must contain a lowercase letter.");
      return;
    }
    if (!/[^A-Za-z0-9]/.test(form.password)) {
      setError("Password must contain a special character.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // Validate API URL
    const API_URL = import.meta.env.VITE_API_URL;

    if (!API_URL) {
      setError(
        "API URL is missing. Please configure VITE_API_URL in your frontend .env file."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL.replace(/\/+$/, "")}/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            name: form.fullName.trim(),
            email,
            password: form.password,
          }),
        }
      );

      // Safely read response instead of directly calling response.json()
      const responseText = await response.text();

      let data = {};

      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch {
          console.error("Invalid API response:", responseText);

          throw new Error(
            `Server returned an invalid response (HTTP ${response.status}). Check your backend API.`
          );
        }
      }

      // Handle HTTP errors
      if (!response.ok) {
        throw new Error(
          data.message ||
          data.error ||
          `Registration failed (HTTP ${response.status}).`
        );
      }

      // Handle empty response
      if (!responseText) {
        throw new Error(
          "Server returned an empty response. Please check your registration controller."
        );
      }

      // Validate authentication response
      if (!data.token || !data.user) {
        throw new Error(
          data.message ||
          "Registration response is missing the authentication token or user details."
        );
      }

      // Validate role
      const roleRoutes = {
        ADMIN: "/admin/dashboard",
        STAFF: "/staff/dashboard",
        CUSTOMER: "/customer/dashboard",
      };

      const redirectTo =
        data.redirectTo || roleRoutes[data.user.role];

      if (!redirectTo) {
        throw new Error(
          "Invalid user role received from the server."
        );
      }

      // Save authentication details
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Save customer profile if returned
      if (data.customer) {
        localStorage.setItem(
          "customer",
          JSON.stringify(data.customer)
        );
      }

      // Redirect according to authenticated role
      navigate(redirectTo, { replace: true });

    } catch (err) {
      console.error("Registration error:", err);

      if (err instanceof TypeError) {
        setError(
          "Unable to connect to the backend. Check whether your server is running and verify your API URL and CORS settings."
        );
      } else {
        setError(
          err.message || "Registration failed. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
    setIsSubmitting(true);
    setError("");
    try {
      const result = await register({
        name: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      localStorage.setItem("token", result.token);
      localStorage.setItem("user", JSON.stringify(result.user));
      if (result.customer) {
        localStorage.setItem("customer", JSON.stringify(result.customer));
      }
      navigate(result.redirectTo, { replace: true });
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to create your account."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAF7F0] px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-9 block text-center text-3xl font-bold text-[#5A3E2B]">
          Bright<span className="text-[#87A96B]">loop</span>
        </Link>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm md:p-10">
          <h1 className="text-3xl font-bold text-[#5A3E2B]">Create an account</h1>
          <p className="mb-8 mt-2 text-gray-500">Get started with Brightloop today.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="register-name" className="mb-2 block text-sm font-semibold text-[#5A3E2B]">
                Full Name
              </label>
              <div className="relative">
                <User size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="register-name"
                  name="fullName"
                  type="text"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  autoComplete="name"
                  required
                  autoComplete="name"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="register-email" className="mb-2 block text-sm font-semibold text-[#5A3E2B]">
                Email Address
              </label>
              <div className="relative">
                <Mail size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="register-email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  autoComplete="email"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="register-password" className="mb-2 block text-sm font-semibold text-[#5A3E2B]">
                Password
              </label>
              <div className="relative">
                <Lock size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="register-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  autoComplete="new-password"
                  required
                  autoComplete="new-password"
                  className={`${inputClass} pr-12`}
                  className={inputClass}
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-400">
                At least 9 characters, uppercase, lowercase, and a special character.
              </p>
            </div>

            <div>
              <label htmlFor="register-confirm" className="mb-2 block text-sm font-semibold text-[#5A3E2B]">
                Confirm Password
              </label>
              <div className="relative">
                <Lock size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="register-confirm"
                  name="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  required
                  autoComplete="new-password"
                  className={`${inputClass} pr-12`}
                  className={inputClass}
                />
                <button
                  type="button"
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                  onClick={() => setShowConfirm((visible) => !visible)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showConfirm ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>

            {error && (
              <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#D5851F] py-3.5 font-semibold text-white transition hover:bg-[#BD741A] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Creating account..." : "Create Account"}
              {!isSubmitting && <ArrowRight size={19} />}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-[#87A96B] hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

