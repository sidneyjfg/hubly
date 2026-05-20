import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddServiceOfferingOnlineRequirement1713571000000 implements MigrationInterface {
  public name = "AddServiceOfferingOnlineRequirement1713571000000";

  public async up(_queryRunner: QueryRunner): Promise<void> {
    // Legacy no-op retained so migration ordering stays stable.
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Legacy no-op retained so migration ordering stays stable.
  }
}
