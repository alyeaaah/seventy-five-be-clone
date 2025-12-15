import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class PlayerInMedia1754942489205 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {

    await queryRunner.createTable(
      new Table({
        name: "player_gallery",
        columns: [
          {
            name: "id",
            type: "int",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "increment",
          },
          {
            name: "gallery_uuid",
            type: "varchar",
            isNullable: false,
          },
          {
            name: "player_uuid",
            type: "varchar",
            isNullable: false,
          },
          {
            name: "x_percent",
            type: "double",
            isNullable: false,
          },
          {
            name: "y_percent",
            type: "double",
            isNullable: false,
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
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("player_gallery");
  }
}
