"use client";

import { useState } from "react";
import { createItem } from "./actions";

export function ItemForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsPending(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const result = await createItem(formData);
      if (result.error) {
        setError(result.error);
      } else {
        form.reset();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create item");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <h3 className="text-sm font-medium text-black dark:text-zinc-50">Create an item</h3>
      <input
        type="text"
        name="name"
        placeholder="Name"
        className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
      />
      <input
        type="text"
        name="description"
        placeholder="Description (optional)"
        className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
      />
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
      >
        {isPending ? "Saving..." : "Add item"}
      </button>
    </form>
  );
}
