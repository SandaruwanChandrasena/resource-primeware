"use client";

import {
  startTransition,
  useActionState,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { changeMyPassword, type PasswordChangeState } from "@/actions/profile";
import PasswordInput from "@/components/ui/password-input";
import PendingLabel from "@/components/ui/pending-label";

const inputClass =
  "rounded-lg border border-gray-300 px-3 py-2 font-normal focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100";
const labelClass = "flex flex-col gap-1.5 text-sm font-medium";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <span className="text-xs font-normal text-red-600">{message}</span>;
}

// Change your own password: type it twice -> "Are you sure?" -> save (D75).
export default function PasswordChangeForm() {
  const [state, formAction, isPending] = useActionState<
    PasswordChangeState,
    FormData
  >(changeMyPassword, undefined);
  const [clientError, setClientError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  // After a successful change, empty both boxes.
  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  // Runs only after the browser checks (required, min 8) pass.
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (data.get("newPassword") !== data.get("confirmPassword")) {
      setClientError("The two passwords don't match.");
      return;
    }
    setClientError("");
    dialogRef.current?.showModal();
  }

  function confirmChange() {
    dialogRef.current?.close();
    if (!formRef.current) return;
    const data = new FormData(formRef.current);
    startTransition(() => formAction(data));
  }

  // A new client error hides the old server message.
  const error = clientError || state?.error;
  const fieldError = (field: "newPassword" | "confirmPassword") =>
    clientError ? undefined : state?.fieldErrors?.[field]?.[0];

  return (
    <>
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="flex flex-col gap-5 rounded-xl border border-gray-200 bg-white p-6"
      >
        <div>
          <h2 className="text-lg font-semibold">Change password</h2>
          <p className="mt-1 text-sm text-gray-500">
            You will stay logged in. Use the new password next time.
          </p>
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {error}
          </p>
        )}
        {!clientError && state?.success && (
          <p
            role="status"
            className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700"
          >
            {state.success}
          </p>
        )}

        <label className={labelClass}>
          New password
          <PasswordInput
            name="newPassword"
            required
            minLength={8}
            maxLength={72}
            autoComplete="new-password"
            className={inputClass}
          />
          <span className="text-xs font-normal text-gray-500">
            At least 8 characters.
          </span>
          <FieldError message={fieldError("newPassword")} />
        </label>

        <label className={labelClass}>
          Confirm new password
          <PasswordInput
            name="confirmPassword"
            required
            minLength={8}
            maxLength={72}
            autoComplete="new-password"
            className={inputClass}
          />
          <FieldError message={fieldError("confirmPassword")} />
        </label>

        <div className="flex justify-end border-t border-gray-100 pt-5">
          <button
            type="submit"
            disabled={isPending}
            aria-busy={isPending}
            className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            <PendingLabel pending={isPending} pendingText="Changing...">
              Change password
            </PendingLabel>
          </button>
        </div>
      </form>

      {/* Native dialog: focus trap and Esc key come for free (D57). */}
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onClick={(e) =>
          e.target === e.currentTarget && dialogRef.current?.close()
        }
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border border-gray-200 bg-white p-6 text-left text-gray-900 shadow-xl backdrop:bg-gray-900/40"
      >
        <h2 id={titleId} className="text-lg font-semibold">
          Change your password?
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Your old password will stop working. Use the new one next time you log
          in.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirmChange}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Yes, change it
          </button>
        </div>
      </dialog>
    </>
  );
}
