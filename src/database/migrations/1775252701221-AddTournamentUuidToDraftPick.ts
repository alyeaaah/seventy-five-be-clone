import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTournamentUuidToDraftPick1775252701221 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE draft_picks 
            ADD COLUMN tournament_uuid VARCHAR(255) AFTER teams_uuid
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE draft_picks 
            DROP COLUMN tournament_uuid
        `);
    }

}
