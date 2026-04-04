import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddGroupQualifierToTournaments1773429032785 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE tournaments 
            ADD COLUMN group_qualifier INT NOT NULL DEFAULT 1 
            AFTER total_group
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn("tournaments", "group_qualifier");
    }
}
