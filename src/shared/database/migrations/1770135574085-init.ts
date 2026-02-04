import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1770135574085 implements MigrationInterface {
    name = 'Init1770135574085'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."transactions_type_enum" AS ENUM('DEPOSIT', 'TRANSFER', 'REVERSAL')`);
        await queryRunner.query(`CREATE TYPE "public"."transactions_status_enum" AS ENUM('SUCCESS', 'REVERSED')`);
        await queryRunner.query(`CREATE TABLE "transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."transactions_type_enum" NOT NULL, "amount" numeric(14,2) NOT NULL, "status" "public"."transactions_status_enum" NOT NULL DEFAULT 'SUCCESS', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "fromWalletId" uuid, "toWalletId" uuid, CONSTRAINT "PK_a219afd8dd77ed80f5a862f1db9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_4e9fd0fae0b15072b3ba91b3dcd" FOREIGN KEY ("fromWalletId") REFERENCES "wallets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_8ae6618f9e901745e70f8828ec8" FOREIGN KEY ("toWalletId") REFERENCES "wallets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_8ae6618f9e901745e70f8828ec8"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_4e9fd0fae0b15072b3ba91b3dcd"`);
        await queryRunner.query(`DROP TABLE "transactions"`);
        await queryRunner.query(`DROP TYPE "public"."transactions_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."transactions_type_enum"`);
    }

}
