import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMediaUrlToTournamentEventMigration1777854680310 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE tournament_event 
      ADD COLUMN media_url VARCHAR(255) NULL AFTER name;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE tournament_event 
      DROP COLUMN media_url;
    `);
  }
}
