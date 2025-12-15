import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class PlayerMigration1742325939608 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "players",
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
            name: "name",
            type: "varchar",
          },
          {
            name: "nickname",
            type: "varchar",
          },
          {
            name: "username",
            type: "varchar",
          },
          {
            name: "email",
            type: "varchar",
          },
          {
            name: "phoneNumber",
            type: "varchar",
          },
          {
            name: "password",
            type: "varchar",
          },
          {
            name: "address",
            type: "text",
            isNullable: true,
          },
          {
            name: "city",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "media_url",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "avatar_url",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "isVerified",
            type: "boolean",
            default: false,
          },
          {
            name: "featured",
            type: "boolean",
            default: false,
          },
          {
            name: "skills",
            type: "text",
          },
          {
            name: "socialMediaIg",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "socialMediaX",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "playstyleForehand",
            type: "enum",
            enum: ["LEFT", "RIGHT"],
            default: "'RIGHT'",
            isNullable: true,
          },
          {
            name: "playstyleBackhand",
            type: "enum",
            enum: ["One Handed", "Double Handed"],
            isNullable: true,
            default: "'Double Handed'",
          },
          {
            name: "turnDate",
            type: "date",
            isNullable: true,
          },
          {
            name: "dateOfBirth",
            type: "date",
            isNullable: true,
          },
          {
            name: "placeOfBirth",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "height",
            type: "integer",
            isNullable: true,
          },
          {
            name: "point",
            type: "integer",
            isNullable: false,
            default:0
          },
          {
            name: "coin",
            type: "integer",
            isNullable: false,
            default:0
          },
          {
            name: "role",
            type: "enum",
            enum: ["PLAYER", "ADMIN", "MARQUEEPLAYER"],
            default: "PLAYER",
          },
          {
            name: "point_updated_at",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
          },
          {
            name: "pinned_at",
            type: "timestamp",
            isNullable: true,
          },
          {
            name: "gender",
            type: "enum",
            enum: ["m", "f"],
            isNullable: true,
          },
          {
            name: "level_uuid",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "league_id",
            type: "int",
            isNullable: true,
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

    // Add foreign key constraint for `level_uuid`
    await queryRunner.createForeignKey(
      "players",
      new TableForeignKey({
        columnNames: ["level_uuid"],
        referencedColumnNames: ["uuid"],
        referencedTableName: "levels",
        onDelete: "SET NULL",
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraint for `level_uuid`
    const table = await queryRunner.getTable("players");
    const foreignKey = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf("level_uuid") !== -1
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey("players", foreignKey);
    }

    // Drop the table
    await queryRunner.dropTable("players");
  }
}