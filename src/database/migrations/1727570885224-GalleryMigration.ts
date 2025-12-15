import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class GalleryMigration1727570885224 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "galleries",
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
            length: "255",
          },
          {
            name: "album_uuid",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "player_uuid",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "product_uuid",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "blog_uuid",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "category_uuid",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "court_uuid",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "court_field_uuid",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "tournament_uuid",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "match_uuid",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "description",
            type: "text",
            isNullable: true,
          },
          {
            name: "type",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "link",
            type: "text",
            isNullable: true,
          },
          {
            name: "location",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "lat",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "long",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "featured_at",
            type: "timestamp",
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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("galleries");
  }
}
