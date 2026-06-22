import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLogoToTournamentEventMigration1782117126963 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE tournament_event 
      ADD COLUMN logo VARCHAR(255) NULL AFTER media_url;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE tournament_event 
      DROP COLUMN logo;
    `);
  }
}
