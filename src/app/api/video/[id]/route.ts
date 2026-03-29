import { type NextRequest } from "next/server";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return Response.json({ error: "Video ID is required" }, { status: 400 });
  }

  try {
    const filePath = join(process.cwd(), ".data", "video.json");
    const raw = await readFile(filePath, "utf-8");
    const { db } = JSON.parse(raw) as { db: Array<{ id: string }> };
    const video = db.find((v) => v.id === id);

    if (!video) {
      return Response.json({ error: "Video not found" }, { status: 404 });
    }

    return Response.json(video);
  } catch {
    return Response.json({ error: "Video not found" }, { status: 404 });
  }
}
