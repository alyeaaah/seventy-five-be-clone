import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class BlogContentMigration1744816450027 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "blog_content",
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
          { name: "title", type: "varchar", isNullable: false },
          { name: "content", type: "text", isNullable: false },
          { name: "category_uuid", type: "varchar", isNullable: true },
          { name: "match_uuid", type: "varchar", isNullable: true },
          { name: "player_uuid", type: "varchar", isNullable: true },
          { name: "tournament_uuid", type: "varchar", isNullable: true },
          {
            name: "status",
            type: "enum",
            enum: ["DRAFT", "PUBLISHED"],
            default: "'DRAFT'",
          },
          { name: "read", type: "int", default: 0 },
          {
            name: "featured_at",
            type: "timestamp",
            isNullable: true,
          },
          { name: "createdAt", type: "timestamp", default: "CURRENT_TIMESTAMP" },
          { name: "createdBy", type: "varchar", isNullable: true },
          { name: "updatedAt", type: "timestamp", default: "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP" },
          { name: "updatedBy", type: "varchar", isNullable: true },
          { name: "deletedBy", type: "varchar", isNullable: true },
        ],
      }),
      true
    );

    // Create blog_content_tags table
    await queryRunner.createTable(
      new Table({
        name: "blog_content_tags",
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
          { name: "content_uuid", type: "varchar", isNullable: false },
          { name: "tag_uuid", type: "varchar", isNullable: false },
          { name: "createdAt", type: "timestamp", default: "CURRENT_TIMESTAMP" },
          { name: "createdBy", type: "varchar", isNullable: true },
          { name: "deletedBy", type: "varchar", isNullable: true },
          { name: "deletedAt", type: "timestamp", isNullable: true },
        ],
        foreignKeys: [
          {
            columnNames: ["content_uuid"],
            referencedTableName: "blog_content",
            referencedColumnNames: ["uuid"],
            onDelete: "CASCADE",
          },
        ],
      }),
      true
    );
    // Create blog_content_tags table
    await queryRunner.createTable(
      new Table({
        name: "blog_content_tags",
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
            default: "uuid_generate_v4()",
          },
          { name: "content_uuid", type: "varchar", isNullable: false },
          { name: "tags_uuid", type: "varchar", isNullable: false },
          { name: "createdAt", type: "timestamp", default: "CURRENT_TIMESTAMP" },
          { name: "createdBy", type: "varchar", isNullable: true },
          { name: "deletedBy", type: "varchar", isNullable: true },
          { name: "deletedAt", type: "timestamp", isNullable: true },
        ],
        foreignKeys: [
          {
            columnNames: ["content_uuid"],
            referencedTableName: "blog_content",
            referencedColumnNames: ["uuid"],
            onDelete: "CASCADE",
          },
        ],
      }),
      true
    );

    // Create blog_content_reaction table
    await queryRunner.createTable(
      new Table({
        name: "blog_content_reaction",
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
          { name: "content_uuid", type: "varchar", isNullable: false },
          { name: "player_uuid", type: "varchar", isNullable: false },
          {
            name: "reaction",
            type: "enum",
            enum: ["LIKE", "DISLIKE"],
            default: "'LIKE'",
          },
          { name: "createdAt", type: "timestamp", default: "CURRENT_TIMESTAMP" },
          { name: "createdBy", type: "varchar", isNullable: true },
          { name: "deletedBy", type: "varchar", isNullable: true },
          { name: "deletedAt", type: "timestamp", isNullable: true },
        ],
        foreignKeys: [
          {
            columnNames: ["content_uuid"],
            referencedTableName: "blog_content",
            referencedColumnNames: ["uuid"],
            onDelete: "NO ACTION",
          },
        ],
      }),
      true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("blog_content_reaction");
    await queryRunner.dropTable("blog_content_tags");
    await queryRunner.dropTable("blog_content");
  }

}
