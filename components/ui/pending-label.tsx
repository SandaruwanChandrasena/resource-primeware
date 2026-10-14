import Spinner from "@/components/ui/spinner";

type PendingLabelProps = {
  pending: boolean;
  children: React.ReactNode;
  pendingText?: string;
};

// Both labels share one grid cell, so the button never changes width.
export default function PendingLabel({
  pending,
  children,
  pendingText,
}: PendingLabelProps) {
  return (
    <span className="inline-grid place-items-center">
      <span
        className={`col-start-1 row-start-1 flex items-center gap-2 ${pending ? "invisible" : ""}`}
      >
        {children}
      </span>
      <span
        className={`col-start-1 row-start-1 flex items-center gap-2 ${pending ? "" : "invisible"}`}
      >
        <Spinner />
        {pendingText}
      </span>
    </span>
  );
}
