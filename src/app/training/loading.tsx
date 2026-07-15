import { BackButton } from "@/components/BackButton";
import { WhoopSkeleton } from "@/components/training/whoop-skeleton";

export default function TrainingLoading() {
  return (
    <main className="min-h-dvh bg-[#fdfcf9] text-black dark:bg-[#101010] dark:text-white">
      <div className="mx-auto w-full max-w-3xl px-6 py-10 sm:px-8">
        <BackButton href="/" />

        <header className="mt-10 max-w-xl">
          <h1 className="text-[28px] font-medium tracking-[-0.02em] sm:text-[32px]">
            Training
          </h1>
        </header>

        <div className="mt-14">
          <WhoopSkeleton />
        </div>
      </div>
    </main>
  );
}
