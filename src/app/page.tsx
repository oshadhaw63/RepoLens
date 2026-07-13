import { GitBranch, Search } from "lucide-react";

import { RepoGraph } from "@/components/repo-graph";

export default function Home() {
  return (
    <main className="min-h-screen bg-stone-100 text-stone-950">
      <header className="border-b border-stone-300 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <GitBranch className="h-6 w-6 text-teal-700" />
            <h1 className="text-xl font-semibold">RepoLens</h1>
          </div>

          <label className="flex w-80 items-center gap-2 rounded-md border border-stone-300 bg-stone-50 px-3 py-2 text-sm">
            <Search className="h-4 w-4 text-stone-500" />
            <input
              className="w-full bg-transparent outline-none"
              placeholder="Search files, functions, or features"
            />
          </label>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl grid-cols-[1fr_320px] gap-6 px-6 py-6">
        <div className="h-[620px] overflow-hidden rounded-lg border border-stone-300 bg-white">
          <RepoGraph />
        </div>

        <aside className="rounded-lg border border-stone-300 bg-white p-5">
          <p className="text-sm font-medium text-stone-500">Selected file</p>
          <h2 className="mt-2 text-lg font-semibold">src/app/page.tsx</h2>
          <p className="mt-3 text-sm leading-6 text-stone-700">
            Main application screen. It renders the RepoLens interface and
            connects the graph view to the rest of the app.
          </p>
        </aside>
      </section>
    </main>
  );
}