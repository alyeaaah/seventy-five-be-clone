import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class GameMigration1727570876198 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "sets",
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
          },
          {
            name: "match_uuid",
            type: "varchar",
          },
          {
            name: "type",
            type: "varchar",
          },
          {
            name: "set",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "home_team_score",
            type: "int",
            default: 0,
          },
          {
            name: "away_team_score",
            type: "int",
            default: 0,
          },
          {
            name: "winner_team_uuid",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "gameHistory",
            type: "text",
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
    await queryRunner.dropTable("sets");
  }
}
