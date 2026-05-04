import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateDraftPickStatusEnumMigration1777790455312 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Modify the enum column to include new status values
    await queryRunner.query(`
      ALTER TABLE draft_picks 
      MODIFY COLUMN status ENUM('AVAILABLE', 'PICKING', 'PICKED', 'WAITLISTED', 'REQUESTED', 'APPROVED', 'REJECTED') 
      DEFAULT 'AVAILABLE';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert the enum column back to original values
    await queryRunner.query(`
      ALTER TABLE draft_picks 
      MODIFY COLUMN status ENUM('AVAILABLE', 'PICKING', 'PICKED') 
      DEFAULT 'AVAILABLE';
    `);
  }
}
