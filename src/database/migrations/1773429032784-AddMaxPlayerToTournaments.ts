import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMaxPlayerToTournaments1773429032784 implements MigrationInterface {
    name = 'AddMaxPlayerToTournaments1773429032784'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`tournaments\` ADD \`max_player\` int NULL DEFAULT 0 AFTER \`total_group\``);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "tournaments" 
            DROP COLUMN "max_player"
        `);
    }
}
