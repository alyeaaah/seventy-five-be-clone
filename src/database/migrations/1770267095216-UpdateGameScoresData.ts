import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateGameScoresData1770267095216 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // First update: Replace "set": with "game":
    await queryRunner.query(`
      UPDATE \`matches\` 
      SET \`game_scores\` = REPLACE(\`game_scores\`, '"set":', '"game":')
      WHERE \`game_scores\` LIKE '%\"set\":%'
    `);

    // Second update: Add status and set fields before game field
    await queryRunner.query(`
      UPDATE matches
      SET game_scores = REPLACE(
        game_scores,
        '"game":',
        '"status": "ENDED", "set": 1, "game":'
      )
      WHERE game_scores LIKE '%\"game\":%'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Data migration - no rollback needed
  }
}
