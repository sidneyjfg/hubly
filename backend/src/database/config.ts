import type { DataSourceOptions } from "typeorm";

import { env } from "../utils/env";
import { CreateInitialSchema1713560000000 } from "./migrations/1713560000000-create-initial-schema";
import { CreateClinicIntegrations1713561000000 } from "./migrations/1713561000000-create-clinic-integrations";
import { CreateNotificationReminders1713562000000 } from "./migrations/1713562000000-create-notification-reminders";
import { AddUserPhoneColumn1713563000000 } from "./migrations/1713563000000-add-user-phone-column";
import { AddIntegrationPhoneNumber1713564000000 } from "./migrations/1713564000000-add-integration-phone-number";
import { AddPatientStatusAndProfessionalServices1713565000000 } from "./migrations/1713565000000-add-patient-status-and-professional-services";
import { databaseEntities } from "./entities";

export type DatabaseDriver = "mysql" | "sqljs";

export type DatabaseConfigOverrides = {
  type?: DatabaseDriver;
  synchronize?: boolean;
  dropSchema?: boolean;
  logging?: boolean;
  database?: string;
};

export const buildDatabaseOptions = (overrides: DatabaseConfigOverrides = {}): DataSourceOptions => {
  const type = overrides.type ?? env.DB_TYPE;

  if (type === "sqljs") {
    return {
      type: "sqljs",
      autoSave: false,
      synchronize: overrides.synchronize ?? true,
      dropSchema: overrides.dropSchema ?? false,
      logging: overrides.logging ?? false,
      entities: [...databaseEntities],
      migrations: [
        CreateInitialSchema1713560000000,
        CreateClinicIntegrations1713561000000,
        CreateNotificationReminders1713562000000,
        AddUserPhoneColumn1713563000000,
        AddIntegrationPhoneNumber1713564000000,
        AddPatientStatusAndProfessionalServices1713565000000,
      ],
    };
  }

  return {
    type: "mysql",
    host: env.DB_HOST,
    port: env.DB_PORT,
    username: env.DB_USERNAME,
    password: env.DB_PASSWORD,
    database: overrides.database ?? env.DB_NAME,
    synchronize: overrides.synchronize ?? false,
    dropSchema: overrides.dropSchema ?? false,
    logging: overrides.logging ?? env.DB_LOGGING,
    entities: [...databaseEntities],
    migrations: [
      CreateInitialSchema1713560000000,
      CreateClinicIntegrations1713561000000,
      CreateNotificationReminders1713562000000,
      AddUserPhoneColumn1713563000000,
      AddIntegrationPhoneNumber1713564000000,
      AddPatientStatusAndProfessionalServices1713565000000,
    ],
  };
};
