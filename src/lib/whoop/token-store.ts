import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { normalizeWhoopToken } from "@/lib/whoop/normalize";

const ROW_ID = "default";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function persistRefreshTokenToEnvLocal(newToken: string) {
  if (process.env.NODE_ENV === "production") return;
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;

  try {
    const txt = fs.readFileSync(envPath, "utf8");
    const line = `WHOOP_REFRESH_TOKEN=${newToken}`;
    const updated = txt.match(/^WHOOP_REFRESH_TOKEN=/m)
      ? txt.replace(/^WHOOP_REFRESH_TOKEN=.*$/m, line)
      : `${txt.replace(/\s*$/, "\n")}${line}\n`;
    fs.writeFileSync(envPath, updated, "utf8");
    process.env.WHOOP_REFRESH_TOKEN = newToken;
  } catch {
    // Non-fatal in dev.
  }
}

export async function loadWhoopRefreshToken(): Promise<string> {
  const fromEnv = normalizeWhoopToken(process.env.WHOOP_REFRESH_TOKEN);
  const supabase = getServiceClient();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("whoop_token")
        .select("refresh_token")
        .eq("id", ROW_ID)
        .maybeSingle();

      if (!error && data?.refresh_token) {
        const stored = normalizeWhoopToken(data.refresh_token);
        if (stored) {
          process.env.WHOOP_REFRESH_TOKEN = stored;
          return stored;
        }
      }

      if (error) {
        console.warn("[whoop] Supabase whoop_token read failed:", error.message);
      }

      // Bootstrap: copy env token into Supabase on first run.
      if (fromEnv) {
        await supabase.from("whoop_token").upsert({
          id: ROW_ID,
          refresh_token: fromEnv,
          updated_at: new Date().toISOString(),
        });
      }
    } catch {
      // Fall through to env.
    }
  }

  return fromEnv;
}

export async function saveWhoopRefreshToken(
  newToken: string,
  previousToken: string,
) {
  const token = normalizeWhoopToken(newToken);
  if (!token || token === previousToken) return;

  process.env.WHOOP_REFRESH_TOKEN = token;
  persistRefreshTokenToEnvLocal(token);

  const supabase = getServiceClient();
  if (!supabase) return;

  try {
    await supabase.from("whoop_token").upsert({
      id: ROW_ID,
      refresh_token: token,
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.warn("[whoop] Failed to persist refresh token to Supabase.", error);
  }
}
