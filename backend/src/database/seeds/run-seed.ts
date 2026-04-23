import "reflect-metadata";

import { initializeAppDataSource } from "../data-source";
import { seedDatabase } from "./seed-database";

const run = async (): Promise<void> => {
  const dataSource = await initializeAppDataSource({
    synchronize: false,
  });

  try {
    await seedDatabase(dataSource);
  } finally {
    await dataSource.destroy();
  }
};

run().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
