import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEmailTrackingToDraftPickMigration1778348289641 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE draft_picks 
      ADD COLUMN draftpick_email_sent BOOLEAN DEFAULT FALSE AFTER seeded,
      ADD COLUMN approval_email_sent BOOLEAN DEFAULT FALSE AFTER draftpick_email_sent;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE draft_picks 
      DROP COLUMN approval_email_sent,
      DROP COLUMN draftpick_email_sent;
    `);
  }
}
