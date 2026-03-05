import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddDraftPickToTournaments1770754730355 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE tournaments 
            ADD COLUMN draft_pick BOOLEAN DEFAULT FALSE 
            AFTER strict_level
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn("tournaments", "draft_pick");
    }
}
