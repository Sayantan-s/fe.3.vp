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
    const filePath = join(process.cwd(), ".data", "transcript.json");
    const raw = await readFile(filePath, "utf-8");
    const { db } = JSON.parse(raw) as { db: Array<{ id: string }> };
    const entry = db.find((v) => v.id === id);

    if (!entry) {
      return Response.json({ error: "Transcript not found" }, { status: 404 });
    }

    return Response.json(entry);
  } catch {
    return Response.json(
      { error: "Transcript not found" },
      { status: 404 }
    );
  }
}
