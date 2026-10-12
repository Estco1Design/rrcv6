import { readFile, realpath, stat } from "node:fs/promises";
import { resolve, sep, extname } from "node:path";
import { hasPrivateAccessSession } from "@/lib/private-access";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const types: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
};
const missing = () =>
  new Response(null, {
    status: 404,
    headers: { "Cache-Control": "private, no-store" },
  });
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    if (!(await hasPrivateAccessSession())) return missing();
    const { path } = await params;
    if (
      !path.length ||
      path.length > 8 ||
      !path.every(
        (part) =>
          /^[A-Za-z0-9._-]+$/.test(part) && part !== "." && part !== "..",
      )
    )
      return missing();
    const mime = types[extname(path.at(-1)!).toLowerCase()];
    if (!mime) return missing();
    const root = await realpath(
      resolve(process.env.RRC_PRIVATE_MEDIA_PATH || "var/private-media"),
    );
    const file = await realpath(resolve(root, ...path));
    if (!file.startsWith(root + sep)) return missing();
    const info = await stat(file);
    if (!info.isFile() || info.size > 16 * 1024 * 1024) return missing();
    const data = await readFile(file);
    return new Response(data, {
      headers: {
        "Content-Type": mime,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Length": String(data.length),
      },
    });
  } catch {
    return missing();
  }
}
