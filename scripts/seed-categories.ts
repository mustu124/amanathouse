// Re-runnable seed: upserts the 10 jewellery categories (name, slug, icon,
// description, sort order) into both the `categories` table and the
// `settings.categories` JSONB column that the storefront/admin actually
// read from. Safe to run repeatedly — it's an upsert, not an insert.
//
// Usage: npm run seed:categories
import { createClient } from "@supabase/supabase-js";
import { loadEnvConfig } from "@next/env";
import { CATEGORY_DETAILS } from "../lib/product-data";

loadEnvConfig(process.cwd());

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  const categoryRows = CATEGORY_DETAILS.map((category) => ({
    name: category.name,
    slug: category.slug,
    icon: category.icon,
    description: category.description,
    subcategories: [] as string[],
    visible: true,
    sort_order: category.sortOrder,
    updated_at: new Date().toISOString()
  }));

  console.log(`Upserting ${categoryRows.length} categories into public.categories...`);
  const { error: upsertError } = await supabase.from("categories").upsert(categoryRows, { onConflict: "name" });
  if (upsertError) throw upsertError;

  const currentNames = new Set(CATEGORY_DETAILS.map((category) => category.name));
  const { data: existingCategories, error: listError } = await supabase.from("categories").select("id, name");
  if (listError) throw listError;

  const staleCategories = (existingCategories ?? []).filter((category) => !currentNames.has(category.name));
  if (staleCategories.length > 0) {
    console.log(
      `Removing ${staleCategories.length} category row(s) no longer in the taxonomy: ${staleCategories
        .map((c) => c.name)
        .join(", ")}`
    );
    const { error: deleteError } = await supabase
      .from("categories")
      .delete()
      .in(
        "id",
        staleCategories.map((c) => c.id)
      );
    if (deleteError) {
      console.error(
        "Could not remove stale categories (likely still referenced by a product's category column):",
        deleteError.message
      );
    }
  }

  console.log("Syncing settings.categories (storefront read path)...");
  const { data: settingsRow, error: settingsFetchError } = await supabase
    .from("settings")
    .select("id")
    .limit(1)
    .maybeSingle();
  if (settingsFetchError) throw settingsFetchError;

  const settingsCategories = CATEGORY_DETAILS.map((category) => ({
    name: category.name,
    slug: category.slug,
    icon: category.icon,
    description: category.description,
    subcategories: [] as string[],
    visible: true
  }));

  if (settingsRow) {
    const { error: settingsUpdateError } = await supabase
      .from("settings")
      .update({ categories: settingsCategories, updated_at: new Date().toISOString() })
      .eq("id", settingsRow.id);
    if (settingsUpdateError) throw settingsUpdateError;
  } else {
    console.warn("No settings row found — skipped settings.categories sync (run the app once to seed it first).");
  }

  console.log(`Done. Seeded categories: ${CATEGORY_DETAILS.map((c) => c.name).join(", ")}`);
}

main().catch((error) => {
  console.error("Failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
