import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, KeyRound, Mail } from "lucide-react";
import {
  requestPasswordReset,
  resetPassword,
} from "../../services/authService.js";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRequest = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);
    try {
      const result = await requestPasswordReset(email);
      setMessage(result.message);
      setResetToken(result.resetToken || "");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to request a reset code. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const result = await resetPassword({
        token: resetToken,
        password,
        confirmPassword,
      });
      setMessage(result.message);
      setResetToken("");
      setPassword("");
      setConfirmPassword("");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to reset your password. Please try again.",
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
          <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#87A96B]/15">
            <KeyRound size={27} className="text-[#87A96B]" />
          </div>
          <h1 className="text-3xl font-bold text-[#5A3E2B]">Forgot password?</h1>
          <p className="mb-8 mt-3 leading-relaxed text-gray-500">
            Request a password reset code for your account.
          </p>

          <form onSubmit={handleRequest}>
            <label htmlFor="reset-email" className="mb-2 block text-sm font-semibold text-[#5A3E2B]">
              Email Address
            </label>
            <div className="relative">
              <Mail size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                id="reset-email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-gray-200 py-3.5 pl-12 pr-4 outline-none focus:border-[#87A96B]"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#D5851F] py-3.5 font-semibold text-white disabled:opacity-60"
            >
              {isSubmitting ? "Requesting..." : "Request reset code"}
              {!isSubmitting && <ArrowRight size={19} />}
            </button>
          </form>

          {message && <p role="status" className="mt-4 break-all text-sm text-green-700">{message}</p>}
          {error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}

          {resetToken && (
            <form onSubmit={handleReset} className="mt-6 space-y-4 border-t border-gray-100 pt-6">
              <label className="block text-sm font-semibold text-[#5A3E2B]">
                Reset code
                <input
                  required
                  value={resetToken}
                  onChange={(event) => setResetToken(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 font-normal"
                />
              </label>
              <label className="block text-sm font-semibold text-[#5A3E2B]">
                New password
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 font-normal"
                />
              </label>
              <label className="block text-sm font-semibold text-[#5A3E2B]">
                Confirm new password
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 font-normal"
                />
              </label>
              <p className="text-xs text-gray-500">Use at least 8 characters, including uppercase, lowercase, and a special character.</p>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-[#5A3E2B] py-3.5 font-semibold text-white disabled:opacity-60"
              >
                {isSubmitting ? "Updating..." : "Update password"}
              </button>
            </form>
          )}

          <Link to="/login" className="mt-8 flex items-center justify-center gap-2 text-sm font-semibold text-[#87A96B] hover:underline">
            <ArrowLeft size={17} /> Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
