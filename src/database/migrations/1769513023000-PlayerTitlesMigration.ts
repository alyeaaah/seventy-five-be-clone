import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class PlayerTitlesMigration1769513023000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "player_titles",
        columns: [
          {
            name: "id",
            type: "int",
            isGenerated: true,
            isPrimary: true,
            generationStrategy: "increment",
          },
          {
            name: "player_uuid",
            type: "varchar",
            length: "255",
          },
          {
            name: "team_uuid",
            type: "varchar",
            isNullable: true,
            length: "255",
          },
          {
            name: "match_uuid",
            type: "varchar",
            isNullable: true,
            length: "255",
          },
          {
            name: "title_id",
            type: "int",
          },
          {
            name: "createdAt",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
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
    await queryRunner.dropTable("player_titles");
  }
}
