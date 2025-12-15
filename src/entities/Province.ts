import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryColumn,
  OneToMany,
} from 'typeorm';
import { Cities } from './Cities';
import { MerchOrderAddress } from './MerchOrderAddress';

@Entity('province') // Change table name as needed
export class Province {
  @PrimaryColumn()
  id!: number;

  @Column()
  name!: string;

  @CreateDateColumn()
  created_at!: Date;
  
  @UpdateDateColumn()
  updated_at?: Date;

  @Column()
  updated_by?: string;

  @Column()
  deleted_at?: Date;

  @OneToMany(() => Cities, (city) => city.province)
  cities: Cities[] | undefined;

  @OneToMany(() => MerchOrderAddress, (address) => address.province)
  orderAddresses: MerchOrderAddress[] | undefined;
}
