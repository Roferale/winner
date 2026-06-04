"use client";

import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";

export function SubmitButton({
  label,
  loadingLabel
}: {
  label: string;
  loadingLabel?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button className="primary-button" type="submit" disabled={pending}>
      {pending ? (
        <>
          <LoaderCircle size={16} className="spin" />
          {loadingLabel ?? "Salvando..."}
        </>
      ) : (
        label
      )}
    </button>
  );
}
