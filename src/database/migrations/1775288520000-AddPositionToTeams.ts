import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPositionToTeams1724454400000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE teams 
            ADD COLUMN position INT DEFAULT 0 
            AFTER alias
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE teams 
            DROP COLUMN position
        `);
    }

}
