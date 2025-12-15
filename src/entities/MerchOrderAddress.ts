import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { MerchOrder } from './MerchOrder';
import { District } from './District';
import { Cities } from './Cities';
import { Province } from './Province';

@Entity('merch_order_address') // Change table name as needed
export class MerchOrderAddress {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    name: "uuid",
    generated: "uuid",
    default: "uuid_generate_v4()",
  })
  uuid!: string;

  @Column()
  order_uuid!: string;

  @Column({type: 'varchar', length: 255 })
  receiver_name!: string;

  @Column({type: 'varchar', length: 15 })
  phone!: string;

  @Column({ type: 'text' })
  address!: string;

  @Column({ type: 'int', nullable: true })
  province_id!: number;

  @Column({ type: 'int', nullable: true })
  city_id!: number;

  @Column({ type: 'int' })
  district_id!: number;

  @Column({ type: 'text', nullable: true })
  note?: string;

  @Column({ type: 'varchar', nullable: true })
  lat?: string;

  @Column({ type: 'varchar', nullable: true })
  long?: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at?: Date;

  @Column()
  updated_by?: string;

  @Column()
  deleted_at?: Date;

  @ManyToOne(() => MerchOrder, (order) => order.address)
  @JoinColumn({ name: 'order_uuid', referencedColumnName: 'uuid' })
  order: MerchOrder | undefined;

  @ManyToOne(() => District, (district) => district.orderAddresses)
  @JoinColumn({ name: 'district_id', referencedColumnName: 'id' })
  district: District | undefined;

  @ManyToOne(() => Cities, (city) => city.orderAddresses)
  @JoinColumn({ name: 'city_id', referencedColumnName: 'id' })
  city: Cities | undefined;

  @ManyToOne(() => Province, (province) => province.orderAddresses)
  @JoinColumn({ name: 'province_id', referencedColumnName: 'id' })
  province: Province | undefined;
}
