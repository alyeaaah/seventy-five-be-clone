import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class TournamentEventMigration1777781762310 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "tournament_event",
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
          },
          {
            name: "rules",
            type: "text",
          },
          {
            name: "commitment_fee",
            type: "decimal",
            precision: 10,
            scale: 2,
            default: 0.00,
          },
          {
            name: "status",
            type: "enum",
            enum: ["DRAFT", "POSTPONED", "ONGOING", "ENDED", "CANCELLED"],
            default: "'DRAFT'",
          },
          {
            name: "published_at",
            type: "timestamp",
            isNullable: true,
          },
          {
            name: "created_by",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "updated_by",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "created_at",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
          },
          {
            name: "updated_at",
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
    await queryRunner.dropTable("tournament_event");
  }
}
