import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class GalleryTagsMigration1742938532841 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "gallery_tags", // Note: Entity name is GalleryTags but table is galleries
        columns: [
          {
            name: "id",
            type: "int",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "increment",
          },
          {
            name: "uuid",
            type: "varchar",
            isUnique: true,
          },
          {
            name: "gallery_uuid",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "gallery_album_uuid",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "tag_uuid",
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

  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("galleries");
  }
}
