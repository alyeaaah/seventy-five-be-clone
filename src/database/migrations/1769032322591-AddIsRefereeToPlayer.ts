import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsRefereeToPlayer1769032322591 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE players 
      ADD COLUMN isReferee TINYINT(1) DEFAULT 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE players 
      DROP COLUMN isReferee
    `);
  }
}
