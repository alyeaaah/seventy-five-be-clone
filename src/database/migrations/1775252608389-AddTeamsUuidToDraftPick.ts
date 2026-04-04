import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTeamsUuidToDraftPick1775252608389 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE draft_picks 
            ADD COLUMN teams_uuid VARCHAR(255) AFTER player_uuid
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE draft_picks 
            DROP COLUMN teams_uuid
        `);
    }

}
