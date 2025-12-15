import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('player_address') // Change table name as needed
export class PlayerAddress {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    name: "uuid",
    generated: "uuid",
    default: "uuid_generate_v4()",
  })
  uuid!: string;

  @Column()
  player_uuid!: string;

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
}
