"use client";

import { useId, useRef } from "react";
import { useFormStatus } from "react-dom";
import PendingLabel from "@/components/ui/pending-label";

type ConfirmButtonProps = {
  action: () => Promise<void>;
  label: string;
  className: string;
  title: string;
  message: string;
  confirmLabel: string;
  pendingText: string;
  cancelLabel?: string;
};

type DialogButtonsProps = {
  confirmLabel: string;
  pendingText: string;
  cancelLabel: string;
  onCancel: () => void;
};

// Inside the form, so it can read the pending state.
function DialogButtons({
  confirmLabel,
  pendingText,
  cancelLabel,
  onCancel,
}: DialogButtonsProps) {
  const { pending } = useFormStatus();

  return (
    <div className="mt-6 flex justify-end gap-3">
      <button
        type="button"
        onClick={onCancel}
        disabled={pending}
        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
      >
        {cancelLabel}
      </button>
      <button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
      >
        <PendingLabel pending={pending} pendingText={pendingText}>
          {confirmLabel}
        </PendingLabel>
      </button>
    </div>
  );
}

// Reusable: asks "Are you sure?" before a risky action runs.
export default function ConfirmButton({
  action,
  label,
  className,
  title,
  message,
  confirmLabel,
  pendingText,
  cancelLabel = "Cancel",
}: ConfirmButtonProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const close = () => dialogRef.current?.close();

  async function confirm() {
    await action();
    close();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className={className}
      >
        {label}
      </button>

      {/* Native dialog: focus trap and Esc key come for free. */}
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onClick={(e) => e.target === e.currentTarget && close()}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border border-gray-200 bg-white p-6 text-left text-gray-900 shadow-xl backdrop:bg-gray-900/40"
      >
        <form action={confirm}>
          <h2 id={titleId} className="text-lg font-semibold">
            {title}
          </h2>
          <p className="mt-2 text-sm text-gray-600">{message}</p>
          <DialogButtons
            confirmLabel={confirmLabel}
            pendingText={pendingText}
            cancelLabel={cancelLabel}
            onCancel={close}
          />
        </form>
      </dialog>
    </>
  );
}
