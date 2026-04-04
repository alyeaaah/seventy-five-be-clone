import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class DraftPickMigration1775241300516 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "draft_picks",
                columns: [
                    {
                        name: "id",
                        type: "int",
                        isGenerated: true,
                        isPrimary: true,
                        generationStrategy: "increment",
                    },
                    {
                        name: "player_uuid",
                        type: "varchar",
                        length: "255",
                    },
                    {
                        name: "drafted_by",
                        type: "varchar",
                        length: "255",
                        isNullable: true,
                    },
                    {
                        name: "position",
                        type: "int",
                    },
                    {
                        name: "status",
                        type: "enum",
                        enum: ["AVAILABLE", "PICKING", "PICKED"],
                        default: "'AVAILABLE'",
                    },
                    {
                        name: "seeded",
                        type: "boolean",
                        default: false,
                    },
                    {
                        name: "deletedBy",
                        type: "varchar",
                        length: "255",
                        isNullable: true,
                    },
                    {
                        name: "deletedAt",
                        type: "timestamp",
                        isNullable: true,
                    },
                    {
                        name: "pickingAt",
                        type: "timestamp",
                        isNullable: true,
                    },
                    {
                        name: "createdAt",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP",
                    },
                    {
                        name: "updatedBy",
                        type: "varchar",
                        length: "255",
                        isNullable: true,
                    },
                    {
                        name: "updatedAt",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP",
                        onUpdate: "CURRENT_TIMESTAMP",
                    },
                ],
            }),
            true
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("draft_picks");
    }

}
