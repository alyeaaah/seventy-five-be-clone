import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class PlayerPointMigration1728005395503 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "player_match_point",
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
            name: "tournament_uuid",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "match_uuid",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "player_uuid",
            type: "varchar",
          },
          {
            name: "round",
            type: "int",
          },
          {
            name: "point",
            type: "int",
            default:0
          },
          {
            name: "coin",
            type: "int",
            default:0
          },
          {
            name: "match_point_uuid",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "tournament_match_point_uuid",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "createdBy",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "deletedBy",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "deletedAt",
            type: "timestamp",
            isNullable: true,
          },
          {
            name: "createdAt",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
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
    await queryRunner.dropTable("player_match_point");
  }
}
