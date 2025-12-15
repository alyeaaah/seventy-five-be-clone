import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class Merchandise1744816528176 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create merch_product table
    await queryRunner.createTable(
      new Table({
        name: "merch_product",
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
          { name: "name", type: "varchar", isNullable: false },
          { name: "description", type: "varchar", isNullable: false },
          { name: "media_url", type: "varchar", isNullable: true },
          { name: "pinned_image_uuid", type: "varchar", isNullable: true },
          {
            name: "unit",
            type: "enum",
            enum: ["pcs", "tube", "pair", "set"],
            default: "'pcs'",
          },
          {
            name: "status",
            type: "enum",
            enum: ["ACTIVE", "INACTIVE"],
            default: "'ACTIVE'",
          },
          {
            name:"featured_at",
            type: "timestamp",
            isNullable: true
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

    // Create merch_product_detail table
    await queryRunner.createTable(
      new Table({
        name: "merch_product_detail",
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
          { name: "product_uuid", type: "varchar", isNullable: false },
          {
            name: "size",
            type: "enum",
            enum: ["XS", "S", "M", "L", "XL", "2XL", "Custom", "All"],
            default: "'All'",
          },
          { name: "price", type: "int", default: 0 },
          { name: "quantity", type: "int", default: 0 },
          { name: "createdAt", type: "timestamp", default: "CURRENT_TIMESTAMP" },
          { name: "createdBy", type: "varchar", isNullable: false },
          { name: "updatedAt", type: "timestamp", default: "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP" },
          { name: "updatedBy", type: "varchar", isNullable: true },
          { name: "deletedBy", type: "varchar", isNullable: true },
        ],
        foreignKeys: [
          {
            columnNames: ["product_uuid"],
            referencedTableName: "merch_product",
            referencedColumnNames: ["uuid"],
            onDelete: "CASCADE",
          },
        ],
      }),
      true
    );

    // Create merch_orders table
    await queryRunner.createTable(
      new Table({
        name: "merch_orders",
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
          { name: "player_uuid", type: "varchar", isNullable: true },
          { name: "name", type: "varchar", isNullable: false },
          { name: "email", type: "varchar", isNullable: true },
          { name: "phone", type: "varchar", isNullable: false },
          { name: "grand_total", type: "int", default: 0 },
          { name: "sub_total", type: "int", default: 0 },
          { name: "discount", type: "int", default: 0 },
          { name: "point_used", type: "int", default: 0 },
          { name: "note", type: "varchar", isNullable: true, length: "512" },
          { name: "shipping_cost", type: "int", default: 0 },
          { name: "shipping_code", type: "varchar", isNullable: true },
          { name: "payment_evidence", type: "varchar", isNullable: true },
          {
            name: "status",
            type: "enum",
            enum: ["ORDERED", "PAID", "PROCESSED", "DELIVERED", "RECEIVED", "COMPLETED", "CANCELLED"],
            default: "'ORDERED'",
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

    // Create merch_order_items table
    await queryRunner.createTable(
      new Table({
        name: "merch_order_items",
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
          { name: "order_uuid", type: "varchar", isNullable: false },
          { name: "product_detail_uuid", type: "varchar", isNullable: false },
          { name: "product_name", type: "varchar", isNullable: true },
          { name: "product_image", type: "varchar", isNullable: true },
          { name: "product_size", type: "varchar", isNullable: true },
          { name: "product_unit", type: "varchar", isNullable: true },
          { name: "quantity", type: "int", default: 1 },
          { name: "price", type: "int", isNullable: false },
          { name: "sub_total", type: "int", isNullable: false },
          { name: "createdAt", type: "timestamp", default: "CURRENT_TIMESTAMP" },
          { name: "createdBy", type: "varchar", isNullable: true },
          { name: "updatedAt", type: "timestamp", default: "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP" },
          { name: "updatedBy", type: "varchar", isNullable: true },
          { name: "deletedBy", type: "varchar", isNullable: true },
        ],
        foreignKeys: [
          {
            columnNames: ["order_uuid"],
            referencedTableName: "merch_orders",
            referencedColumnNames: ["uuid"],
            onDelete: "CASCADE",
          },
          {
            columnNames: ["product_detail_uuid"],
            referencedTableName: "merch_product_detail",
            referencedColumnNames: ["uuid"],
            onDelete: "CASCADE",
          },
        ],
      }),
      true
    );

    // Create merch_order_history table
    await queryRunner.createTable(
      new Table({
        name: "merch_order_history",
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
          { name: "order_uuid", type: "varchar", isNullable: false },
          {
            name: "status",
            type: "enum",
            enum: ["ORDERED", "PAID", "PROCESSED", "DELIVERED", "RECEIVED", "COMPLETED", "CANCELLED"],
            default: "'ORDERED'",
          },
          { name: "notes", type: "varchar", isNullable: true },
          { name: "createdAt", type: "timestamp", default: "CURRENT_TIMESTAMP" },
          { name: "createdBy", type: "varchar", isNullable: true },
          { name: "deletedBy", type: "varchar", isNullable: true },
          { name: "deletedAt", type: "timestamp", isNullable: true },
        ],
        foreignKeys: [
          {
            columnNames: ["order_uuid"],
            referencedTableName: "merch_orders",
            referencedColumnNames: ["uuid"],
            onDelete: "CASCADE",
          },
        ],
      }),
      true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("merch_order_history");
    await queryRunner.dropTable("merch_order_items");
    await queryRunner.dropTable("merch_orders");
    await queryRunner.dropTable("merch_product_detail");
    await queryRunner.dropTable("merch_product");
  }

}
