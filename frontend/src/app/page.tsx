import { auth0 } from "@/lib/auth0";
import { api, getAuthenticatedApi, type HealthResponse, type Item } from "@/lib/api";
import { ItemForm } from "./item-form";

// Short timeout for backend fetches during static generation. At build
// time the Fly backend may be cold or unreachable; the page gracefully
// falls back to "unreachable" / empty items, so a fast failure is fine.
const FETCH_TIMEOUT_MS = 5_000;

async function loadHealth(): Promise<HealthResponse | { status: string; error: string }> {
  try {
    const { data, error } = await api.GET("/api/health", {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (error || !data) {
      throw new Error("Failed to load health");
    }
    return data;
  } catch (err) {
    return { status: "unreachable", error: err instanceof Error ? err.message : String(err) };
  }
}

async function loadItems(): Promise<Item[]> {
  try {
    const authedApi = await getAuthenticatedApi();
    const { data } = await authedApi.GET("/api/items", {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    return data ?? [];
  } catch {
    return [];
  }
}

export default async function Home() {
  const session = await auth0.getSession();
  const [health, items] = await Promise.all([
    loadHealth(),
    session ? loadItems() : Promise.resolve([]),
  ]);
  const healthy = health.status === "ok";

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <main className="mx-auto flex max-w-3xl flex-col gap-10 px-6 py-16">
        <header className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
              yata starter
            </h1>
            {session ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  {session.user.name ?? session.user.email}
                </span>
                <a
                  href="/auth/logout"
                  className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
                >
                  Log out
                </a>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <a
                  href="/auth/login"
                  className="rounded-md bg-black px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
                >
                  Log in
                </a>
                <a
                  href="/auth/login?screen_hint=signup"
                  className="rounded-md border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
                >
                  Sign up
                </a>
              </div>
            )}
          </div>
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

        {session ? (
          <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-lg font-medium text-black dark:text-zinc-50">Items</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Your items, fetched from <code className="font-mono">GET /api/items</code>.
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
                    <div className="text-sm text-zinc-600 dark:text-zinc-400">
                      {item.description}
                    </div>
                  )}
                </li>
              ))}
            </ul>

            <div className="mt-6 border-t border-zinc-200 pt-6 dark:border-zinc-800">
              <ItemForm />
            </div>
          </section>
        ) : (
          <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-lg font-medium text-black dark:text-zinc-50">Items</h2>
            <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-500">
              <a href="/auth/login" className="underline hover:text-zinc-700 dark:hover:text-zinc-300">
                Log in
              </a>{" "}
              to view and manage your items.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
