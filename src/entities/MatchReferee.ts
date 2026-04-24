import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Matches } from "./Matches";
import { Player } from "./Player";

export enum MatchRefereeStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

@Entity("match_referee")
export class MatchReferee {
  @PrimaryGeneratedColumn()
  id: number | undefined;

  @Column({ nullable: false })
  match_uuid: string = "";

  @Column({ nullable: false })
  player_uuid: string = "";

  @Column({
    type: "varchar",
    default: "ACTIVE",
  })
  status: MatchRefereeStatus = MatchRefereeStatus.ACTIVE;

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

  @ManyToOne(() => Matches, (match) => match.match_referees)
  @JoinColumn({ name: "match_uuid", referencedColumnName: "uuid" })
  match: Matches | undefined;

  @ManyToOne(() => Player, (player) => player.matchRefereeAssignments)
  @JoinColumn({ name: "player_uuid", referencedColumnName: "uuid" })
  player: Player | undefined;

}
