"use client";

import type { ComponentProps } from "react";
import { useFormStatus } from "react-dom";
import Spinner from "@/components/spinner";

type SubmitButtonProps = Omit<ComponentProps<"button">, "type"> & { pendingText?: string };

// Reusable: shows a spinner and blocks double clicks while its form runs.
export default function SubmitButton({ children, pendingText, disabled, ...rest }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending || disabled} aria-busy={pending} {...rest}>
      {pending ? (
        <>
          <Spinner />
          {pendingText}
        </>
      ) : (
        children
      )}
    </button>
  );
}