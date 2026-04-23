import { DataSource } from "typeorm";

import type { DatabaseConfigOverrides } from "./config";
import { buildDatabaseOptions } from "./config";

export const createAppDataSource = (overrides: DatabaseConfigOverrides = {}): DataSource => {
  return new DataSource(buildDatabaseOptions(overrides));
};

export const initializeAppDataSource = async (overrides: DatabaseConfigOverrides = {}): Promise<DataSource> => {
  const dataSource = createAppDataSource(overrides);
  return dataSource.initialize();
};
