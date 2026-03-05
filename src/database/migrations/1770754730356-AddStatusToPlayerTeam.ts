import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStatusToPlayerTeam1770754730356 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE player_team 
            ADD COLUMN status ENUM('REQUESTED', 'APPROVED', 'CONFIRMED', 'REJECTED') DEFAULT 'REQUESTED' 
            AFTER team_uuid
        `);
        
        // Update existing records to have 'CONFIRMED' status
        await queryRunner.query(`
            UPDATE player_team 
            SET status = 'CONFIRMED' 
            WHERE status IS NULL OR status = 'REQUESTED'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE player_team DROP COLUMN status`);
    }
}
