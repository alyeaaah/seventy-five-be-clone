import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class MatchHistoriesMigration1746266123879 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
     await queryRunner.createTable(new Table({
      name: "match_histories",
      columns: [
        {
          name: "id",
          type: "integer",
          isPrimary: true,
          isGenerated: true,
          generationStrategy: "increment"
        },
        {
          name: "uuid",
          type: "varchar",
          isUnique: true,
        },
        {
          name: "match_uuid",
          type: "varchar",
          isNullable: false
        },
        {
          name: "team_uuid",
          type: "varchar",
          isNullable: true
        },
        {
          name: "player_uuid",
          type: "varchar",
          isNullable: true
        },
        {
          name: "notes",
          type: "varchar",
          isNullable: true
        },
        {
          name: "set",
          type: "integer",
          isNullable: true
        },
        {
          name: "status",
          type: "varchar",
          isNullable: true,
        },
        {
          name: "prev_status",
          type: "varchar",
          isNullable: true,
        },
        {
          name: "type",
          type: "varchar",
          isNullable: true,
          default: "'OTHERS'"
        },
        {
          name: "createdBy",
          type: "varchar",
          isNullable: true
        },
        {
          name: "deletedAt",
          type: "timestamp",
          isNullable: true
        },
        {
          name: "createdAt",
          type: "timestamp",
          default: "CURRENT_TIMESTAMP",
        }
      ]
    }), true);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("match_histories");
  }

}
