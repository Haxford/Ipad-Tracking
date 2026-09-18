import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="surface p-8 text-center max-w-sm">
        <div className="text-[12px] uppercase tracking-wider muted">404</div>
        <h1 className="mt-1 text-[18px] font-semibold">Page not found</h1>
        <p className="mt-1 text-[13px] muted">The page you're looking for doesn't exist.</p>
        <div className="mt-4">
          <Link href="/" className="btn btn-primary">Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
