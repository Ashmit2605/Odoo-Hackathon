
import { Link } from "react-router-dom";

export default function HomeFooter() {
  return (
    <footer className="bg-walnut text-white px-6 py-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <Link to="/" className="text-2xl font-bold">
            Bright<span className="text-sage">loop</span>
          </Link>

          <div className="flex flex-wrap justify-center gap-6 text-sm text-white/80">
            <a href="#features" className="hover:text-sage">
              Features
            </a>
            <a href="#benefits" className="hover:text-sage">
              Benefits
            </a>
            <a href="#about" className="hover:text-sage">
              About
            </a>
          </div>
        </div>

        <div className="border-t border-white/20 mt-10 pt-6 text-sm text-white/60 text-center md:text-left">
          © {new Date().getFullYear()} Brightloop. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
