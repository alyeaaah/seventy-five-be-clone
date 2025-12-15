import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CourtFieldsMigration1742325485183 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "court_fields",
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
            enum: ["Grass", "Hard Court", "Clay", "Flexi Pave"],
            isNullable: true,
          },
          {
            name: "court_uuid",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "lat",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "long",
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

    // Add foreign key constraint for `court_uuid`
    await queryRunner.createForeignKey(
      "court_fields",
      new TableForeignKey({
        columnNames: ["court_uuid"],
        referencedColumnNames: ["uuid"],
        referencedTableName: "courts",
        onDelete: "SET NULL",
      })
    );

  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraint for `court_uuid`
    const table = await queryRunner.getTable("court_fields");
    const foreignKey = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf("court_uuid") !== -1
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey("court_fields", foreignKey);
    }

    // Drop the table
    await queryRunner.dropTable("court_fields");
  }

}
