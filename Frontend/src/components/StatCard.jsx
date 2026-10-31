export default function StatCard({ label, value, icon: Icon }) {
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      {Icon && <Icon aria-hidden="true" size={20} className="mb-3 text-[#87A96B]" />}
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-[#5A3E2B]">{value ?? "—"}</p>
    </article>
  );
}
