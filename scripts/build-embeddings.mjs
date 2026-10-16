import { buildEmbeddings } from "../src/app/api/chat/lib/embeddings.ts";
import { EMBED_MODEL, EMBED_DIMENSION } from "../src/app/api/chat/lib/cohere.ts";
import { config } from "dotenv";
config();

async function main() {
  const key = process.env.COHERE_API_KEY;
  if (!key) {
    console.error("Error: COHERE_API_KEY not found in environment or .env file");
    process.exit(1);
  }

  console.log("Building embeddings for knowledgebase...");
  console.log(`Using ${EMBED_MODEL} at ${EMBED_DIMENSION} dimensions`);
  console.log("This will chunk all .md files and generate embeddings.\n");

  try {
    const start = Date.now();
    await buildEmbeddings();
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`\n✓ Embeddings built successfully in ${elapsed}s`);
  } catch (err) {
    console.error("Build failed:", err);
    process.exit(1);
  }
}

main();
