import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { buildOpenApiDocument } from "../docs/openapi";
import { buildPostmanCollection, buildPostmanEnvironment } from "../docs/postman";

const exportApiDocs = async (): Promise<void> => {
  const rootDir = path.resolve(__dirname, "..", "..");
  const openApiDir = path.join(rootDir, "openapi");
  const postmanDir = path.join(rootDir, "postman");

  await mkdir(openApiDir, { recursive: true });
  await mkdir(postmanDir, { recursive: true });

  await writeFile(
    path.join(openApiDir, "openapi.json"),
    JSON.stringify(buildOpenApiDocument(), null, 2) + "\n",
    "utf-8",
  );

  await writeFile(
    path.join(postmanDir, "clinity-local.collection.json"),
    JSON.stringify(buildPostmanCollection(), null, 2) + "\n",
    "utf-8",
  );

  await writeFile(
    path.join(postmanDir, "clinity-local.environment.json"),
    JSON.stringify(buildPostmanEnvironment(), null, 2) + "\n",
    "utf-8",
  );
};

exportApiDocs().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
