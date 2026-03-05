import { MigrationInterface, QueryRunner } from "typeorm";

export class AddShowBracketToTournaments1770754730357 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE tournaments 
            ADD COLUMN show_bracket BOOLEAN DEFAULT FALSE 
            AFTER status
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE tournaments DROP COLUMN show_bracket`);
    }
}
