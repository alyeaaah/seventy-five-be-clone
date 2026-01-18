import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsDefaultToPointConfigMigration1768225556387 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE point_config 
      ADD COLUMN isDefault boolean DEFAULT false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE point_config 
      DROP COLUMN isDefault
    `);
  }
}
