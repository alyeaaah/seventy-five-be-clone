import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany
} from "typeorm";
import { MerchProduct } from "./MerchProducts";
import { MerchOrderItem } from "./MerchOrderItem";

export enum Size {
  XS = "XS",
  S = "S",
  M = "M",
  L = "L",
  XL = "XL",
  XXL = "2XL",
  CUSTOM = "Custom",
  ALL = "All"
}

@Entity("merch_product_detail")
export class MerchProductDetail {
  @PrimaryGeneratedColumn()
  id: number | undefined;

  @Column("uuid", {
    name: "uuid",
    generated: "uuid",
    default: () => "uuid_generate_v4()",
  })
  uuid: string = "uuid_generate_v4()";

  @Column({ nullable: false })
  product_uuid: string = "";

  @Column({ 
    type: "enum",
    enum: Size,
    default: Size.ALL
  })
  size: Size = Size.ALL;

  @Column({ default: 0 })
  price: number = 0;

  @Column({ default: 0 })
  quantity: number = 0;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date = new Date();
  
  @Column({ type: "varchar", nullable: true })
  createdBy: string | undefined;

  @CreateDateColumn({ type: "timestamp" })
  updatedAt: Date = new Date();

  @Column({ type: "varchar", nullable: true })
  updatedBy: string | undefined;

  @Column({ type: "varchar", nullable: true })
  deletedBy: string | undefined;

  @ManyToOne(() => MerchProduct, (product) => product.details)
  @JoinColumn({ name: "product_uuid", referencedColumnName: "uuid" })
  product: MerchProduct | undefined;

  @OneToMany(() => MerchOrderItem, (item) => item.product_detail)
  order_items: MerchOrderItem[] | undefined;
}