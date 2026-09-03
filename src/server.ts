import { serveDir, serveFile } from "@std/http";

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://plausible.io",
  "connect-src 'self' https://plausible.io",
  "img-src 'self' data: blob:",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
].join("; ");

function secure(response: Response, requestUrl: URL): Response {
  const headers = new Headers(response.headers);
  headers.set("Content-Security-Policy", CONTENT_SECURITY_POLICY);
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (requestUrl.pathname.startsWith("/assets/")) {
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
  }
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

Deno.serve(async (request: Request) => {
  const url = new URL(request.url);
  let response = await serveDir(request, {
    fsRoot: "./dist",
    urlRoot: "",
    showDirListing: false,
    enableCors: false,
  });

  const acceptsHtml = request.headers.get("accept")?.includes("text/html") ?? false;
  const looksLikeRoute = !url.pathname.split("/").at(-1)?.includes(".");
  if (response.status === 404 && acceptsHtml && looksLikeRoute) {
    response = await serveFile(request, "./dist/index.html");
  }

  return secure(response, url);
});
