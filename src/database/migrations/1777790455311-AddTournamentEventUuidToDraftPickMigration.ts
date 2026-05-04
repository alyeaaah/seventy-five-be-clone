import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTournamentEventUuidToDraftPickMigration1777790455311 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE draft_picks 
      ADD COLUMN tournament_event_uuid VARCHAR(255) NULL AFTER tournament_uuid;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE draft_picks 
      DROP COLUMN tournament_event_uuid;
    `);
  }
}
