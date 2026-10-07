"use client";

import { useState, useCallback } from "react";
import { Save, Loader2, CheckCircle2, AlertCircle, User, MapPin, Phone } from "lucide-react";

type CustomerProfile = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  postalCode: string | null;
};

type FieldDef = {
  key: keyof Omit<CustomerProfile, "id" | "email">;
  label: string;
  placeholder: string;
  required?: boolean;
  type?: string;
};

const PERSONAL_FIELDS: FieldDef[] = [
  { key: "firstName", label: "First Name", placeholder: "e.g. John", required: true },
  { key: "lastName", label: "Last Name", placeholder: "e.g. Doe", required: true },
  { key: "phone", label: "Phone Number", placeholder: "e.g. +94 77 123 4567", type: "tel" },
];

const ADDRESS_FIELDS: FieldDef[] = [
  { key: "address", label: "Street Address", placeholder: "e.g. 42 Galle Road" },
  { key: "city", label: "City", placeholder: "e.g. Colombo" },
  { key: "province", label: "Province / District", placeholder: "e.g. Western Province" },
  { key: "postalCode", label: "Postal Code", placeholder: "e.g. 10250" },
];

type FormState = {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
};

function toFormState(profile: CustomerProfile): FormState {
  return {
    firstName: profile.firstName ?? "",
    lastName: profile.lastName ?? "",
    phone: profile.phone ?? "",
    address: profile.address ?? "",
    city: profile.city ?? "",
    province: profile.province ?? "",
    postalCode: profile.postalCode ?? "",
  };
}

// ---------------------------------------------------------------------------
// Sub-component: Field group
// ---------------------------------------------------------------------------
function FieldGroup({
  fields,
  values,
  onChange,
  disabled,
}: {
  fields: FieldDef[];
  values: FormState;
  onChange: (key: keyof FormState, value: string) => void;
  disabled: boolean;
}) {
  return (
    <>
      {fields.map((field) => (
        <div key={field.key} className="flex flex-col gap-1.5">
          <label
            htmlFor={`profile-${field.key}`}
            className="text-[11px] font-semibold uppercase tracking-wider text-white/40"
          >
            {field.label}
            {field.required && <span className="ml-1 text-amber-400">*</span>}
          </label>
          <input
            id={`profile-${field.key}`}
            type={field.type ?? "text"}
            autoComplete="off"
            placeholder={field.placeholder}
            value={values[field.key as keyof FormState]}
            onChange={(e) => onChange(field.key as keyof FormState, e.target.value)}
            disabled={disabled}
            className="
              w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5
              text-sm text-white placeholder-white/20
              transition
              focus:border-amber-500/50 focus:bg-white/[0.06] focus:outline-none focus:ring-1 focus:ring-amber-500/30
              disabled:cursor-not-allowed disabled:opacity-50
            "
          />
        </div>
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Main: ProfileEditor
// ---------------------------------------------------------------------------
export function ProfileEditor({ initialProfile }: { initialProfile: CustomerProfile }) {
  const [form, setForm] = useState<FormState>(() => toFormState(initialProfile));
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = useCallback((key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setStatus("idle");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("idle");
    setErrorMsg("");

    // Client-side guard
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setStatus("error");
      setErrorMsg("First name and last name are required.");
      return;
    }

    setSaving(true);

    try {
      const payload: Record<string, string | null> = {
        firstName: form.firstName.trim() || null,
        lastName: form.lastName.trim() || null,
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        city: form.city.trim() || null,
        province: form.province.trim() || null,
        postalCode: form.postalCode.trim() || null,
      };

      const res = await fetch("/api/customer/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data: unknown = await res.json();

      if (!res.ok) {
        const msg =
          typeof data === "object" && data !== null && "error" in data
            ? String((data as Record<string, unknown>).error)
            : "Failed to update profile.";
        setStatus("error");
        setErrorMsg(msg);
        return;
      }

      setStatus("success");

      // Update local form with server-confirmed values
      if (
        typeof data === "object" &&
        data !== null &&
        "customer" in data
      ) {
        const c = (data as { customer: CustomerProfile }).customer;
        setForm(toFormState(c));
      }
    } catch {
      setStatus("error");
      setErrorMsg("A network error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8" noValidate>
      {/* ---- Personal Info ---- */}
      <section>
        <div className="mb-5 flex items-center gap-2.5 border-b border-white/[0.06] pb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-400">
            <User size={15} />
          </div>
          <h2 className="font-display text-sm font-semibold text-white">Personal Information</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FieldGroup fields={PERSONAL_FIELDS.slice(0, 2)} values={form} onChange={handleChange} disabled={saving} />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FieldGroup fields={[PERSONAL_FIELDS[2]]} values={form} onChange={handleChange} disabled={saving} />
          {/* Email — read-only via Supabase */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
              Email Address
              <span className="ml-2 rounded-full border border-white/10 px-2 py-px text-[9px] font-medium uppercase text-white/30">
                Managed by Auth
              </span>
            </label>
            <div className="flex w-full items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm text-white/40">
              <span className="flex-1 truncate">{initialProfile.email}</span>
            </div>
            <p className="text-[10px] text-white/25">
              Email changes are managed through your authentication provider.
            </p>
          </div>
        </div>
      </section>

      {/* ---- Address ---- */}
      <section>
        <div className="mb-5 flex items-center gap-2.5 border-b border-white/[0.06] pb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-400">
            <MapPin size={15} />
          </div>
          <h2 className="font-display text-sm font-semibold text-white">Shipping Address</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FieldGroup fields={[ADDRESS_FIELDS[0]]} values={form} onChange={handleChange} disabled={saving} />
          </div>
          <FieldGroup fields={ADDRESS_FIELDS.slice(1)} values={form} onChange={handleChange} disabled={saving} />
        </div>
      </section>

      {/* ---- Status banner ---- */}
      {status === "success" && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-3 text-sm text-emerald-300"
        >
          <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
          <span>Profile updated successfully.</span>
        </div>
      )}
      {status === "error" && (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-xl border border-rose-500/20 bg-rose-500/[0.08] px-4 py-3 text-sm text-rose-300"
        >
          <AlertCircle size={16} className="shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ---- Submit ---- */}
      <div className="flex justify-end">
        <button
          id="profile-save-btn"
          type="submit"
          disabled={saving}
          className="
            inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-2.5
            font-display text-sm font-semibold text-black
            shadow-[0_0_20px_rgba(245,158,11,0.25)]
            transition
            hover:bg-amber-400 hover:shadow-[0_0_30px_rgba(245,158,11,0.35)]
            disabled:cursor-not-allowed disabled:opacity-60
          "
        >
          {saving ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save size={15} />
              Save Changes
            </>
          )}
        </button>
      </div>
    </form>
  );
}
