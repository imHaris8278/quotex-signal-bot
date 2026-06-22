"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-950 px-4 text-zinc-50">
        <h2 className="text-xl font-semibold">Application error</h2>
        <p className="max-w-md text-center text-sm text-zinc-400">{error.message}</p>
        <button
          onClick={reset}
          className="rounded-xl bg-indigo-500 px-5 py-2 text-sm font-medium text-white"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
