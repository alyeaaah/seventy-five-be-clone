import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { MerchOrder } from "./MerchOrder";
import { MerchProductDetail } from "./MerchProductDetail";

@Entity("merch_order_items")
export class MerchOrderItem {
  @PrimaryGeneratedColumn()
  id: number | undefined;

  @Column("uuid", {
    name: "uuid",
    generated: "uuid",
    default: () => "uuid_generate_v4()",
  })
  uuid: string | undefined;

  @Column({ type: "varchar", nullable: false })
  order_uuid: string | undefined;

  @Column({ type: "varchar", nullable: false })
  product_detail_uuid: string | undefined;

  @Column({ type: "varchar", nullable: true })
  product_name: string | undefined;

  @Column({ type: "varchar", nullable: true })
  product_image: string | undefined;

  @Column({ type: "varchar", nullable: true })
  product_size: string | undefined;

  @Column({ type: "varchar", nullable: true })
  product_unit: string | undefined;

  @Column({ type: "int", default: 1 })
  quantity: number | undefined;

  @Column({ type: "decimal", nullable: false })
  price: number | undefined;

  @Column({ type: "decimal", nullable: false })
  sub_total: number | undefined;

  @Column({ type: "varchar", nullable: true })
  createdBy: string | undefined;

  @Column({ type: "varchar", nullable: true })
  updatedBy: string | undefined;

  @Column({ type: "varchar", nullable: true })
  deletedBy: string | undefined;

  @Column({ type: "timestamp", nullable: true })
  updatedAt: Date | undefined;

  @Column({ type: "timestamp", nullable: true })
  createdAt: Date | undefined;

  @ManyToOne(() => MerchOrder, (order) => order.items)
  @JoinColumn({ name: "order_uuid", referencedColumnName: "uuid" })
  order: MerchOrder | undefined;

  @ManyToOne(() => MerchProductDetail, (detail) => detail.order_items)
  @JoinColumn({ name: "product_detail_uuid", referencedColumnName: "uuid" })
  product_detail: MerchProductDetail | undefined;
}