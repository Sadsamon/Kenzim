import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { can } from "@/lib/permissions";
import { fail, sniffImage } from "@/lib/apiHelpers";
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

export async function POST(request: Request) {
  if (!(await can("catalog.manage"))) return fail("You are not allowed to add products.", 403);
  const r = await readProduct(await request.formData());
  if ("error" in r) return fail(r.error!);
  const { data: d, active, image } = r;

  let path: string | null = null;
  const admin = createAdminClient();
  if (image) {
    path = `products/${randomUUID()}.${image.ext}`;
    const up = await admin.storage.from("product-images").upload(path, image.buf, { contentType: image.mime });
    if (up.error) return fail("Photo upload failed. Please try again.", 500);
  }
  const { data, error } = await createClient()
    .from("products")
    .insert({
      retailer_id: d.retailerId, name: d.name, category: d.category || null, description: d.description || null,
      price_kes: d.priceKes, weight_kg: d.weightKg ?? null, active, image_path: path,
    })
    .select("id")
    .single();
  if (error || !data) {
    if (path) await admin.storage.from("product-images").remove([path]);
    return fail("Could not save the product.", 500);
  }
  return NextResponse.json({ id: data.id });
}
