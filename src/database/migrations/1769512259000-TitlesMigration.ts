import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class TitlesMigration1769512259000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "titles",
        columns: [
          {
            name: "id",
            type: "int",
            isGenerated: true,
            isPrimary: true,
            generationStrategy: "increment",
          },
          {
            name: "title",
            type: "varchar",
            length: "255",
          },
          {
            name: "date",
            type: "date",
          },
          {
            name: "rank",
            type: "int",
          },
          {
            name: "scale",
            type: "enum",
            enum: ["internal", "city", "nation", "province", "global"],
            default: "'internal'",
          },
          {
            name: "level",
            type: "enum", 
            enum: ["rookie", "beginner", "novice", "intermediate", "advance"],
            default: "'rookie'",
          },
          {
            name: "refId",
            type: "varchar",
            length: "255",
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
          {
            name: "deletedAt",
            type: "datetime",
            isNullable: true,
          },
        ],
      }),
      true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("titles");
  }
}
