import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] opacity-80 animate-in fade-in duration-500">
      <Loader2 className="w-10 h-10 animate-spin text-purple-500 mb-4" />
      <p className="text-sm font-medium text-slate-500 font-[family-name:var(--font-quicksand)]">
        Loading...
      </p>
    </div>
  );
}
