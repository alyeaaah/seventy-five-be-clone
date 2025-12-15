import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class MatchesMigration1727570842723 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "matches",
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
            name: "court_field_uuid",
            type: "varchar",
          },
          {
            name: "home_team_uuid",
            type: "varchar",
          },
          {
            name: "away_team_uuid",
            type: "varchar",
          },
          {
            name: "winner_team_uuid",
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
            name: "game_scores",
            type: "json",
            isNullable: true
          },
          {
            name: "round",
            type: "int",
            default: 0,
          },
          {
            name: "seed_index",
            type: "int",
            default: 0,
          },
          {
            name: "category",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "with_ad",
            type: "boolean",
            default: false,
          },
          {
            name: "youtube_url",
            type: "varchar",
            default: false,
          },
          {
            name: "time",
            type: "timestamp",
            isNullable: true,
          },
          {
            name: "point_config_uuid",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "notes",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "status",
            type: "varchar", // pending, in_progress, finished
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
    await queryRunner.dropTable("matches");
  }
}
