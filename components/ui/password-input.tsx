"use client";

import { useState, type InputHTMLAttributes } from "react";
import { EyeIcon, EyeOffIcon } from "@/components/layout/app-icons";

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

// Password box with an eye button to show or hide the text.
export default function PasswordInput({
  className = "",
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        {...props}
        type={visible ? "text" : "password"}
        // pr-10 leaves room for the eye; ms-reveal hides Edge's own eye.
        className={`${className} w-full pr-10 [&::-ms-reveal]:hidden`}
      />
      <button
        // type="button" so it never submits the form.
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        title={visible ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg text-gray-400 hover:text-gray-700 focus:outline-none focus-visible:text-brand-700"
      >
        {visible ? (
          <EyeOffIcon className="h-4.5 w-4.5" />
        ) : (
          <EyeIcon className="h-4.5 w-4.5" />
        )}
      </button>
    </div>
  );
}
