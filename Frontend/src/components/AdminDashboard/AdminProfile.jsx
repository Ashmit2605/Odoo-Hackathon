
import { useState } from "react";
import {
  UserRound,
  Mail,
  Phone,
  ShieldCheck,
  Building2,
  Pencil,
  Save,
  X,
  LockKeyhole,
} from "lucide-react";

export default function AdminProfile() {
  const initialProfile = {
    name: "Admin User",
    email: "admin@brightloop.com",
    phone: "+91 9876543210",
    company: "Brightloop",
    role: "Administrator",
  };

  const [profile, setProfile] = useState(initialProfile);
  const [draft, setDraft] = useState(initialProfile);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setDraft({
      ...draft,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = (e) => {
    e.preventDefault();

    if (!draft.name.trim() || !draft.phone.trim()) {
      setMessage("Name and phone number are required.");
      return;
    }

    // TODO: Send draft to your backend profile API.
    setProfile(draft);
    setEditing(false);
    setMessage("Preview updated. Changes are not saved to the server.");
  };

  const handleCancel = () => {
    setDraft(profile);
    setEditing(false);
    setMessage("");
  };

  const fields = [
    { label: "Full Name", name: "name", icon: UserRound },
    { label: "Email Address", name: "email", icon: Mail },
    { label: "Phone Number", name: "phone", icon: Phone },
    { label: "Company", name: "company", icon: Building2 },
    { label: "Role", name: "role", icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-[#FAF7F0] p-5 md:p-8 text-[#5A3E2B]">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Profile</h1>
          <p className="text-gray-500 mt-2">
            Manage your administrator account information.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="h-28 bg-[#E8EEDC]" />

          <div className="px-7 pb-7">
            <div className="flex flex-wrap items-end gap-5 -mt-10">
              <div className="w-24 h-24 rounded-2xl border-4 border-white bg-[#87A96B] flex items-center justify-center text-white">
                <UserRound size={40} />
              </div>

              <div className="flex-1">
                <h2 className="text-2xl font-bold">{profile.name}</h2>
                <p className="text-sm text-gray-500">{profile.email}</p>
              </div>

              <span className="bg-[#E8EEDC] px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                <ShieldCheck size={16} />
                Administrator
              </span>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSave}
          className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8"
        >
          <div className="flex items-center justify-between gap-4 mb-8">
            <h3 className="text-xl font-bold">Personal Information</h3>

            {!editing && (
              <button
                type="button"
                onClick={() => {
                  setEditing(true);
                  setMessage("");
                }}
                className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-2 hover:bg-[#FAF7F0]"
              >
                <Pencil size={16} />
                Edit
              </button>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {fields.map(({ label, name, icon: Icon }) => {
              const canEdit = editing && ["name", "phone", "company"].includes(name);

              return (
                <div key={name}>
                  <label htmlFor={`admin-${name}`} className="block text-sm font-semibold mb-2">
                    {label}
                  </label>

                  <div className="relative">
                    <Icon
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      id={`admin-${name}`}
                      name={name}
                      type={name === "email" ? "email" : name === "phone" ? "tel" : "text"}
                      value={draft[name]}
                      onChange={handleChange}
                      disabled={!canEdit}
                      className={`w-full border border-gray-200 rounded-xl py-3 pl-11 pr-4 outline-none ${
                        canEdit
                          ? "bg-white focus:border-[#87A96B]"
                          : "bg-gray-50 text-gray-500"
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {message && (
            <p role="status" className="text-sm mt-5 text-[#5A3E2B]">
              {message}
            </p>
          )}

          {editing && (
            <div className="flex justify-end gap-3 mt-8">
              <button
                type="button"
                onClick={handleCancel}
                className="flex items-center gap-2 border border-gray-200 px-5 py-3 rounded-xl"
              >
                <X size={17} /> Cancel
              </button>

              <button
                type="submit"
                className="flex items-center gap-2 bg-[#D5851F] text-white px-5 py-3 rounded-xl hover:bg-[#BD741A]"
              >
                <Save size={17} /> Save Changes
              </button>
            </div>
          )}
        </form>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8">
          <div className="flex items-center gap-3">
            <LockKeyhole className="text-[#87A96B]" size={24} />
            <div>
              <h3 className="text-xl font-bold">Account Security</h3>
              <p className="text-gray-500 text-sm mt-1">
                Password changes will be available after backend integration.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
