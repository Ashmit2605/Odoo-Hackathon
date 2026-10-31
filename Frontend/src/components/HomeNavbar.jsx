
import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";

const links = [
  { label: "Home", href: "#home" },
  { label: "Features", href: "#features" },
  { label: "Benefits", href: "#benefits" },
  { label: "About", href: "#about" },
];

export default function HomeNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 px-4 pt-4">
      <nav className="max-w-7xl mx-auto h-17 px-6 md:px-8 flex items-center justify-between rounded-2xl bg-[#FAF7F0]/75 backdrop-blur-xl backdrop-saturate-150 border border-white/70 shadow-[0_4px_24px_rgba(90,62,43,0.08)]">
        <Link to="/" className="text-2xl font-bold text-walnut">
          Bright<span className="text-sage">loop</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-walnut/80 hover:text-sage transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-5">
          <Link
            to="/login"
            className="text-sm font-medium text-walnut hover:text-sage"
          >
            Login
          </Link>
          <Link
            to="/signup"
            className="bg-amberglow text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:brightness-95 transition"
          >
            Get Started
          </Link>
        </div>

        <button
          type="button"
          className="md:hidden text-walnut"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {open && (
        <div className="md:hidden max-w-7xl mx-auto mt-2 p-5 rounded-2xl bg-[#FAF7F0]/90 backdrop-blur-xl border border-white/70 shadow-lg flex flex-col gap-4">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setOpen(false)}
              className="text-walnut font-medium"
            >
              {link.label}
            </a>
          ))}

          <Link to="/login" onClick={() => setOpen(false)}>
            Login
          </Link>
          <Link
            to="/signup"
            onClick={() => setOpen(false)}
            className="bg-amberglow text-white text-center rounded-xl py-3 font-semibold"
          >
            Get Started
          </Link>
        </div>
      )}
    </header>
  );
}
