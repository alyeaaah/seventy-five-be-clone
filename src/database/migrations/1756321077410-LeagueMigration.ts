import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class LeagueMigration1756321077410 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    
    await queryRunner.createTable(
      new Table({
        name: "league",
        columns: [
          {
            name: "id",
            type: "int",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "increment",
          },
          {
            name: "name",
            type: "varchar",
            isNullable: false,
          },
          {
            name: "description",
            type: "varchar",
            isNullable: false,
          },
          {
            name: "color_scheme",
            type: "varchar",
            isNullable: true,
            length: "24" 
          },
          {
            name: "media_url",
            type: "varchar",
            isNullable: false,
          },
          {
            name: "status",
            type: "enum",
            enum: ["ONGOING", "ENDED", "SOON"],
            isNullable: true,
            default: `'SOON'`,
          },
          {
            name: "year",
            type: "int",
            isNullable: true,
          },
          {
            name: "updatedBy",
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
            default: "now()",
          },
          {
            name: "updatedAt",
            type: "timestamp",
            default: "now()",
          },
        ],
      }),
      true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("league");
  }
}
