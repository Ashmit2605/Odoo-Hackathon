
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  User, Mail, Lock, Eye, EyeOff, ArrowRight
} from "lucide-react";

export default function Register() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (Object.values(form).some((value) => !value.trim())) {
      setError("Please fill in all fields.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must contain at least 8 characters.");
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

    // TODO: Connect backend registration API here.
    setError(
      "Registration API is not connected yet. Your account has not been created."
    );
  };

  const inputClass =
    "w-full border border-gray-200 rounded-xl py-3.5 pl-12 pr-4 outline-none focus:border-[#87A96B] focus:ring-2 focus:ring-[#87A96B]/15 transition";

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
            Create an account
          </h1>

          <p className="text-gray-500 mt-2 mb-8">
            Get started with Brightloop today.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="register-name" className="block text-sm font-semibold text-[#5A3E2B] mb-2">
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
                  required
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="register-email" className="block text-sm font-semibold text-[#5A3E2B] mb-2">
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
                  required
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="register-password" className="block text-sm font-semibold text-[#5A3E2B] mb-2">
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
                  required
                  className={`${inputClass} pr-12`}
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                At least 8 characters, uppercase, lowercase, and a special character.
              </p>
            </div>

            <div>
              <label htmlFor="register-confirm" className="block text-sm font-semibold text-[#5A3E2B] mb-2">
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
                  required
                  className={`${inputClass} pr-12`}
                />
                <button
                  type="button"
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showConfirm ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>

            {error && (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full bg-[#D5851F] text-white py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-[#BD741A] transition"
            >
              Create Account <ArrowRight size={19} />
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-8">
            Already have an account?{" "}
            <Link to="/login" className="text-[#87A96B] font-semibold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
