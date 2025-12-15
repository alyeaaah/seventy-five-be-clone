import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class SetLog1728009452509 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
              name: "set_logs",
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
                  name: "set_uuid",
                  type: "varchar",
                },
                {
                  name: "home_team_score",
                  type: "int",
                  default: 0,
                },
                {
                  name: "away_team_score",
                  type: "int",
                  default: 0,
                },
                {
                  name: "gameHistory",
                  type: "text",
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
      await queryRunner.dropTable("set_logs");
    }

}
