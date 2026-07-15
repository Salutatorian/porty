"use client";

import { BackButton } from "@/components/BackButton";

export default function TrainingError({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="min-h-dvh bg-[#fdfcf9] text-black dark:bg-[#101010] dark:text-white">
      <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-6 py-10 sm:px-8">
        <BackButton href="/" />

        <div className="flex flex-1 items-center justify-center pb-20">
          <div className="max-w-sm text-center">
            <h1 className="text-lg font-medium">
              WHOOP data could not be loaded.
            </h1>

            <p className="mt-2 text-sm text-foreground/45">
              The training page is available, but the latest recovery data could
              not be retrieved.
            </p>

            <button
              type="button"
              onClick={reset}
              className="mt-5 rounded-full border border-foreground/[0.1] px-4 py-2 text-sm"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
