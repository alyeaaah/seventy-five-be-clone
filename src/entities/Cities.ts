import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryColumn,
  OneToMany,
  ManyToOne,
} from 'typeorm';
import { District } from './District';
import { Province } from './Province';
import { MerchOrderAddress } from './MerchOrderAddress';

@Entity('cities') // Change table name as needed
export class Cities {
  @PrimaryColumn()
  id!: number;

  @Column()
  name!: string;

  @Column()
  provinceId!: number;

  @CreateDateColumn()
  created_at!: Date;
  
  @UpdateDateColumn()
  updated_at?: Date;

  @Column()
  updated_by?: string;

  @Column()
  deleted_at?: Date;

  @OneToMany(() => District, (district) => district.city)
  districts: District[] | undefined;

  @ManyToOne(() => Province, (province) => province.cities)
  province: Province | undefined;

  @OneToMany(() => MerchOrderAddress, (address) => address.city)
  orderAddresses: MerchOrderAddress[] | undefined;
}
