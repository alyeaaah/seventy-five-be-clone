import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateTournamentSponsorsTypeEnum1781542588620 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE tournamentSponsors
      MODIFY COLUMN type ENUM('OFFICIAL', 'PARTNER', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM') NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE tournamentSponsors
      MODIFY COLUMN type ENUM('OFFICIAL', 'PARTNER', 'SUPPORTING') NULL;
    `);
  }
}