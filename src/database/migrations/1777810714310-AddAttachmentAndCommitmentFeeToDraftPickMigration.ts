import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAttachmentAndCommitmentFeeToDraftPickMigration1777810714310 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE draft_picks 
      ADD COLUMN attachment TEXT NULL AFTER seeded,
      ADD COLUMN commitment_fee DECIMAL(10,2) NULL AFTER attachment;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE draft_picks 
      DROP COLUMN attachment,
      DROP COLUMN commitment_fee;
    `);
  }
}
