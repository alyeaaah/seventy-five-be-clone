import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTournamentGroupIndexToMatches1768225556389 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE matches 
      ADD COLUMN tournament_group_index int NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE matches 
      DROP COLUMN tournament_group_index;
    `);
  }
}
