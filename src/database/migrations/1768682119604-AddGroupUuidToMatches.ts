import { MigrationInterface, QueryRunner } from "typeorm";

export class AddGroupUuidToMatches1768682119604 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE matches
      ADD COLUMN group_uuid VARCHAR(36) NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE matches 
      DROP COLUMN group_uuid
    `);
  }
}
