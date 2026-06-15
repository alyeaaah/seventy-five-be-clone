import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRegistrationClosedToTournamentEventMigration1781493758120 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE tournament_event 
      ADD COLUMN registration_closed TIMESTAMP NULL AFTER status;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE tournament_event 
      DROP COLUMN registration_closed;
    `);
  }
}
