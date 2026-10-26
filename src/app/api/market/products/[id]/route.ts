import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { can } from "@/lib/permissions";
import { fail, isUuid, sniffImage } from "@/lib/apiHelpers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { productSchema } from "@/lib/validation/market";

export const runtime = "nodejs";

async function readProduct(form: FormData) {
  const parsed = productSchema.safeParse({
    retailerId: form.get("retailerId"),
    name: form.get("name"),
    category: form.get("category"),
    description: form.get("description"),
    priceKes: form.get("priceKes"),
    weightKg: form.get("weightKg"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message } as const;
  let image: { buf: Buffer; ext: string; mime: string } | null = null;
  const file = form.get("photo");
  if (file instanceof File && file.size > 0) {
    if (file.size > 3 * 1024 * 1024) return { error: "That photo is too large." } as const;
    const buf = Buffer.from(await file.arrayBuffer());
    const kind = sniffImage(buf);
    if (!kind) return { error: "Use a JPG, PNG or WebP photo." } as const;
    image = { buf, ...kind };
  }
  return { data: parsed.data, active: form.get("active") === "on", image } as const;
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  if (!isUuid(params.id)) return fail("Invalid product.");
  if (!(await can("catalog.manage"))) return fail("You are not allowed to edit products.", 403);
  const r = await readProduct(await request.formData());
  if ("error" in r) return fail(r.error!);
  const { data: d, active, image } = r;

  const supabase = createClient();
  const { data: old } = await supabase.from("products").select("image_path").eq("id", params.id).maybeSingle();
  if (!old) return fail("Product not found.", 404);

  const admin = createAdminClient();
  let path = old.image_path as string | null;
  if (image) {
    const next = `products/${randomUUID()}.${image.ext}`;
    const up = await admin.storage.from("product-images").upload(next, image.buf, { contentType: image.mime });
    if (up.error) return fail("Photo upload failed. Please try again.", 500);
    if (path) await admin.storage.from("product-images").remove([path]);
    path = next;
  }
  const { error } = await supabase
    .from("products")
    .update({
      retailer_id: d.retailerId, name: d.name, category: d.category || null, description: d.description || null,
      price_kes: d.priceKes, weight_kg: d.weightKg ?? null, active, image_path: path,
    })
    .eq("id", params.id);
  if (error) return fail("Could not save the product.", 500);
  return NextResponse.json({ id: params.id });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  if (!isUuid(params.id)) return fail("Invalid product.");
  if (!(await can("catalog.manage"))) return fail("You are not allowed to delete products.", 403);
  const supabase = createClient();
  const { data, error } = await supabase.from("products").delete().eq("id", params.id).select("image_path");
  if (error) return fail(`The database refused: ${error.message}`, 500);
  if (!data?.length) return fail("Nothing was deleted.", 404);
  if (data[0].image_path) await createAdminClient().storage.from("product-images").remove([data[0].image_path]);
  return NextResponse.json({ ok: true });
}
