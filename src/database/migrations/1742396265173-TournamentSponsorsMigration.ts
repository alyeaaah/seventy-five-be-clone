import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class TournamentSponsorsMigration1742396265173 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
     await queryRunner.createTable(
      new Table({
        name: "tournamentSponsors",
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
            name: "tournament_uuid",
            type: "varchar",
          },
          {
            name: "sponsor_uuid",
            type: "varchar",
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
        ],
      }),
      true
    );


    // Add foreign key constraint for `sponsor_uuid`
   
  }

  public async down(queryRunner: QueryRunner): Promise<void> {

    // Drop the table
    await queryRunner.dropTable("tournamentSponsors");
  }

}
