import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
} from "typeorm";

export class AddMerchCategory1753132804267 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Buat tabel merch_category
    await queryRunner.createTable(
      new Table({
        name: "merch_category",
        columns: [
          {
            name: "id",
            type: "char",
            length: "36",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "(UUID())"
          },
          {
            name: "name",
            type: "varchar",
            isNullable: false,
          },
        ],
      }),
      true
    );

    // 2. Tambah kolom category_id ke merch_product
    // await queryRunner.addColumn(
    //   "merch_product",
    //   new TableColumn({
    //     name: "category_id",
    //     type: "char",
    //     length: "36",
    //     isNullable: true,
    //   })
    // );

    // // 3. Tambah foreign key
    // await queryRunner.createForeignKey(
    //   "merch_product",
    //   new TableForeignKey({
    //     columnNames: ["category_id"],
    //     referencedTableName: "merch_category",
    //     referencedColumnNames: ["id"],
    //     onDelete: "SET NULL",
    //   })
    // );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable("merch_product");
    const foreignKey = table?.foreignKeys.find((fk) =>
      fk.columnNames.includes("category_id")
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey("merch_product", foreignKey);
    }

    await queryRunner.dropColumn("merch_product", "category_id");
    await queryRunner.dropTable("merch_category");
  }
}

