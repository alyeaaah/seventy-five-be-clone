import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTournamentEventUuidToPlayerTeamMigration1777810091310 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE player_team 
      ADD COLUMN tournament_event_uuid VARCHAR(255) NULL AFTER tournament_uuid;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE player_team 
      DROP COLUMN tournament_event_uuid;
    `);
  }
}
