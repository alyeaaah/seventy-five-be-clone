import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { CourtFields } from "./CourtFields";
import { PointConfig } from "./PointConfig";
import { Player } from "./Player";

export enum ChallengerStatus {
  OPEN = "OPEN",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

@Entity("challengers")
export class Challenger {
  @PrimaryGeneratedColumn()
  id: number | undefined;

  @Column()
  challengerA_uuid: string = "";

  @Column()
  challengerB_uuid: string = "";

  @Column({ nullable: true })
  opponentA_uuid: string = "";

  @Column({ nullable: true })
  opponentB_uuid: string = "";

  @Column()
  court_field_uuid: string = "";

  @Column({ nullable: true })
  point_config_uuid: string = "";

  @Column()
  with_ad: boolean = false;

  @Column({ type: "timestamp", nullable: true })
  time: Date | undefined;

  @Column({ type: "varchar", nullable: true })
  notes: string = "";

  @Column()
  status: ChallengerStatus = ChallengerStatus.OPEN;

  @Column({ type: "varchar", nullable: true })
  createdBy: string | undefined;

  @Column({ type: "varchar", nullable: true })
  deletedBy: string | undefined | null;

  @Column({ type: "datetime", nullable: true })
  deletedAt: Date | undefined | null;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date = new Date();

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date = new Date();

  @ManyToOne(() => Player, (player) => player.uuid)
  @JoinColumn({ name: "challengerA_uuid", referencedColumnName: "uuid" })
  challengerA: Player | undefined;

  @ManyToOne(() => Player, (player) => player.uuid)
  @JoinColumn({ name: "challengerB_uuid", referencedColumnName: "uuid" })
  challengerB: Player | undefined;

  @ManyToOne(() => Player, (player) => player.uuid)
  @JoinColumn({ name: "opponentA_uuid", referencedColumnName: "uuid" })
  opponentA: Player | undefined;

  @ManyToOne(() => Player, (player) => player.uuid)
  @JoinColumn({ name: "opponentB_uuid", referencedColumnName: "uuid" })
  opponentB: Player | undefined;

  @ManyToOne(() => CourtFields, (field) => field.uuid)
  @JoinColumn({ name: "court_field_uuid", referencedColumnName: "uuid" })
  court_field: CourtFields | undefined;

  @ManyToOne(() => PointConfig, (config) => config.uuid)
  @JoinColumn({ name: "point_config_uuid", referencedColumnName: "uuid" })
  point_config: PointConfig | undefined;
}
