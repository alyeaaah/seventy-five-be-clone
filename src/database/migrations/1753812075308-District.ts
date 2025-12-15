import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class District1753812075308 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
          new Table({
            name: 'district',
            columns: [
              {
                name: 'id',
                type: 'int',
                isPrimary: true,
                isUnique: true,
              },
              {
                name: 'name',
                type: 'varchar',
                isNullable: false,
              },
              {
                name: 'cityId',
                type: 'int',
                isNullable: false,
              },
              {
                name: 'created_at',
                type: 'timestamp',
                default: 'CURRENT_TIMESTAMP',
              },
              {
                name: 'updated_at',
                type: 'timestamp',
                isNullable: true,
                onUpdate: 'CURRENT_TIMESTAMP',
              },
              {
                name: 'updated_by',
                type: 'varchar',
                isNullable: true,
              },
              {
                name: 'deleted_at',
                type: 'timestamp',
                isNullable: true,
              },
            ],
          }),
          true
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('district');
    }

}
