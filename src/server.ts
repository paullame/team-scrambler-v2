import { serveDir, serveFile } from "@std/http";

Deno.serve(async (req: Request) => {
  const res = await serveDir(req, {
    fsRoot: "./dist",
    urlRoot: "",
    showDirListing: true,
    enableCors: true,
  });

  if (res.status === 404) {
    return await serveFile(req, "./dist/index.html");
  }

  return res;
});
