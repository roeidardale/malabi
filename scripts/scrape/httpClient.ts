// scripts/scrape/httpClient.ts
//
// Polite, guarded HTTP client for the scraper.
//
// Hard rules enforced here:
//  - Every fetch (HTML pages AND images) goes through `guardUrl`, which checks
//    the URL against the robots.txt denylist and throws if violated.
//  - Every fetch is preceded by a small randomized delay to be polite to the
//    origin server.
//  - A real, identifying User-Agent is always sent.
//  - Only the live site's own origin may be fetched (no SSRF-by-accident).

export const SITE_ORIGIN = "https://www.malabi-expres.co.il";

export const USER_AGENT =
  "Mozilla/5.0 (compatible; MalabiExpressLocalRebuildBot/1.0; local-dev)";

// Exact denylist from https://www.malabi-expres.co.il/robots.txt
const DISALLOWED_PREFIXES = [
  "/aspnet_client/",
  "/bin/",
  "/config/",
  "/data/",
  "/install/",
  "/macroScripts/",
  "/masterpages/",
  "/umbraco/",
  "/umbraco_client/",
  "/usercontrols/",
  "/xslt/",
];

const MIN_DELAY_MS = 200;
const MAX_DELAY_MS = 400;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function politeDelay(): Promise<void> {
  const ms = MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);
  return sleep(ms);
}

/**
 * Throws if `url` targets a robots.txt-disallowed path, or a different
 * origin than the live site. Returns the parsed URL on success.
 */
export function guardUrl(url: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(url, SITE_ORIGIN);
  } catch {
    throw new Error(`SCRAPER GUARD: could not parse URL: ${url}`);
  }

  if (parsed.origin !== SITE_ORIGIN) {
    throw new Error(
      `SCRAPER GUARD: refusing to fetch off-origin URL: ${parsed.href}`,
    );
  }

  const pathname = decodeURIComponent(parsed.pathname);
  for (const prefix of DISALLOWED_PREFIXES) {
    if (pathname.startsWith(prefix)) {
      throw new Error(
        `SCRAPER GUARD: URL path "${pathname}" is disallowed by robots.txt (matches "${prefix}"). Refusing to fetch ${parsed.href}`,
      );
    }
  }

  return parsed;
}

export class HttpError extends Error {
  constructor(
    public readonly url: string,
    public readonly status: number,
    public readonly statusText: string,
  ) {
    super(`HTTP ${status} ${statusText} for ${url}`);
    this.name = "HttpError";
  }
}

/** Fetch an HTML page (guarded, delayed, UA-tagged). Returns response text. */
export async function fetchHtml(url: string): Promise<string> {
  const guarded = guardUrl(url);
  await politeDelay();
  const res = await fetch(guarded.href, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "text/html,application/xhtml+xml",
    },
  });
  if (!res.ok) {
    throw new HttpError(guarded.href, res.status, res.statusText);
  }
  return res.text();
}

/** Fetch a binary resource such as an image (guarded, delayed, UA-tagged). */
export async function fetchBuffer(
  url: string,
): Promise<{ buffer: Buffer; contentType: string | null }> {
  const guarded = guardUrl(url);
  await politeDelay();
  const res = await fetch(guarded.href, {
    headers: {
      "User-Agent": USER_AGENT,
    },
  });
  if (!res.ok) {
    throw new HttpError(guarded.href, res.status, res.statusText);
  }
  const arrayBuffer = await res.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    contentType: res.headers.get("content-type"),
  };
}
