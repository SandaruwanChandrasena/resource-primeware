"use client";

import { useActionState, useState } from "react";
import {
  removeMyPhoto,
  updateMyPhoto,
  type PhotoState,
} from "@/actions/profile";
import ConfirmButton from "@/components/ui/confirm-button";
import SubmitButton from "@/components/ui/submit-button";
import UserAvatar from "@/components/ui/user-avatar";

const MAX_MB = 2;
const TYPES = ["image/jpeg", "image/png", "image/webp"];

const secondaryBtn =
  "cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 focus-within:ring-2 focus-within:ring-brand-100";

type ProfilePhotoFormProps = {
  name: string;
  imageName: string | null;
  children?: React.ReactNode;
};

// Big avatar + choose / save / remove photo (D77).
export default function ProfilePhotoForm({
  name,
  imageName,
  children,
}: ProfilePhotoFormProps) {
  const [state, formAction] = useActionState<PhotoState, FormData>(
    updateMyPhoto,
    undefined,
  );
  const [picked, setPicked] = useState<{ url: string; at?: number } | null>(
    null,
  );
  const [pickError, setPickError] = useState("");

  // A preview belongs to one try; after a save it hides and the real photo shows.
  const preview = picked && picked.at === state?.attempt ? picked.url : null;

  // Quick check in the browser; the server checks again (first bytes).
  function pick(file: File | undefined) {
    if (picked) URL.revokeObjectURL(picked.url);
    setPicked(null);
    setPickError("");
    if (!file) return;
    if (!TYPES.includes(file.type))
      return setPickError("Photo must be a JPG, PNG or WebP image.");
    if (file.size > MAX_MB * 1024 * 1024)
      return setPickError(`Photo is too big (max ${MAX_MB} MB).`);
    setPicked({ url: URL.createObjectURL(file), at: state?.attempt });
  }

  const error = pickError || state?.error;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-4">
        <UserAvatar
          name={name}
          imageName={imageName}
          previewUrl={preview}
          size="lg"
          className="ring-2 ring-brand-600/40 ring-offset-2"
        />

        <div className="flex min-w-0 flex-col gap-2">
          {children}
          {/* New key after each try: the browser clears the file box anyway. */}
          <form
            action={formAction}
            className="flex flex-wrap items-center gap-2"
          >
            <label className={secondaryBtn}>
              {imageName ? "Change photo" : "Upload photo"}
              <input
                key={state?.attempt ?? 0}
                type="file"
                name="image"
                accept={TYPES.join(",")}
                onChange={(e) => pick(e.target.files?.[0])}
                className="sr-only"
              />
            </label>
            {preview && (
              <>
                <SubmitButton
                  pendingText="Saving..."
                  className="flex items-center gap-2 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-60"
                >
                  Save photo
                </SubmitButton>
                <button
                  type="reset"
                  onClick={() => pick(undefined)}
                  className="rounded-lg px-2 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-900"
                >
                  Cancel
                </button>
              </>
            )}
          </form>

          {/* Outside the form above: ConfirmButton has its own form. */}
          {imageName && !preview && (
            <ConfirmButton
              action={removeMyPhoto}
              label="Remove photo"
              className="self-start rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
              title="Remove your photo?"
              message="Your initials will show instead of the photo."
              confirmLabel="Remove photo"
              pendingText="Removing..."
              cancelLabel="Keep photo"
            />
          )}

          <span className="text-xs text-gray-500">
            {preview
              ? "Preview only. Click Save photo to keep it."
              : `JPG, PNG or WebP, max ${MAX_MB} MB.`}
          </span>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      {!error && state?.success && !preview && (
        <p
          role="status"
          className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700"
        >
          {state.success}
        </p>
      )}
    </div>
  );
}
