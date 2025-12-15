import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryColumn,
  OneToMany,
  ManyToOne,
} from 'typeorm';
import { MerchOrderAddress } from './MerchOrderAddress';
import { Cities } from './Cities';

@Entity('district') // Change table name as needed
export class District {
  @PrimaryColumn()
  id!: number;

  @Column()
  name!: string;

  @Column()
  cityId!: number;

  @CreateDateColumn()
  created_at!: Date;
  
  @UpdateDateColumn()
  updated_at?: Date;

  @Column()
  updated_by?: string;

  @Column()
  deleted_at?: Date;

  @OneToMany(() => MerchOrderAddress, (address) => address.district)
  addresses: MerchOrderAddress[] | undefined;

  @ManyToOne(() => Cities, (city) => city.districts)
  city: Cities | undefined;

  @OneToMany(() => MerchOrderAddress, (address) => address.district)
  orderAddresses: MerchOrderAddress[] | undefined;
}
