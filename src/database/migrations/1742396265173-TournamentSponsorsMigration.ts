import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

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

    // Add foreign key constraint for `tournament_uuid`
    await queryRunner.createForeignKey(
      "tournamentSponsors",
      new TableForeignKey({
        columnNames: ["tournament_uuid"],
        referencedColumnNames: ["uuid"],
        referencedTableName: "tournaments",
        onDelete: "NO ACTION",
      })
    );

    // Add foreign key constraint for `sponsor_uuid`
    await queryRunner.createForeignKey(
      "tournamentSponsors",
      new TableForeignKey({
        columnNames: ["sponsor_uuid"],
        referencedColumnNames: ["uuid"],
        referencedTableName: "sponsors",
        onDelete: "NO ACTION",
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
      // Drop foreign key constraints
    const table = await queryRunner.getTable("tournamentSponsors");
    const tournamentForeignKey = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf("tournament_uuid") !== -1
    );
    const sponsorForeignKey = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf("sponsor_uuid") !== -1
    );

    if (tournamentForeignKey) {
      await queryRunner.dropForeignKey("tournamentSponsors", tournamentForeignKey);
    }
    if (sponsorForeignKey) {
      await queryRunner.dropForeignKey("tournamentSponsors", sponsorForeignKey);
    }

    // Drop the table
    await queryRunner.dropTable("tournamentSponsors");
  }

}
