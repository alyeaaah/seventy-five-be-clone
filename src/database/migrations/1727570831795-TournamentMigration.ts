import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class TournamentMigration1727570831795 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "tournaments",
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
            name: "name",
            type: "varchar",
          },
          {
            name: "description",
            type: "text",
            isNullable: true
          },
          {
            name: "media_url",
            type: "text",
            isNullable: true
          },
          {
            name: "level_uuid",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "league_id",
            type: "int",
            isNullable: true,
          },
          {
            name: "strict_level",
            type: "boolean",
            isNullable: true,
          },
          {
            name: "point_config_uuid",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "court_uuid",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "status",
            type: "enum",
            enum: ["DRAFT", "PUBLISHED", "POSTPONED", "ONGOING", "ENDED", "CANCELLED"],
            default: "'DRAFT'",
          },
          {
            name: "type",
            type: "enum",
            enum: ["KNOCKOUT", "ROUND ROBIN", "FRIENDLY MATCH"],
            default: "'KNOCKOUT'",
          },
          {
            name: "start_date",
            type: "timestamp",
            isNullable: true,
          },
          {
            name: "end_date",
            type: "timestamp",
            isNullable: true,
          },
          {
            name: "featured_at",
            type: "timestamp",
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
    await queryRunner.dropTable("tournaments");
  }
}
