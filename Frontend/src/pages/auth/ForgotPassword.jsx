
import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, KeyRound, ArrowRight } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMessage("Please enter a valid email address.");
      return;
    }

    // TODO: Connect backend password reset API here.
    setMessage(
      "Password reset API is not connected yet. No email has been sent."
    );
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
          <div className="w-14 h-14 rounded-2xl bg-[#87A96B]/15 flex items-center justify-center mb-7">
            <KeyRound size={27} className="text-[#87A96B]" />
          </div>

          <h1 className="text-3xl font-bold text-[#5A3E2B]">
            Forgot password?
          </h1>

          <p className="text-gray-500 mt-3 mb-8 leading-relaxed">
            Enter your registered email address to request a password reset link.
          </p>

          <form onSubmit={handleSubmit}>
            <label htmlFor="reset-email" className="block text-sm font-semibold text-[#5A3E2B] mb-2">
              Email Address
            </label>

            <div className="relative">
              <Mail size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                id="reset-email"
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setMessage("");
                }}
                placeholder="you@example.com"
                className="w-full border border-gray-200 rounded-xl py-3.5 pl-12 pr-4 outline-none focus:border-[#87A96B] focus:ring-2 focus:ring-[#87A96B]/15 transition"
              />
            </div>

            {message && (
              <p role="status" className="text-sm text-[#5A3E2B] mt-4">
                {message}
              </p>
            )}

            <button
              type="submit"
              className="w-full bg-[#D5851F] text-white py-3.5 rounded-xl font-semibold flex justify-center items-center gap-2 mt-6 hover:bg-[#BD741A] transition"
            >
              Request Reset Link <ArrowRight size={19} />
            </button>
          </form>

          <Link
            to="/login"
            className="flex justify-center items-center gap-2 text-sm font-semibold text-[#87A96B] mt-8 hover:underline"
          >
            <ArrowLeft size={17} />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
