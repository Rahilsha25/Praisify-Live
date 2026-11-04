import { createApp } from "./app.js";
import { loadConfig } from "./config.js";
import { createDatabase } from "./db.js";

const config = loadConfig();
const db = await createDatabase(config);
const app = createApp({ db, config });
const server = app.listen(config.port, () => {
  console.log(`Praisify API listening on port ${config.port}`);
});

async function shutdown() {
  server.close(async () => {
    await db.close();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
