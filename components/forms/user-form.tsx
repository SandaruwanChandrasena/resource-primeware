"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { createUser, updateUser, type UserFormState } from "@/actions/users";
import SelectMenu, { toOptions } from "@/components/ui/select-menu";
import SubmitButton from "@/components/ui/submit-button";
import { ROLE_LABELS } from "@/lib/config/user-display";

const inputClass =
  "rounded-lg border border-gray-300 px-3 py-2 font-normal focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:bg-gray-100 disabled:text-gray-500";
const labelClass = "flex flex-col gap-1.5 text-sm font-medium";

type UserFormProps = {
  user?: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    department: string | null;
    role: string;
  };
  isSelf?: boolean;
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <span className="text-xs font-normal text-red-600">{message}</span>;
}

function Optional() {
  return <span className="font-normal text-gray-500">(optional)</span>;
}

// One form for Add and Edit (D51). Edit = form filled with the user.
export default function UserForm({ user, isSelf = false }: UserFormProps) {
  const action = user ? updateUser.bind(null, user.id) : createUser;
  const [state, formAction] = useActionState<UserFormState, FormData>(
    action,
    undefined,
  );

  // After an error, show what the admin typed; else show saved values.
  const values = state?.values ?? {
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    department: user?.department ?? "",
    role: user?.role ?? "MEMBER",
  };
  const fieldError = (field: keyof typeof values | "password") =>
    state?.fieldErrors?.[field]?.[0];
  const [role, setRole] = useState(values.role);

  return (
    <form
      action={formAction}
      className="flex max-w-2xl flex-col gap-5 rounded-xl border border-gray-200 bg-white p-6"
    >
      {state?.error && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {state.error}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <label className={labelClass}>
          Name
          <input
            name="name"
            required
            maxLength={80}
            defaultValue={values.name}
            className={inputClass}
          />
          <FieldError message={fieldError("name")} />
        </label>

        <label className={labelClass}>
          Email
          <input
            name="email"
            type="email"
            required
            maxLength={120}
            autoComplete="off"
            defaultValue={values.email}
            className={inputClass}
          />
          <FieldError message={fieldError("email")} />
        </label>

        <label className={labelClass}>
          <span>
            Phone <Optional />
          </span>
          <input
            name="phone"
            type="tel"
            maxLength={13}
            placeholder="0712345678"
            defaultValue={values.phone}
            className={inputClass}
          />
          <FieldError message={fieldError("phone")} />
        </label>

        <label className={labelClass}>
          <span>
            Department <Optional />
          </span>
          <input
            name="department"
            maxLength={60}
            placeholder="e.g. Marketing"
            defaultValue={values.department}
            className={inputClass}
          />
          <FieldError message={fieldError("department")} />
        </label>

        {/* A div, not a label: a label would re-open the menu on click. */}
        <div className={labelClass}>
          <span>Role</span>
          <SelectMenu
            name="role"
            label="Role"
            options={toOptions(ROLE_LABELS)}
            value={role}
            onChange={setRole}
            disabled={isSelf}
            invalid={!!fieldError("role")}
          />
          {/* D49: own role is locked (the server checks it too). */}
          {isSelf && (
            <span className="text-xs font-normal text-gray-500">
              You can't change your own role.
            </span>
          )}
          <FieldError message={fieldError("role")} />
        </div>

        <label className={labelClass}>
          {user ? (
            <span>
              New password <Optional />
            </span>
          ) : (
            "Password"
          )}
          <input
            name="password"
            type="password"
            required={!user}
            minLength={8}
            maxLength={72}
            autoComplete="new-password"
            className={inputClass}
          />
          <span className="text-xs font-normal text-gray-500">
            {user
              ? "Leave empty to keep the current password."
              : "At least 8 characters."}
          </span>
          <FieldError message={fieldError("password")} />
        </label>
      </div>

      <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
        <Link
          href="/admin/users"
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </Link>
        <SubmitButton
          pendingText="Saving..."
          className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {user ? "Save changes" : "Add user"}
        </SubmitButton>
      </div>
    </form>
  );
}
