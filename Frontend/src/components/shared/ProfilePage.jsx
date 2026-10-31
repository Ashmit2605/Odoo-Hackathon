import { useEffect, useState } from "react";
import {
  AlertCircle,
  Building2,
  LoaderCircle,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Save,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import { getProfile, updateProfile } from "../../services/authService.js";

const ROLE_CONFIG = {
  ADMIN: {
    title: "Admin Profile",
    description: "Manage your administrator account information.",
    label: "Administrator",
    fields: ["name", "email", "phone", "companyName"],
    editable: ["name", "phone", "companyName"],
  },
  STAFF: {
    title: "Staff Profile",
    description: "View and manage your employee account information.",
    label: "Staff Member",
    fields: ["name", "email", "phone"],
    editable: ["name", "phone"],
  },
  CUSTOMER: {
    title: "My Profile",
    description: "Manage your account information.",
    label: "Customer",
    fields: ["name", "email", "phone", "companyName", "address"],
    editable: ["name", "phone", "companyName", "address"],
  },
};

const FIELD_CONFIG = {
  name: { label: "Full Name", icon: UserRound, type: "text" },
  email: { label: "Email Address", icon: Mail, type: "email" },
  phone: { label: "Phone Number", icon: Phone, type: "tel" },
  companyName: { label: "Company Name", icon: Building2, type: "text" },
  address: { label: "Address", icon: MapPin, type: "textarea" },
};

const toProfileValues = (result) => ({
  name: result.user?.name ?? "",
  email: result.user?.email ?? "",
  role: result.user?.role ?? "",
  phone: result.customer?.phone ?? "",
  companyName: result.customer?.companyName ?? "",
  address: result.customer?.address ?? "",
});

export default function ProfilePage({ role }) {
  const config = ROLE_CONFIG[role];
  const [profile, setProfile] = useState(null);
  const [draft, setDraft] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    getProfile()
      .then((result) => {
        if (cancelled) return;
        const values = toProfileValues(result);
        setProfile(values);
        setDraft(values);
        setError("");
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load your profile.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const reload = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getProfile();
      const values = toProfileValues(result);
      setProfile(values);
      setDraft(values);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load your profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setDraft((current) => ({ ...current, [name]: value }));
    setMessage("");
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!draft.name.trim()) {
      setMessage("Full name is required.");
      return;
    }

    const updates = {
      name: draft.name.trim(),
      phone: draft.phone.trim(),
    };
    if (config.fields.includes("companyName")) {
      updates.companyName = draft.companyName.trim();
    }
    if (config.fields.includes("address")) {
      updates.address = draft.address.trim();
    }

    setSaving(true);
    setMessage("");
    setError("");
    try {
      const result = await updateProfile(updates);
      const values = toProfileValues(result);
      setProfile(values);
      setDraft(values);
      setEditing(false);
      const storage = localStorage.getItem("token") ? localStorage : sessionStorage;
      storage.setItem("user", JSON.stringify(result.user));
      if (result.customer) storage.setItem("customer", JSON.stringify(result.customer));
      setMessage("Your profile has been saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save your profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setDraft(profile);
    setEditing(false);
    setMessage("");
    setError("");
  };

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[#FCFAF7]">
        <LoaderCircle size={28} className="animate-spin text-[#87A96B]" />
        <span className="sr-only">Loading profile</span>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#FCFAF7] p-5 text-stone-800 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{config.title}</h1>
          <p className="mt-2 text-sm text-stone-500">{config.description}</p>
        </div>

        {error && (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span className="flex items-center gap-2"><AlertCircle size={17} />{error}</span>
            {!profile && <button type="button" onClick={reload} className="font-semibold underline">Retry</button>}
          </div>
        )}

        {profile && draft && (
          <>
            <div className="overflow-hidden rounded-2xl border border-[#EAE5DA] bg-white">
              <div className="h-28 bg-[#E8EEDC]" />
              <div className="px-7 pb-7">
                <div className="-mt-10 flex flex-wrap items-end gap-5">
                  <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-white bg-[#87A96B] text-white">
                    <UserRound size={40} />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold">{profile.name}</h2>
                    <p className="text-sm text-stone-500">{profile.email}</p>
                  </div>
                  <span className="flex items-center gap-2 rounded-full bg-[#E8EEDC] px-4 py-2 text-sm font-semibold text-[#496A36]">
                    <ShieldCheck size={16} />{config.label}
                  </span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSave} className="rounded-2xl border border-[#EAE5DA] bg-white p-6 md:p-8">
              <div className="mb-8 flex items-center justify-between gap-4">
                <h3 className="text-xl font-bold">Personal Information</h3>
                {!editing && (
                  <button
                    type="button"
                    onClick={() => { setEditing(true); setMessage(""); setError(""); }}
                    className="flex items-center gap-2 rounded-xl border border-[#DDD6C6] px-4 py-2 hover:bg-[#F4F1E9]"
                  >
                    <Pencil size={16} />Edit
                  </button>
                )}
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {config.fields.map((name) => {
                  const field = FIELD_CONFIG[name];
                  const Icon = field.icon;
                  const canEdit = editing && config.editable.includes(name);
                  return (
                    <div key={name}>
                      <label htmlFor={`${role.toLowerCase()}-${name}`} className="mb-2 block text-sm font-semibold">
                        {field.label}
                      </label>
                      <div className="relative">
                        <Icon size={18} className="absolute left-4 top-4 text-stone-400" />
                        {field.type === "textarea" ? (
                          <textarea
                            id={`${role.toLowerCase()}-${name}`}
                            name={name}
                            value={draft[name]}
                            onChange={handleChange}
                            disabled={!canEdit}
                            rows={3}
                            className={`w-full resize-y rounded-xl border border-[#DDD6C6] py-3 pl-11 pr-4 outline-none ${canEdit ? "bg-white focus:border-[#87A96B]" : "bg-stone-50 text-stone-500"}`}
                          />
                        ) : (
                          <input
                            id={`${role.toLowerCase()}-${name}`}
                            name={name}
                            type={field.type}
                            value={draft[name]}
                            onChange={handleChange}
                            disabled={!canEdit}
                            className={`w-full rounded-xl border border-[#DDD6C6] py-3 pl-11 pr-4 outline-none ${canEdit ? "bg-white focus:border-[#87A96B]" : "bg-stone-50 text-stone-500"}`}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {message && <p role="status" className="mt-5 text-sm text-[#496A36]">{message}</p>}

              {editing && (
                <div className="mt-8 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={saving}
                    className="flex items-center gap-2 rounded-xl border border-[#DDD6C6] px-5 py-3 disabled:opacity-60"
                  >
                    <X size={17} />Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 rounded-xl bg-[#87A96B] px-5 py-3 font-semibold text-[#14200F] hover:bg-[#76986a] disabled:opacity-60"
                  >
                    {saving ? <LoaderCircle size={17} className="animate-spin" /> : <Save size={17} />}
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              )}
            </form>
          </>
        )}
      </div>
    </div>
  );
}
