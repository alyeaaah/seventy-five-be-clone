import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddTournamentGroupFieldsToTeam1766167584300 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {

    // Add new columns to teams table
    await queryRunner.addColumn("teams", new TableColumn({
      name: "group_uuid",
      type: "varchar",
      isNullable: true,
    }));

    await queryRunner.addColumn("teams", new TableColumn({
      name: "matches_won",
      type: "int",
      isNullable: true,
      default: 0,
    }));

    await queryRunner.addColumn("teams", new TableColumn({
      name: "games_won",
      type: "int",
      isNullable: true,
      default: 0,
    }));

    await queryRunner.addColumn("teams", new TableColumn({
      name: "point",
      type: "int",
      isNullable: true,
      default: 0,
    }));

    await queryRunner.addColumn("teams", new TableColumn({
      name: "matches_played",
      type: "int",
      isNullable: true,
      default: 0,
    }));

  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove columns from teams table
    await queryRunner.dropColumn("teams", "matches_played");
    await queryRunner.dropColumn("teams", "point");
    await queryRunner.dropColumn("teams", "games_won");
    await queryRunner.dropColumn("teams", "matches_won");
    await queryRunner.dropColumn("teams", "group_uuid");
  }

}

