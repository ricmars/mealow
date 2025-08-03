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
  // For Vercel deployment, try multiple possible paths for built files
  const possiblePaths = [
    path.resolve(import.meta.dirname, "..", "dist", "public"),
    path.resolve(process.cwd(), "dist", "public"),
    path.resolve(".", "dist", "public")
  ];

  let distPath: string | null = null;
  let fallbackPath: string | null = null;

  // Find the correct path that exists
  for (const testPath of possiblePaths) {
    if (fs.existsSync(testPath)) {
      distPath = testPath;
      fallbackPath = path.join(testPath, "index.html");
      break;
    }
  }

  if (distPath) {
    console.log("Serving static files from:", distPath);
    app.use(express.static(distPath));
  } else {
    console.log("No static files found. Checked paths:", possiblePaths);
  }

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    if (fallbackPath && fs.existsSync(fallbackPath)) {
      res.sendFile(fallbackPath);
    } else {
      console.log("Fallback index.html not found at:", fallbackPath);
      res.status(404).send("Not found");
    }
  });
}
