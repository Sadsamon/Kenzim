import "server-only";
import crypto from "node:crypto";

function key(): Buffer {
  const secret = process.env.ID_ENCRYPTION_KEY;
  if (!secret || secret.length < 32) {
    throw new Error("ID_ENCRYPTION_KEY must be set and at least 32 characters long");
  }
  return crypto.createHash("sha256").update(secret).digest();
}

// AES-256-GCM. Output format: v1:iv:tag:ciphertext (all base64).
export function encrypt(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64"), cipher.getAuthTag().toString("base64"), ct.toString("base64")].join(":");
}

export function decrypt(blob: string): string {
  const [v, iv, tag, ct] = blob.split(":");
  if (v !== "v1" || !iv || !tag || !ct) throw new Error("Unsupported format");
  const d = crypto.createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64"));
  d.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([d.update(Buffer.from(ct, "base64")), d.final()]).toString("utf8");
}
