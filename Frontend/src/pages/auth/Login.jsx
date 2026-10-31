
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react";
import { login } from "../../services/authService.js";

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm((current) => ({ ...current, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!form.email || !form.password) {
      setError("Please fill in all fields.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      const result = await login({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      const storage = rememberMe ? localStorage : sessionStorage;
      const otherStorage = rememberMe ? sessionStorage : localStorage;
      otherStorage.removeItem("token");
      otherStorage.removeItem("user");
      storage.setItem("token", result.token);
      storage.setItem("user", JSON.stringify(result.user));
      navigate(result.redirectTo, { replace: true });
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to sign in."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F0] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
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
                  required
                  className="w-full border border-gray-200 rounded-xl py-3.5 pl-12 pr-4 outline-none focus:border-[#87A96B] focus:ring-2 focus:ring-[#87A96B]/15 transition"
                />
              </div>
            </div>

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
                  required
                  className="w-full border border-gray-200 rounded-xl py-3.5 pl-12 pr-12 outline-none focus:border-[#87A96B] focus:ring-2 focus:ring-[#87A96B]/15 transition"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#5A3E2B]"
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>

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

            {error && (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#D5851F] text-white py-3.5 rounded-xl font-semibold flex justify-center items-center gap-2 hover:bg-[#BD741A] transition disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Signing in..." : "Sign In"}
              {!isSubmitting && <ArrowRight size={19} />}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-8">
            Don't have an account?{" "}
            <Link
              to="/signup"
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
