import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function ResourcePage({
  title,
  columns,
  load,
  create,
  fields = [],
  detailPath,
  recordId,
}) {
  const [rows, setRows] = useState([]);
  const [record, setRecord] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    load()
      .then((result) => {
        if (!active) return;
        if (recordId) setRecord(result);
        else setRows(Array.isArray(result) ? result : []);
      })
      .catch((requestError) => {
        if (active) {
          setError(
            requestError.response?.data?.message || "Unable to load this information.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [load, recordId]);

  const handleCreate = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setNotice("");
    try {
      const values = { ...form };
      fields.forEach((field) => {
        if (field.type === "number" && values[field.name] !== "") {
          values[field.name] = Number(values[field.name]);
        }
      });
      await create(values);
      setForm({});
      setNotice(`${title.replace(/s$/, "")} created successfully.`);
      const result = await load();
      if (recordId) setRecord(result);
      else setRows(Array.isArray(result) ? result : []);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Unable to save this record.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const displayedRecord = record && typeof record === "object" ? record : null;

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-[#5A3E2B]">{title}</h1>
      </header>

      {fields.length > 0 && create && !recordId && (
        <form
          onSubmit={handleCreate}
          className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-5 md:grid-cols-3"
        >
          {fields.map((field) => (
            <label key={field.name} className="space-y-1 text-sm font-medium text-gray-700">
              <span>{field.label}</span>
              {field.options ? (
                <select
                  required={field.required !== false}
                  value={form[field.name] ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, [field.name]: event.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                >
                  <option value="">Select...</option>
                  {field.options.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type || "text"}
                  required={field.required !== false}
                  min={field.type === "number" ? field.min ?? 0 : undefined}
                  step={field.type === "number" ? field.step ?? "any" : undefined}
                  value={form[field.name] ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, [field.name]: event.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              )}
            </label>
          ))}
          <div className="flex items-end">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-[#D5851F] px-5 py-2.5 font-semibold text-white disabled:opacity-60"
            >
              {submitting ? "Saving..." : `Add ${title.replace(/s$/, "")}`}
            </button>
          </div>
        </form>
      )}

      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{notice}</p>}

      {recordId ? (
        loading ? (
          <p className="text-gray-500">Loading record...</p>
        ) : displayedRecord ? (
          <dl className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-6 sm:grid-cols-2">
            {Object.entries(displayedRecord).map(([key, value]) => (
              <div key={key}>
                <dt className="text-xs font-semibold uppercase text-gray-500">{key.replace(/[A-Z]/g, (letter) => ` ${letter}`).replaceAll("_", " ")}</dt>
                <dd className="mt-1 break-words text-gray-900">
                  {value === null || value === "" ? "—" : typeof value === "object" ? JSON.stringify(value) : String(value)}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-gray-500">No record found.</p>
        )
      ) : loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">No {title.toLowerCase()} yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>{columns.map((column) => <th key={column.key} className="px-4 py-3">{column.label}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-3">
                      {column.key === "id" && detailPath ? (
                        <Link className="font-semibold text-[#5A3E2B] hover:underline" to={detailPath(row.id)}>
                          {row[column.key]}
                        </Link>
                      ) : column.render ? column.render(row[column.key], row) : (row[column.key] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
