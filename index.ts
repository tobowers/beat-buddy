import index from "./index.html";
import docs from "./docs/index.html";

const server = Bun.serve({
  port: Number(process.env.PORT ?? 4321),
  routes: {
    "/docs": docs,
    "/*": index,
  },
  development: {
    hmr: true,
    console: true,
  },
});

console.log(`🥁 Beat Buddy running at ${server.url}`);
