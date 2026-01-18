import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class EmailVerificationMigration1768682119603 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
           await queryRunner.createTable(
               new Table({
                   name: "email_verifications",
                   columns: [
                       {
                           name: "id",
                           type: "int",
                           isPrimary: true,
                           isGenerated: true,
                           generationStrategy: "increment",
                       },
                       {
                           name: "playerId",
                           type: "int",
                       },
                       {
                           name: "code",
                           type: "varchar",
                           length: "255",
                           isUnique: true,
                       },
                       {
                           name: "isUsed",
                           type: "boolean",
                           default: false,
                       },
                       {
                           name: "expiresAt",
                           type: "datetime",
                       },
                       {
                           name: "verifiedAt",
                           type: "datetime",
                           isNullable: true,
                       },
                       {
                           name: "createdAt",
                           type: "datetime",
                           default: "CURRENT_TIMESTAMP",
                       },
                   ],
               }),
               true
           );
   
           // Create foreign key constraint
           await queryRunner.query(`
               ALTER TABLE email_verifications 
               ADD CONSTRAINT FK_email_verifications_playerId 
               FOREIGN KEY (playerId) 
               REFERENCES players(id) 
               ON DELETE CASCADE
           `);
   
           // Create indexes
           await queryRunner.query(`
               CREATE INDEX IDX_email_verifications_playerId 
               ON email_verifications (playerId)
           `);
   
           await queryRunner.query(`
               CREATE INDEX IDX_email_verifications_code 
               ON email_verifications (code)
           `);
       }
   
       public async down(queryRunner: QueryRunner): Promise<void> {
           await queryRunner.dropTable("email_verifications");
       }

}
