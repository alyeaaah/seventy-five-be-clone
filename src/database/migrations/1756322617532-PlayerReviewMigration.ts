import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class PlayerReviewMigration1756322617532 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
     await queryRunner.createTable(
      new Table({
        name: "player_review",
        columns: [
          {
            name: "id",
            type: "int",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "increment",
          },
          {
            name: "player_uuid",
            type: "varchar",
            isNullable: false,
          },
          {
            name: "sender_uuid",
            type: "varchar",
            isNullable: false,
          },
          {
            name: "rating",
            type: "double",
            isNullable: true,
          },
          {
            name: "review",
            type: "text",
            isNullable: false,
          },
          {
            name: "description",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "created_at",
            type: "timestamp",
            default: "now()",
          },
          {
            name: "updated_at",
            type: "timestamp",
            default: "now()",
          },
          {
            name: "updated_by",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "deleted_at",
            type: "timestamp",
            isNullable: true,
          },
        ],
      }),
      true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("player_review");
  }

}
