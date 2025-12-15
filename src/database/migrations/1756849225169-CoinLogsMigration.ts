import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CoinLogsMigration1756849225169 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(new Table({
      name: "coin_logs",
      columns: [
        {
            name: "id",
            type: "int",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "increment"
        },
        {
            name: "uuid",
            type: "varchar",
            length: "36",
            default: "(UUID())"
        },
        {
            name: "player_uuid",
            type: "varchar",
            length: "36",
            isNullable: true
        },
        {
            name: "coin",
            type: "int",
            default: 0
        },
        {
            name: "status",
            type: "enum",
            enum: ["IN", "OUT"],
            default: "'IN'"
        },
        {
            name: "source",
            type: "enum",
            enum: ["MATCH", "ORDER", "REWARD", "KUDOS"],
            default: "'MATCH'"
        },
        {
            name: "ref_uuid",
            type: "varchar",
            length: "36",
            isNullable: true
        },
        {
            name: "before",
            type: "int",
            default: 0
        },
        {
            name: "after",
            type: "int",
            default: 0
        },
        {
            name: "createdBy",
            type: "varchar",
            isNullable: true
        },
        {
            name: "deletedBy",
            type: "varchar",
            isNullable: true
        },
        {
            name: "deletedAt",
            type: "timestamp",
            isNullable: true
        },
        {
            name: "createdAt",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP"
        },
        {
            name: "updatedAt",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        }
      ]
    }), true);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("coin_logs");
  }

}
