import { api, type HealthResponse, type Item } from "@/lib/api";
import { ItemForm } from "./item-form";

async function loadHealth(): Promise<HealthResponse | { status: string; error: string }> {
  try {
    return await api.health();
  } catch (err) {
    return { status: "unreachable", error: err instanceof Error ? err.message : String(err) };
  }
}

async function loadItems(): Promise<Item[]> {
  try {
    return await api.listItems();
  } catch {
    return [];
  }
}

export default async function Home() {
  const [health, items] = await Promise.all([loadHealth(), loadItems()]);
  const healthy = health.status === "ok";

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <main className="mx-auto flex max-w-3xl flex-col gap-10 px-6 py-16">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
            yata starter
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Next.js 16 + FastAPI + PostgreSQL, all running under devbox services.
          </p>
        </header>

        <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-black dark:text-zinc-50">Backend health</h2>
            <span
              className={
                "rounded-full px-3 py-1 text-xs font-medium " +
                (healthy
                  ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
                  : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300")
              }
            >
              {health.status}
            </span>
          </div>
          {"error" in health && (
            <p className="mt-3 text-sm text-red-700 dark:text-red-400">{health.error}</p>
          )}
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-lg font-medium text-black dark:text-zinc-50">Items</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Fetched from <code className="font-mono">GET /api/items</code>.
          </p>

          <ul className="mt-4 divide-y divide-zinc-200 dark:divide-zinc-800">
            {items.length === 0 && (
              <li className="py-3 text-sm text-zinc-500 dark:text-zinc-500">
                No items yet. Create one below.
              </li>
            )}
            {items.map((item) => (
              <li key={item.id} className="py-3">
                <div className="font-medium text-black dark:text-zinc-50">{item.name}</div>
                {item.description && (
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">{item.description}</div>
                )}
              </li>
            ))}
          </ul>

          <div className="mt-6 border-t border-zinc-200 pt-6 dark:border-zinc-800">
            <ItemForm />
          </div>
        </section>
      </main>
    </div>
  );
}
