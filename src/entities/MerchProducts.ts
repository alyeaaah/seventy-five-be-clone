import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { MerchProductDetail } from "./MerchProductDetail";
import { Gallery } from "./Gallery";
import { MerchCategory } from "./MerchCategory";


export enum Unit {
  PCS = "pcs",
  TUBE = "tube",
  PAIR = "pair",
  SET = "set"
}
export enum ProductStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE"
}

@Entity("merch_product")
export class MerchProduct {
  @PrimaryGeneratedColumn()
  id: number | undefined;

  @Column("uuid", {
    name: "uuid",
    generated: "uuid",
    default: () => "uuid_generate_v4()",
  })
  uuid: string = "uuid_generate_v4()";

  @Column({ type: "varchar", nullable: false })
  name: string = "";

  @Column({ type: "text", nullable: false })
  description: string = "";

  @Column({ type: "varchar", nullable: true })
  media_url: string | undefined;

  @Column({ type: "varchar", nullable: true })
  pinned_image_uuid: string | undefined;

  @Column({
    type: "enum",
    enum: Unit,
    default: Unit.PCS
  })
  unit: Unit = Unit.PCS;

  @Column({
    type: "enum",
    enum: ProductStatus,
    default: ProductStatus.ACTIVE
  })
  status: ProductStatus = ProductStatus.ACTIVE;

  @Column({ type: "timestamp", nullable: true })
  featured_at: Date | undefined | null;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date = new Date();

  @Column({ type: "varchar", nullable: true })
  createdBy: string | undefined;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date = new Date();

  @Column({ type: "varchar", nullable: true })
  updatedBy: string | undefined;

  @Column({ type: "varchar", nullable: true })
  deletedBy: string | undefined;

  @OneToMany(() => MerchProductDetail, (detail) => detail.product)
  details: MerchProductDetail[] | undefined;

  @OneToMany(() => Gallery, (gallery) => gallery.product)
  galleries: Gallery[] | undefined;

  @ManyToOne(() => Gallery, (gallery) => gallery.pinnedProductImage)
  @JoinColumn({ name: 'pinned_image_uuid', referencedColumnName: 'uuid' })
  pinnedImage: Gallery | undefined;

  @ManyToOne(() => MerchCategory, (category) => category.products, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: "category_id" })
  category: MerchCategory | null = null;
}