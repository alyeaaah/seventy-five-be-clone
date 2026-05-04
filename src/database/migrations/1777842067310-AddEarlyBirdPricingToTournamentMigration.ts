import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEarlyBirdPricingToTournamentMigration1777842067310 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE tournaments 
      ADD COLUMN early_bird_price DECIMAL(10,2) NULL AFTER commitment_fee,
      ADD COLUMN early_bird_start_date TIMESTAMP NULL AFTER early_bird_price,
      ADD COLUMN early_bird_end_date TIMESTAMP NULL AFTER early_bird_start_date,
      ADD COLUMN early_bird_limit INT NULL AFTER early_bird_end_date,
      ADD COLUMN close_registration BOOLEAN DEFAULT FALSE AFTER early_bird_limit;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE tournaments 
      DROP COLUMN early_bird_price,
      DROP COLUMN early_bird_start_date,
      DROP COLUMN early_bird_end_date,
      DROP COLUMN early_bird_limit,
      DROP COLUMN close_registration;
    `);
  }
}
