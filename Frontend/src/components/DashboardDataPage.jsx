export default function DashboardDataPage({
  title,
  description,
  columns,
  rows,
  stats = [],
}) {
  return (
    <section className="min-h-full bg-[#FCFAF7] p-5 text-stone-800 sm:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#6F8F56]">
            Workspace
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">
            {title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">
            {description}
          </p>
        </div>

        {stats.length > 0 && (
          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {stats.map((stat) => (
              <article
                key={stat.label}
                className="rounded-2xl border border-[#EAE5DA] bg-white p-5 shadow-sm"
              >
                <p className="text-sm font-medium text-stone-500">{stat.label}</p>
                <p className="mt-2 text-2xl font-semibold text-stone-900">
                  {stat.value}
                </p>
                {stat.detail && (
                  <p className="mt-1 text-xs text-stone-500">{stat.detail}</p>
                )}
              </article>
            ))}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-[#EAE5DA] bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EAE5DA] px-5 py-4">
            <h2 className="text-sm font-semibold text-stone-800">Recent records</h2>
            <span className="rounded-full bg-[#F4F1E9] px-2.5 py-1 text-xs font-medium text-stone-500">
              Sample data
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-[#FCFAF7] text-xs font-semibold uppercase tracking-wide text-stone-500">
                <tr>
                  {columns.map((column) => (
                    <th key={column.key} scope="col" className="px-5 py-3">
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0ECE4]">
                {rows.map((row) => (
                  <tr key={row.id} className="text-stone-600">
                    {columns.map((column) => (
                      <td key={column.key} className="whitespace-nowrap px-5 py-4">
                        {row[column.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
