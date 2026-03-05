import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRaceToAndDraftPickToMatches1770754730354 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE matches 
      ADD COLUMN race_to INT NOT NULL DEFAULT 6 COMMENT 'Number of games/sets needed to win the match',
      ADD COLUMN draft_pick BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Draft pick order for the match (false if not applicable)'
    `);

    // Add comments to existing columns
    await queryRunner.query(`
      ALTER TABLE matches 
      MODIFY COLUMN tournament_group_index INT NULL COMMENT 'Only in group stage, and null if in knockout stage',
      MODIFY COLUMN home_group_index INT NULL COMMENT 'Index of prev group stage if in knockout stage',
      MODIFY COLUMN home_group_position INT NULL COMMENT 'Position of team in prev group stage if in knockout if in knockout',
      MODIFY COLUMN away_group_index INT NULL COMMENT 'Index of prev group stage',
      MODIFY COLUMN away_group_position INT NULL COMMENT 'Position of team in prev group stage'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE matches 
      DROP COLUMN race_to,
      DROP COLUMN draft_pick
    `);

    // Remove comments from existing columns (optional, as comments are usually kept)
    await queryRunner.query(`
      ALTER TABLE matches 
      MODIFY COLUMN tournament_group_index INT NULL,
      MODIFY COLUMN home_group_index INT NULL,
      MODIFY COLUMN home_group_position INT NULL,
      MODIFY COLUMN away_group_index INT NULL,
      MODIFY COLUMN away_group_position INT NULL
    `);
  }
}
