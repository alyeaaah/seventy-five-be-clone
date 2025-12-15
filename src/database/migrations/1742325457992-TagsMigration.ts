import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

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

    // Add foreign key constraint for `parent_uuid` (self-referencing)
    await queryRunner.createForeignKey(
      "tags",
      new TableForeignKey({
        columnNames: ["parent_uuid"],
        referencedColumnNames: ["uuid"],
        referencedTableName: "tags",
        onDelete: "NO ACTION",
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraint for `parent_uuid`
    const table = await queryRunner.getTable("tags");
    const foreignKey = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf("parent_uuid") !== -1
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey("tags", foreignKey);
    }

    // Drop the table
    await queryRunner.dropTable("tags");
  }

}
