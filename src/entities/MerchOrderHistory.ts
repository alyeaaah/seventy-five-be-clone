import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from "typeorm";
import { MerchOrder } from "./MerchOrder";

export enum OrderStatus {
  ORDERED = "ORDERED",
  PAID = "PAID",
  PROCESSED = "PROCESSED",
  DELIVERED = "DELIVERED",
  RECEIVED = "RECEIVED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED"
}

@Entity("merch_order_history")
export class MerchOrderHistory {
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

  @Column({
    type: "enum",
    enum: OrderStatus,
    default: OrderStatus.ORDERED
  })
  status: OrderStatus | undefined;

  @Column({ type: "varchar", nullable: true })
  notes: string | undefined;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date | undefined;

  @Column({ type: "varchar", nullable: true })
  createdBy: string | undefined;

  @Column({ type: "varchar", nullable: true })
  deletedBy: string | undefined;

  @Column({ type: "timestamp", nullable: true })
  deletedAt: Date | undefined;

  @ManyToOne(() => MerchOrder, (order) => order.history)
  @JoinColumn({ name: "order_uuid", referencedColumnName: "uuid" })
  order: MerchOrder | undefined;
}