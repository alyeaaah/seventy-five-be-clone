import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { Tournament } from "./Tournament";
import { PlayerLog } from "./PlayerLog";
import { Player } from "./Player";

export enum statusLeagueEnum {
  ONGOING = "ONGOING",
  ENDED = "ENDED",
  SOON = "SOON",
}

@Entity("league")
export class League {
  @PrimaryGeneratedColumn()
  id: number | undefined;

  @Column()
  name: string = "";

  @Column()
  description: string = "";

  @Column({type:"varchar", nullable:true, length:24})
  color_scheme: string = "";

  @Column()
  media_url: string = "";

  @Column({ type: "enum", enum: statusLeagueEnum, nullable: true })  
  status: statusLeagueEnum = statusLeagueEnum.SOON;

  @Column({ type: "int", nullable: true })
  year: number | undefined;

  @Column({ type: "varchar", nullable: true })
  updatedBy: string | undefined;

  @Column({ type: "varchar", nullable: true })
  deletedBy: string | undefined;

  @Column({ type: "datetime", nullable: true })
  deletedAt: Date | undefined;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date = new Date();

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date = new Date();

  @OneToMany(() => Tournament, (tournament) => tournament.league)
  tournaments: Tournament[] | undefined;

  @OneToMany(() => Player, (player) => player.league)
  players: Player[] | undefined;

  @OneToMany(() => PlayerLog, (playerLog) => playerLog.league)
  playerLogs: PlayerLog[] | undefined;

}
