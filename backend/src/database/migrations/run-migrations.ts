import "reflect-metadata";

import { initializeAppDataSource } from "../data-source";

const run = async (): Promise<void> => {
  const dataSource = await initializeAppDataSource({
    synchronize: false,
  });

  try {
    await dataSource.runMigrations();
  } finally {
    await dataSource.destroy();
  }
};

run().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
