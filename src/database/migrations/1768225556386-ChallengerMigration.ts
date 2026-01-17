import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class ChallengerMigration1768225556386 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "challengers",
        columns: [
          {
            name: "id",
            type: "int",
            isGenerated: true,
            isPrimary: true,
            generationStrategy: "increment",
          },
          {
            name: "challengerA_uuid",
            type: "varchar",
          },
          {
            name: "challengerB_uuid",
            type: "varchar",
          },
          {
            name: "opponentA_uuid",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "opponentB_uuid",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "court_field_uuid",
            type: "varchar",
          },
          {
            name: "point_config_uuid",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "with_ad",
            type: "boolean",
            default: false,
          },
          {
            name: "time",
            type: "timestamp",
            isNullable: true,
          },
          {
            name: "notes",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "status",
            type: "enum",
            enum: ["OPEN", "ACCEPTED", "REJECTED", "COMPLETED", "CANCELLED"],
            default: "'OPEN'",
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
    await queryRunner.dropTable("challengers");
  }
}
