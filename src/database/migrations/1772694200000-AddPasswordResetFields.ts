import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPasswordResetFields1772694200000 implements MigrationInterface {
    name = 'AddPasswordResetFields1772694200000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add reset token fields to players table
        await queryRunner.query(`ALTER TABLE \`players\` ADD \`resetToken\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`players\` ADD \`resetTokenExpiry\` timestamp NULL`);
        
        // Add reset token fields to users table
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`resetToken\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`resetTokenExpiry\` timestamp NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove reset token fields from players table
        await queryRunner.query(`ALTER TABLE \`players\` DROP COLUMN \`resetToken\``);
        await queryRunner.query(`ALTER TABLE \`players\` DROP COLUMN \`resetTokenExpiry\``);
        
        // Remove reset token fields from users table
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`resetToken\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`resetTokenExpiry\``);
    }
}
