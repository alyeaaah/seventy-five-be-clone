import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddPublishedAtToTournaments1757968606041 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns(
      "tournaments",
       [
        new TableColumn({
          name: "published_at",
          type: "timestamp",
          isNullable: true,
        }),
        new TableColumn({
          name: "updatedBy",
          type: "varchar",
          isNullable: true,
        }),
        new TableColumn({
          name: "total_group",
          type: "int",
          isNullable: true,
        })
      ],
    );
    await queryRunner.addColumns(
      "matches",
      [
        new TableColumn({
          name: "tournament_group_uuid",
          type: "varchar",
          isNullable: true,
          comment: "Group UUID"
        }),
        new TableColumn({
          name: "home_group_uuid",
          type: "varchar",
          isNullable: true,
          comment: "Winner Group UUID"
        }),
        new TableColumn({
          name: "home_group_position",
          type: "int",
          isNullable: true,
          comment: "Winner Group Position"
        }),
        new TableColumn({
          name: "away_group_uuid",
          type: "varchar",
          isNullable: true,
          comment: "Winner Group UUID"
        }),
        new TableColumn({
          name: "away_group_position",
          type: "int",
          isNullable: true,
          comment: "Winner Group Position"
        }),


      ]
    );
    // change existing PUBLISHED data to DRAFT
    await queryRunner.query(
      `UPDATE tournaments SET status = 'DRAFT' WHERE status = 'PUBLISHED'`
    );
    // update column status enum, remove PUBLISHED and change to be ENDED
    await queryRunner.query(
      `ALTER TABLE tournaments MODIFY COLUMN status ENUM('DRAFT', 'POSTPONED', 'ONGOING', 'ENDED', 'CANCELLED')`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns("tournaments", ["published_at", "updatedBy", "total_group"]);
    await queryRunner.dropColumns("matches", ["tournament_group_uuid", "home_group_uuid", "home_group_position", "away_group_uuid", "away_group_position"]);
    // update column status enum, remove PUBLISHED and change to be ENDED
    await queryRunner.query(
      `ALTER TABLE tournaments MODIFY COLUMN status ENUM('DRAFT', 'POSTPONED', 'ONGOING', 'ENDED', 'CANCELLED')`
    );
  }
}
