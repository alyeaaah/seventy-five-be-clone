import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class TournamentGroupTeams1757354250407 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "tournament_group_teams",
        columns: [
          {
            name: "id",
            type: "int",
            isGenerated: true,
            isPrimary: true,
            generationStrategy: "increment",
          },
          {
            name: "group_uuid",
            type: "varchar", // The group this team belongs to
          },
          {
            name: "team_uuid",
            type: "varchar", // The team from the `teams` table
          },
          {
            name: "matches_won",
            type: "int",
            default: 0, // Default matches won to 0
          },
          {
            name: "games_won",
            type: "int",
            default: 0, // Default games won to 0
          },
          {
            name: "point",
            type: "int",
            default: 0, // Default games played to 0
          },
          {
            name: "matches_played",
            type: "int",
            default: 0, // Default matches played to 0
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
            type: "timestamp",
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
    await queryRunner.dropTable("tournament_group_teams");
  }

}
