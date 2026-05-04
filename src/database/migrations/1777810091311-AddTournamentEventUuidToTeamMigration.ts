import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTournamentEventUuidToTeamMigration1777810091311 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE teams 
      ADD COLUMN tournament_event_uuid VARCHAR(255) NULL AFTER tournament_uuid;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE teams 
      DROP COLUMN tournament_event_uuid;
    `);
  }
}
