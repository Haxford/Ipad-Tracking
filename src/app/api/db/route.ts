import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

// Cloud backend: stores the whole DB in a single file on the server.
// Auth: x-auth header (shared password/token).
// Designed for tiny IT-team use; swap with a real DB later.

const FILE = path.join(process.cwd(), "data", "db.json");
const TOKEN = process.env.CLOUD_TOKEN || "ipadtracker-cloud";

async function ensureFile() {
  try {
    await fs.access(FILE);
  } catch {
    await fs.mkdir(path.dirname(FILE), { recursive: true });
    await fs.writeFile(FILE, "{}", "utf8");
  }
}

async function readDb() {
  await ensureFile();
  const raw = await fs.readFile(FILE, "utf8");
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function writeDb(db: any) {
  await ensureFile();
  await fs.writeFile(FILE, JSON.stringify(db, null, 2), "utf8");
}

function authed(req: Request) {
  return req.headers.get("x-auth") === TOKEN;
}

export async function GET(req: Request) {
  if (!authed(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const db = await readDb();
  return NextResponse.json(db);
}

export async function POST(req: Request) {
  if (!authed(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json();
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "bad body" }, { status: 400 });
  }
  await writeDb(body);
  return NextResponse.json({ ok: true });
}
