import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTournamentEventStatusAndNewColumns1777968606042 implements MigrationInterface {
    name = 'AddTournamentEventStatusAndNewColumns1777968606042'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add PUBLISHED status to tournament_event status enum
        await queryRunner.query(`
            ALTER TABLE \`tournament_event\` 
            MODIFY COLUMN \`status\` enum('DRAFT', 'PUBLISHED', 'POSTPONED', 'ONGOING', 'ENDED', 'CANCELLED') NULL
        `);

        // Add subtitle column to tournaments table
        await queryRunner.query(`
            ALTER TABLE \`tournaments\` 
            ADD \`subtitle\` varchar(255) NULL
        `);

        // Add socialMediaReclub column to players table
        await queryRunner.query(`
            ALTER TABLE \`players\` 
            ADD \`socialMediaReclub\` varchar(255) NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove socialMediaReclub column from players table
        await queryRunner.query(`
            ALTER TABLE \`players\` 
            DROP COLUMN \`socialMediaReclub\`
        `);

        // Remove subtitle column from tournaments table
        await queryRunner.query(`
            ALTER TABLE \`tournaments\` 
            DROP COLUMN \`subtitle\`
        `);

        // Revert tournament_event status enum to original state
        await queryRunner.query(`
            ALTER TABLE \`tournament_event\` 
            MODIFY COLUMN \`status\` enum('DRAFT', 'POSTPONED', 'ONGOING', 'ENDED', 'CANCELLED') NULL
        `);
    }
}
