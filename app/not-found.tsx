// app/not-found.tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-6xl mb-4">☀</p>
      <h2 className="text-xl font-semibold text-gray-100 mb-2">Page not found</h2>
      <p className="text-sm text-gray-500 mb-6">
        This tax year or page doesn't exist.
      </p>
      <Link href="/dashboard" className="btn-primary">
        ← Back to Dashboard
      </Link>
    </div>
  );
}
