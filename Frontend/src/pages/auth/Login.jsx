
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
<<<<<<< HEAD
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight,
} from "lucide-react";
=======
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react";
import useAuth from "../../hooks/useAuth.js";
>>>>>>> 315d366 (done)

export default function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [form, setForm] = useState({
    email: localStorage.getItem("rememberedEmail") || "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  const [rememberMe, setRememberMe] = useState(
    Boolean(localStorage.getItem("rememberedEmail"))
  );

  const [error, setError] = useState("");
<<<<<<< HEAD
  const [loading, setLoading] = useState(false);
=======
  const [isSubmitting, setIsSubmitting] = useState(false);
>>>>>>> 315d366 (done)

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });

    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (loading) return;

    if (!form.email.trim() || !form.password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    const email = form.email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

<<<<<<< HEAD
    const API_URL = import.meta.env.VITE_API_URL;

    if (!API_URL) {
      setError("API URL is missing. Check your frontend .env file.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL.replace(/\/+$/, "")}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            email,
            password: form.password,
          }),
        }
      );

      const responseText = await response.text();

      let data = {};

      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch {
          throw new Error(
            `Invalid server response (HTTP ${response.status}).`
          );
        }
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
          data.error ||
          "Invalid email or password."
        );
      }

      // Validate backend response
      if (!data.token || !data.user) {
        throw new Error(
          "Login response is missing token or user information."
        );
      }

      // Normalize role
      const role = data.user.role?.toUpperCase();

      // Role-based dashboard routes
      const roleRoutes = {
        ADMIN: "/admin/dashboard",
        STAFF: "/staff/dashboard",
        CUSTOMER: "/customer/dashboard",
      };

      const redirectTo = roleRoutes[role];

      if (!redirectTo) {
        throw new Error(
          "Invalid account role. Please contact the administrator."
        );
      }

      // Clear previous login information
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("customer");

      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("customer");

      // Remember Me controls storage
      const storage = rememberMe ? localStorage : sessionStorage;

      storage.setItem("token", data.token);
      storage.setItem("user", JSON.stringify(data.user));

      if (data.customer) {
        storage.setItem(
          "customer",
          JSON.stringify(data.customer)
        );
      }

      // Save remembered email
      if (rememberMe) {
        localStorage.setItem("rememberedEmail", email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      // Redirect according to user role
      navigate(redirectTo, { replace: true });

    } catch (err) {
      console.error("Login error:", err);

      if (err instanceof TypeError) {
        setError(
          "Unable to connect to the backend. Check your server and API URL."
        );
      } else {
        setError(err.message || "Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
=======
    setIsSubmitting(true);
    try {
      await signIn(form, rememberMe);
      navigate("/dashboard", { replace: true });
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to sign in. Please check your connection and try again."
      );
    } finally {
      setIsSubmitting(false);
>>>>>>> 315d366 (done)
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F0] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">

        {/* Logo */}
        <Link
          to="/"
          className="block text-center text-3xl font-bold text-[#5A3E2B] mb-9"
        >
          Bright<span className="text-[#87A96B]">loop</span>
        </Link>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 md:p-10">

          <h1 className="text-3xl font-bold text-[#5A3E2B]">
            Welcome back
          </h1>

          <p className="text-gray-500 mt-2 mb-8">
            Sign in to your Brightloop account.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div>
              <label
                htmlFor="login-email"
                className="block text-sm font-semibold text-[#5A3E2B] mb-2"
              >
                Email Address
              </label>

              <div className="relative">
                <Mail
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  id="login-email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  className="w-full border border-gray-200 rounded-xl py-3.5 pl-12 pr-4 outline-none focus:border-[#87A96B] focus:ring-2 focus:ring-[#87A96B]/15 transition"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="login-password"
                className="block text-sm font-semibold text-[#5A3E2B] mb-2"
              >
                Password
              </label>

              <div className="relative">
                <Lock
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  className="w-full border border-gray-200 rounded-xl py-3.5 pl-12 pr-12 outline-none focus:border-[#87A96B] focus:ring-2 focus:ring-[#87A96B]/15 transition"
                />

                <button
                  type="button"
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#5A3E2B]"
                >
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me and Forgot Password */}
            <div className="flex justify-between items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="accent-[#87A96B]"
                />
                Remember me
              </label>

              <Link
                to="/forgot-password"
                className="text-sm font-semibold text-[#87A96B] hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            {/* Error Message */}
            {error && (
              <p
                role="alert"
                className="text-sm text-red-600 bg-red-50 p-3 rounded-lg"
              >
                {error}
              </p>
            )}

            {/* Submit Button */}
            <button
              type="submit"
<<<<<<< HEAD
              disabled={loading}
              className="w-full bg-[#D5851F] text-white py-3.5 rounded-xl font-semibold flex justify-center items-center gap-2 hover:bg-[#BD741A] transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                "Signing In..."
              ) : (
                <>
                  Sign In
                  <ArrowRight size={19} />
                </>
              )}
=======
              disabled={isSubmitting}
              className="w-full bg-[#D5851F] text-white py-3.5 rounded-xl font-semibold flex justify-center items-center gap-2 hover:bg-[#BD741A] transition"
            >
              {isSubmitting ? "Signing in..." : "Sign In"}
              {!isSubmitting && <ArrowRight size={19} />}
>>>>>>> 315d366 (done)
            </button>

          </form>

          {/* Register Link */}
          <p className="text-center text-sm text-gray-500 mt-8">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-semibold text-[#87A96B] hover:underline"
            >
              Create Account
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          © {new Date().getFullYear()} Brightloop
        </p>

      </div>
    </div>
  );
}
