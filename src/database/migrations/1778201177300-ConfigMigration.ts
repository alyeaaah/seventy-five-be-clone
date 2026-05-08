import { MigrationInterface, QueryRunner, Table, TableColumn } from "typeorm";

export class ConfigMigration1778201177300 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "configs",
                columns: [
                    new TableColumn({
                        name: "id",
                        type: "int",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "increment",
                    }),
                    new TableColumn({
                        name: "key",
                        type: "varchar",
                        length: "255",
                        isUnique: true,
                    }),
                    new TableColumn({
                        name: "value",
                        type: "text",
                        isNullable: true,
                    }),
                    new TableColumn({
                        name: "type",
                        type: "enum('content', 'version', 'config')",
                        default: "'config'",
                    }),
                    new TableColumn({
                        name: "description",
                        type: "text",
                        isNullable: true,
                    }),
                    new TableColumn({
                        name: "createdBy",
                        type: "varchar",
                        length: "36",
                        isNullable: true,
                    }),
                    new TableColumn({
                        name: "updatedBy",
                        type: "varchar",
                        length: "36",
                        isNullable: true,
                    }),
                    new TableColumn({
                        name: "deletedBy",
                        type: "varchar",
                        length: "36",
                        isNullable: true,
                    }),
                    new TableColumn({
                        name: "createdAt",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP",
                    }),
                    new TableColumn({
                        name: "updatedAt",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP",
                        onUpdate: "CURRENT_TIMESTAMP",
                    }),
                    new TableColumn({
                        name: "deletedAt",
                        type: "timestamp",
                        isNullable: true,
                    }),
                ],
                indices: [
                    {
                        name: "IDX_CONFIG_KEY",
                        columnNames: ["key"],
                        isUnique: true,
                    },
                    {
                        name: "IDX_CONFIG_TYPE",
                        columnNames: ["type"],
                    },
                    {
                        name: "IDX_CONFIG_DELETED_AT",
                        columnNames: ["deletedAt"],
                    },
                ],
            }),
            true
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("configs");
    }
}
