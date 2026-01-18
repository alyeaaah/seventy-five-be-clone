import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class TagsMigration1742325457992 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
     await queryRunner.createTable(
      new Table({
        name: "tags",
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
            name: "type",
            type: "enum",
            enum: ["blog", "gallery", "match"],
            default: "'blog'",
          },
          {
            name: "parent_uuid",
            type: "varchar",
            length: "48",
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
            type: "datetime",
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
    // Drop foreign key constraint for `parent_uuid`

    // Drop the table
    await queryRunner.dropTable("tags");
  }

}
