import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTypeToTournamentSponsorsMigration1781493857608 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE tournamentSponsors
      ADD COLUMN type ENUM('OFFICIAL', 'PARTNER', 'SUPPORTING') NULL AFTER sponsor_uuid;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE tournamentSponsors
      DROP COLUMN type;
    `);
  }
}
