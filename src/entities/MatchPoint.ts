import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { PointConfig } from "./PointConfig";


@Entity("match_points")
export class MatchPoint {
  @PrimaryGeneratedColumn()
  id: number | undefined;

  @Column("uuid", {
    name: "uuid",
    generated: "uuid",
    default: "uuid_generate_v4()",
  })
  uuid: string = "uuid_generate_v4()";

  @Column()
  round: number = 0;

  @Column()
  win_point: number = 0;

  @Column()
  lose_point: number = 0;

  @Column()
  win_coin: number = 0;

  @Column()
  lose_coin: number = 0;

  @Column({ type: "varchar", nullable: true })
  point_config_uuid: string = "";

  @Column({ type: "varchar", nullable: true })
  createdBy: string | undefined;

  @Column({ type: "varchar", nullable: true })
  deletedBy: string | undefined;

  @Column({ type: "timestamp" })
  deletedAt: Date | null = null;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date = new Date();

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date = new Date();

  @ManyToOne(() => PointConfig, (pointConfig) => pointConfig.uuid)
  @JoinColumn({ name: 'point_config_uuid', referencedColumnName: 'uuid' })
  point_config: PointConfig | undefined;
}
