"use server";

import { revalidatePath } from "next/cache";

import { getAuthenticatedApi } from "@/lib/api";

export async function createItem(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;

  if (!name) {
    return { error: "Name is required." };
  }

  const api = await getAuthenticatedApi();
  const { error } = await api.POST("/api/items", {
    body: { name, description },
  });

  if (error) {
    return { error: "Failed to create item." };
  }

  revalidatePath("/");
  return { error: null };
}

export async function deleteItem(itemId: number) {
  const api = await getAuthenticatedApi();
  const { error } = await api.DELETE("/api/items/{item_id}", {
    params: { path: { item_id: itemId } },
  });

  if (error) {
    return { error: "Failed to delete item." };
  }

  revalidatePath("/");
  return { error: null };
}
