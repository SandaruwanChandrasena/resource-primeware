"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  createResource,
  updateResource,
  type ResourceFormState,
} from "@/actions/resources";
import SelectMenu, { toOptions } from "@/components/select-menu";
import SubmitButton from "@/components/submit-button";
import { RESOURCE_TYPE_LABELS } from "@/lib/resource-types";

const inputClass =
  "rounded-lg border border-gray-300 px-3 py-2 font-normal focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100";
const labelClass = "flex flex-col gap-1.5 text-sm font-medium";

type ResourceFormProps = {
  resource?: {
    id: string;
    name: string;
    type: string;
    location: string;
    capacity: number | null;
    description: string | null;
  };
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <span className="text-xs font-normal text-red-600">{message}</span>;
}

// One form for Add and Edit (D51). Edit = form filled with the resource.
export default function ResourceForm({ resource }: ResourceFormProps) {
  const action = resource
    ? updateResource.bind(null, resource.id)
    : createResource;
  const [state, formAction] = useActionState<ResourceFormState, FormData>(
    action,
    undefined,
  );

  // After an error, show what the admin typed; else show saved values.
  const values = state?.values ?? {
    name: resource?.name ?? "",
    type: resource?.type ?? "",
    location: resource?.location ?? "",
    capacity: resource?.capacity?.toString() ?? "",
    description: resource?.description ?? "",
  };
  const fieldError = (field: keyof typeof values) =>
    state?.fieldErrors?.[field]?.[0];
  const [type, setType] = useState(values.type);

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
            aria-invalid={!!fieldError("name")}
            className={inputClass}
          />
          <FieldError message={fieldError("name")} />
        </label>

        {/* A div, not a label: a label would re-open the menu on click. */}
        <div className={labelClass}>
          <span>Type</span>
          <SelectMenu
            name="type"
            label="Type"
            placeholder="Choose a type"
            options={toOptions(RESOURCE_TYPE_LABELS)}
            value={type}
            onChange={setType}
            invalid={!!fieldError("type")}
          />
          <FieldError message={fieldError("type")} />
        </div>

        <label className={labelClass}>
          Location
          <input
            name="location"
            required
            maxLength={100}
            placeholder="e.g. 2nd Floor"
            defaultValue={values.location}
            aria-invalid={!!fieldError("location")}
            className={inputClass}
          />
          <FieldError message={fieldError("location")} />
        </label>

        <label className={labelClass}>
          <span>
            Capacity{" "}
            <span className="font-normal text-gray-500">(optional)</span>
          </span>
          <input
            name="capacity"
            type="number"
            min={1}
            step={1}
            placeholder="People or seats"
            defaultValue={values.capacity}
            aria-invalid={!!fieldError("capacity")}
            className={`${inputClass} tabular-nums`}
          />
          <FieldError message={fieldError("capacity")} />
        </label>
      </div>

      <label className={labelClass}>
        <span>
          Description{" "}
          <span className="font-normal text-gray-500">(optional)</span>
        </span>
        <textarea
          name="description"
          rows={3}
          maxLength={300}
          defaultValue={values.description}
          aria-invalid={!!fieldError("description")}
          className={inputClass}
        />
        <FieldError message={fieldError("description")} />
      </label>

      <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
        <Link
          href="/admin/resources"
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </Link>
        <SubmitButton
          pendingText="Saving..."
          className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {resource ? "Save changes" : "Add resource"}
        </SubmitButton>
      </div>
    </form>
  );
}
