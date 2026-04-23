import type { DataSource } from "typeorm";

import { initializeAppDataSource } from "../data-source";
import { seedDatabase } from "../seeds/seed-database";

export const createTestDataSource = async (): Promise<DataSource> => {
  const dataSource = await initializeAppDataSource({
    type: "sqljs",
    synchronize: true,
    dropSchema: true,
    logging: false,
  });

  await seedDatabase(dataSource);

  return dataSource;
};
