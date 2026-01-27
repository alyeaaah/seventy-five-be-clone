import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Player } from "./Player";
import { Titles } from "./Titles";

@Entity("player_titles")
export class PlayerTitles {
  @PrimaryGeneratedColumn()
  id: number | undefined;

  @Column()
  player_uuid: string = "";
  
  @Column({ type: "varchar", nullable: true })
  match_uuid: string | null = null;

  @Column({ type: "varchar", nullable: true })
  team_uuid: string | null = null;

  @Column()
  title_id: number = 0;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date = new Date();

  @Column({ type: "datetime", nullable: true })
  deletedAt: Date | undefined | null;

  @ManyToOne(() => Player, (player) => player.uuid)
  @JoinColumn({ name: "player_uuid", referencedColumnName: "uuid" })
  player: Player | undefined;

  @ManyToOne(() => Titles, (title) => title.id)
  @JoinColumn({ name: "title_id", referencedColumnName: "id" })
  title: Titles | undefined;
}
