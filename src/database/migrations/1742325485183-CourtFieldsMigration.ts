import { MigrationInterface, QueryRunner, Table } from "typeorm";

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


  }

  public async down(queryRunner: QueryRunner): Promise<void> {

    // Drop the table
    await queryRunner.dropTable("court_fields");
  }

}
