// dsinu.com Worker — 정적 파일(public/)은 assets가 그대로 서빙하고, /api/* 만 여기서 처리한다.
//   POST /api/hit      본문 = 서비스 id. 허브에서 서비스를 연 횟수를 1 올린다(같은 사람·같은 서비스는 하루 1회)
//   GET  /api/popular?days=7|30|365|all  기간별 서비스 횟수 (허브의 "많이 찾는 서비스")
// 개인정보: IP는 저장하지 않는다. 하루 단위 중복 제거용으로 (날짜|IP|id)의 해시만 그날까지 보관.
import { DurableObject } from "cloudflare:workers";

const kstDay = (offset = 0) => new Date(Date.now() + 9 * 3600e3 + offset * 864e5).toISOString().slice(0, 10);

export class Hits extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.sql.exec("CREATE TABLE IF NOT EXISTS daily (id TEXT NOT NULL, day TEXT NOT NULL, n INTEGER NOT NULL, PRIMARY KEY (id, day))");
    this.sql.exec("CREATE TABLE IF NOT EXISTS seen (k TEXT PRIMARY KEY, day TEXT NOT NULL)");
  }

  hit(id, key, day) {
    this.sql.exec("DELETE FROM seen WHERE day < ?", day);
    if (this.sql.exec("SELECT 1 FROM seen WHERE k = ?", key).toArray().length) return false;
    this.sql.exec("INSERT INTO seen (k, day) VALUES (?, ?)", key, day);
    this.sql.exec("INSERT INTO daily (id, day, n) VALUES (?, ?, 1) ON CONFLICT (id, day) DO UPDATE SET n = n + 1", id, day);
    return true;
  }

  popular(since) {
    return this.sql.exec("SELECT id, SUM(n) AS n FROM daily WHERE day >= ? GROUP BY id ORDER BY n DESC LIMIT 50", since || "0000").toArray();
  }
}

async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const counter = env.HITS.get(env.HITS.idFromName("hub"));

    if (url.pathname === "/api/hit" && request.method === "POST") {
      const id = (await request.text()).trim().slice(0, 64);
      if (!/^[a-z0-9-]+$/.test(id)) return new Response(null, { status: 400 });
      const apps = await env.ASSETS.fetch(new URL("/apps.json", url)).then((r) => r.json());
      if (!apps.some((a) => a.id === id && a.status === "live")) return new Response(null, { status: 404 });
      const day = kstDay();
      const key = await sha256(`${day}|${request.headers.get("cf-connecting-ip") || ""}|${id}`);
      await counter.hit(id, key, day);
      return new Response(null, { status: 204 });
    }

    if (url.pathname === "/api/popular" && request.method === "GET") {
      const d = url.searchParams.get("days");
      const days = ["7", "30", "365"].includes(d) ? Number(d) : d === "all" ? null : 30;
      const since = days ? kstDay(-(days - 1)) : null;
      const items = await counter.popular(since);
      return Response.json({ since, days, items }, { headers: { "cache-control": "public, max-age=300" } });
    }

    return new Response("Not found", { status: 404 });
  },
};
