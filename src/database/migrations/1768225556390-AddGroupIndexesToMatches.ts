import { MigrationInterface, QueryRunner } from "typeorm";

export class AddGroupIndexesToMatches1768225556390 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE matches 
      ADD COLUMN home_group_index int NULL;
    `);
    
    await queryRunner.query(`
      ALTER TABLE matches 
      ADD COLUMN away_group_index int NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE matches 
      DROP COLUMN home_group_index;
    `);
    
    await queryRunner.query(`
      ALTER TABLE matches 
      DROP COLUMN away_group_index;
    `);
  }
}
