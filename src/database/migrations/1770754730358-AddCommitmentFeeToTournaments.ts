import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCommitmentFeeToTournaments1770754730358 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE tournaments 
            ADD COLUMN commitment_fee DECIMAL(10, 2) DEFAULT 0.00 
            AFTER type
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE tournaments DROP COLUMN commitment_fee`);
    }
}
