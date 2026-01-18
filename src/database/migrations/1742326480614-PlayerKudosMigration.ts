import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class PlayerKudosMigration1742326480614 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
         await queryRunner.createTable(
            new Table({
                name: "player_kudos",
                columns: [
                    {
                        name: "id",
                        type: "int",
                        isGenerated: true,
                        isPrimary: true,
                        generationStrategy: "increment",
                    },
                    {
                        name: "uuid",
                        type: "varchar",
                        isUnique: true,
                    },
                    {
                        name: "kudos_uuid",
                        type: "varchar",
                    },
                    {
                        name: "kudos_text",
                        type: "varchar",
                        isNullable: true
                    },
                    {
                        name: "kudos_rating",
                        type: "double",
                    },
                    {
                        name: "match_uuid",
                        type: "varchar",
                    },
                    {
                        name: "player_uuid",
                        type: "varchar",
                    },
                    {
                        name: "by_uuid",
                        type: "varchar",
                    },
                    {
                        name: "deletedBy",
                        type: "varchar",
                        isNullable: true,
                    },
                    {
                        name: "updatedBy",
                        type: "varchar",
                        isNullable: true,
                    },
                    {
                        name: "updatedAt",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP",
                        onUpdate: "CURRENT_TIMESTAMP",
                    },
                    {
                        name: "deletedAt",
                        type: "datetime",
                        isNullable: true,
                    },
                    {
                        name: "createdAt",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP",
                    },
                ],
            }),
            true
            );

    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    

        // Drop the table
        await queryRunner.dropTable("player_kudos");
    }

}
