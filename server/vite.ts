import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { type Server } from "http";

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  // Dynamically import all Vite dependencies only when needed (development mode)
  const [{ createServer: createViteServer, createLogger }, { nanoid }] = await Promise.all([
    import("vite"),
    import("nanoid")
  ]);
  
  const viteLogger = createLogger();
  
  // Only import vite config when actually needed (development mode)
  let viteConfig;
  try {
    const config = await import("../vite.config.js");
    viteConfig = config.default;
  } catch (error) {
    // In production, vite.config.js might not be available, but that's OK
    // since setupVite is only called in development mode
    console.warn("Could not load vite.config.js, using default config");
    viteConfig = {};
  }
  
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // In Vercel, we need to serve the built files from the deployment
  // The built files should be co-located with the server function
  const distPath = path.join(process.cwd(), "dist", "public");
  const indexPath = path.join(distPath, "index.html");

  console.log("Looking for static files at:", distPath);
  console.log("Working directory:", process.cwd());
  console.log("Files in cwd:", fs.readdirSync(process.cwd()));

  // Check if dist directory exists
  if (fs.existsSync(path.join(process.cwd(), "dist"))) {
    console.log("Files in dist:", fs.readdirSync(path.join(process.cwd(), "dist")));
  }

  if (fs.existsSync(distPath)) {
    console.log("Serving static files from:", distPath);
    app.use(express.static(distPath));
  } else {
    console.log("Static files directory not found at:", distPath);
  }

  // Serve index.html for all non-API routes (SPA fallback)
  app.get("*", (_req, res) => {
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      console.log("Index.html not found at:", indexPath);
      // If we can't find the built files, serve a basic HTML response
      res.send(`
        <!DOCTYPE html>
        <html>
          <head><title>MealMind</title></head>
          <body>
            <div id="root">Loading...</div>
            <script>
              console.error('Static files not found. Build may have failed.');
            </script>
          </body>
        </html>
      `);
    }
  });
}
