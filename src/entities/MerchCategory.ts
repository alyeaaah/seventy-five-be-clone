import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { MerchProduct } from "./MerchProducts";


@Entity("merch_category")
export class MerchCategory {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", nullable: false })
  name: string = "";

  @OneToMany(() => MerchProduct, (product) => product.category)
  products!: MerchProduct[];
}
