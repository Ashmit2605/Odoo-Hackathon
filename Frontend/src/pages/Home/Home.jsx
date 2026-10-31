
import { Link } from "react-router-dom";
import {
  ArrowRight,
  RefreshCcw,
  CreditCard,
  BarChart3,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  FileText,
  Users,
  TrendingUp,
} from "lucide-react";

import HomeNavbar from "../../components/HomeNavbar.jsx";
import HomeFooter from "../../components/HomeFooter.jsx";

const features = [
  {
    icon: RefreshCcw,
    title: "Subscription Management",
    description:
      "Create, manage, renew, and track subscriptions from one simple workspace.",
    color: "bg-sage",
  },
  {
    icon: CreditCard,
    title: "Automated Billing",
    description:
      "Simplify recurring invoices, billing cycles, and payment tracking.",
    color: "bg-walnut",
  },
  {
    icon: BarChart3,
    title: "Revenue Analytics",
    description:
      "Get a clear view of recurring revenue, payments, and overdue invoices.",
    color: "bg-amberglow",
  },
  {
    icon: ShieldCheck,
    title: "Secure Access",
    description:
      "Dedicated access for administrators, internal staff, and customers.",
    color: "bg-sage",
  },
];

const benefits = [
  "Automated recurring invoices",
  "Flexible monthly and yearly plans",
  "Centralized customer management",
  "Payment and overdue invoice tracking",
];

function DashboardPreview() {
  const metrics = [
    { label: "Active Subscriptions", value: "1,248", icon: Users },
    { label: "Monthly Revenue", value: "₹4,85,000", icon: TrendingUp },
    { label: "Paid Invoices", value: "892", icon: CheckCircle2 },
    { label: "Overdue Invoices", value: "32", icon: FileText },
  ];

  const bars = [42, 58, 48, 73, 64, 82, 96];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <div>
          <h3 className="font-bold text-walnut">Dashboard Overview</h3>
          <p className="text-xs text-gray-500 mt-1">
            Your business at a glance
          </p>
        </div>
        <span className="text-xs bg-sage/15 text-walnut px-3 py-1.5 rounded-full font-medium">
          Demo
        </span>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-2 gap-3">
          {metrics.map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="bg-cream rounded-xl p-4 border border-walnut/5"
            >
              <Icon size={19} className="text-sage mb-3" />
              <p className="text-xs text-gray-500">{label}</p>
              <h4 className="text-xl font-bold text-walnut mt-2">
                {value}
              </h4>
            </div>
          ))}
        </div>

        <div className="mt-5 border border-gray-100 rounded-xl p-5">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-semibold text-walnut">
              Revenue Overview
            </h4>
            <span className="text-xs text-gray-400">
              Last 7 months
            </span>
          </div>

          <div className="h-40 flex items-end gap-3 border-b border-gray-200">
            {bars.map((height, index) => (
              <div
                key={index}
                className="flex-1 bg-sage rounded-t-md"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>

          <div className="flex justify-between mt-3 text-xs text-gray-400">
            {["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"].map(
              (month) => (
                <span key={month}>{month}</span>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-cream text-walnut">
      <HomeNavbar />

      {/* HERO */}
      <section
        id="home"
        className="max-w-7xl mx-auto px-6 md:px-8 py-20 lg:py-28 grid lg:grid-cols-2 gap-14 items-center"
      >
        <div>
          <div className="flex items-center gap-2 text-sage text-xs font-bold tracking-widest mb-7">
            <Sparkles size={17} />
            SMARTER SUBSCRIPTION MANAGEMENT
          </div>

          <h1 className="text-5xl md:text-6xl xl:text-7xl font-bold leading-[1.1] tracking-tight">
            Manage
            <br />
            Subscriptions.
            <br />
            <span className="text-sage">
              Grow Your Business.
            </span>
          </h1>

          <p className="text-gray-600 text-lg leading-relaxed mt-7 max-w-lg">
            Simplify recurring billing, automate invoices,
            manage customers, and track revenue with one
            powerful platform.
          </p>

          <div className="flex flex-wrap gap-4 mt-9">
            <Link
              to="/signup"
              className="bg-amberglow text-white px-7 py-4 rounded-xl font-semibold flex items-center gap-3 hover:brightness-95 transition"
            >
              Get Started <ArrowRight size={19} />
            </Link>

            <a
              href="#features"
              className="border border-walnut px-7 py-4 rounded-xl font-semibold hover:bg-walnut hover:text-white transition"
            >
              Explore Features
            </a>
          </div>

          <p className="text-sm text-gray-500 mt-8">
            Everything your subscription business needs, in one place.
          </p>
        </div>

        <DashboardPreview />
      </section>

      {/* FEATURES */}
      <section id="features" className="bg-white py-24 px-6 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sage font-bold tracking-widest text-sm">
              OUR FEATURES
            </p>

            <h2 className="text-3xl md:text-5xl font-bold mt-4">
              Everything you need in one place
            </h2>

            <p className="text-gray-500 mt-5 max-w-xl mx-auto">
              Powerful tools designed to make subscription
              management simple and efficient.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(({ icon: Icon, title, description, color }) => (
              <div
                key={title}
                className="bg-white border border-gray-200 rounded-2xl p-7 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div
                  className={`w-14 h-14 rounded-xl ${color} text-white flex items-center justify-center mb-7`}
                >
                  <Icon size={26} />
                </div>

                <h3 className="text-xl font-bold mb-3">
                  {title}
                </h3>

                <p className="text-gray-500 leading-relaxed text-sm">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section id="benefits" className="py-24 px-6 md:px-8">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <p className="text-sage font-bold tracking-widest text-sm">
              WHY BRIGHTLOOP?
            </p>

            <h2 className="text-4xl md:text-5xl font-bold leading-tight mt-5">
              Less manual work.
              <br />
              <span className="text-sage">
                More business growth.
              </span>
            </h2>

            <p className="text-gray-600 mt-6 leading-relaxed max-w-lg">
              Stop managing subscriptions in spreadsheets.
              Bring billing, customer management, and revenue
              tracking into one streamlined system.
            </p>

            <div className="space-y-5 mt-9">
              {benefits.map((benefit) => (
                <div
                  key={benefit}
                  className="flex items-center gap-3"
                >
                  <CheckCircle2
                    className="text-sage shrink-0"
                    size={22}
                  />
                  <span className="font-medium">
                    {benefit}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 md:p-12 border border-gray-200">
            <div className="w-16 h-16 rounded-2xl bg-sage/15 flex items-center justify-center mb-7">
              <BarChart3 size={32} className="text-sage" />
            </div>

            <h3 className="text-3xl font-bold">
              One platform.
              <br />
              Complete visibility.
            </h3>

            <p className="text-gray-500 mt-5 leading-relaxed">
              From creating plans to tracking payments,
              Brightloop brings every part of your
              subscription business together.
            </p>

            <div className="grid grid-cols-2 gap-4 mt-9">
              {[
                ["Subscriptions", RefreshCcw],
                ["Invoices", FileText],
                ["Payments", CreditCard],
                ["Analytics", TrendingUp],
              ].map(([label, Icon]) => (
                <div
                  key={label}
                  className="bg-cream rounded-xl p-4 flex items-center gap-3"
                >
                  <Icon size={20} className="text-sage shrink-0" />
                  <span className="text-sm font-semibold">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="about" className="px-6 md:px-8 pb-24">
        <div className="max-w-7xl mx-auto bg-amberglow rounded-2xl p-10 md:p-16 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-white">
            <h2 className="text-3xl md:text-4xl font-bold">
              Ready to simplify your subscriptions?
            </h2>

            <p className="text-white/90 mt-4">
              Manage subscriptions, billing, and customers
              from one powerful platform.
            </p>
          </div>

          <Link
            to="/signup"
            className="bg-white text-walnut px-8 py-4 rounded-xl font-bold flex items-center gap-2 shrink-0 hover:bg-cream transition"
          >
            Get Started <ArrowRight size={19} />
          </Link>
        </div>
      </section>

      <HomeFooter />
    </div>
  );
}
