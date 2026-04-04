import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCaptainToPlayerTeam1724454400001 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE player_team 
            ADD COLUMN captain BOOLEAN DEFAULT FALSE 
            AFTER player_uuid
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE player_team 
            DROP COLUMN captain
        `);
    }

}
