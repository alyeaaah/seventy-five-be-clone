import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTournamentEventUuidToTournamentMigration1777790455310 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE tournaments 
      ADD COLUMN tournament_event_uuid VARCHAR(255) NULL AFTER uuid;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE tournaments 
      DROP COLUMN tournament_event_uuid;
    `);
  }
}
