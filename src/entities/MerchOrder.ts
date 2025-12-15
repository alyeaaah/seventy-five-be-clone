import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToOne } from "typeorm";
import { MerchOrderItem } from "./MerchOrderItem";
import { MerchOrderHistory } from "./MerchOrderHistory";
import { MerchOrderAddress } from "./MerchOrderAddress";
import { Player } from "./Player";

export enum OrderStatus {
  ORDERED = "ORDERED",
  PAID = "PAID",
  PROCESSED = "PROCESSED",
  DELIVERED = "DELIVERED",
  RECEIVED = "RECEIVED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED"
}

@Entity("merch_orders")
export class MerchOrder {
  @PrimaryGeneratedColumn()
  id: number | undefined;

  @Column("uuid", {
    name: "uuid",
    generated: "uuid",
    default: () => "uuid_generate_v4()",
  })
  uuid: string | undefined;

  @Column({ type: "varchar", nullable: true })
  player_uuid: string | undefined;

  @Column({ type: "varchar", nullable: false })
  name: string | undefined;

  @Column({ type: "varchar", nullable: true })
  email: string | undefined;

  @Column({ type: "varchar", nullable: false })
  phone: string | undefined;

  @Column({ type: "int", default: 0 })
  grand_total: number | undefined;

  @Column({ type: "int", default: 0 })
  sub_total: number | undefined;

  @Column({ type: "int", default: 0 })
  discount: number | undefined;

  @Column({ type: "int", default: 0 })
  point_used: number | undefined;

  @Column({ type: "varchar", nullable: true })
  payment_evidence: string | undefined;

  @Column({ type: "int", default: 0 })
  shipping_cost: number | undefined;

  @Column({ type: "varchar", nullable: true, length: "512" })
  note: string | undefined;

  @Column({ type: "varchar", nullable: true })
  shipping_code: string | undefined;

  @Column({
    type: "enum",
    enum: OrderStatus,
    default: OrderStatus.ORDERED
  })
  status: OrderStatus | undefined;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date | undefined;

  @Column({ type: "varchar", nullable: true })
  createdBy: string | undefined;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date | undefined;

  @Column({ type: "varchar", nullable: true })
  updatedBy: string | undefined;

  @Column({ type: "varchar", nullable: true })
  deletedBy: string | undefined;

  @OneToMany(() => MerchOrderItem, (item) => item.order)
  items: MerchOrderItem[] | undefined;

  @OneToMany(() => MerchOrderHistory, (history) => history.order)
  history: MerchOrderHistory[] | undefined;

  @OneToOne(() => MerchOrderAddress, (address) => address.order)
  address: MerchOrderAddress | undefined;

  @ManyToOne(() => Player, (player) => player.orders)
  @JoinColumn({ name: 'player_uuid', referencedColumnName: 'uuid' })
  player: Player | undefined;
}