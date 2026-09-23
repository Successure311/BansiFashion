import { useEffect } from "react";

export default function Toast({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(onDismiss, 2800);
    return () => clearTimeout(t);
  }, [toast, onDismiss]);

  if (!toast) return null;

  const isError = toast.type === "error";

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 w-full max-w-sm">
      <div
        className={`rounded-xl shadow-lg px-4 py-3 text-sm font-medium text-white text-center ${
          isError ? "bg-red-600" : "bg-emerald-600"
        }`}
      >
        {toast.message}
      </div>
    </div>
  );
}
