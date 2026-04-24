import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateMatchRefereeTable1776568700000 implements MigrationInterface {
    name = 'CreateMatchRefereeTable1776568700000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`match_referee\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`match_uuid\` varchar(255) NOT NULL,
                \`player_uuid\` varchar(255) NOT NULL,
                \`status\` varchar(255) NOT NULL DEFAULT 'ACTIVE',
                \`createdBy\` varchar(255) NULL,
                \`deletedBy\` varchar(255) NULL,
                \`deletedAt\` datetime NULL,
                \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`match_referee\``);
    }
}
