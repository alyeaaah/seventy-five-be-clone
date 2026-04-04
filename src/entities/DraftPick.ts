import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Player } from "./Player";

export enum DraftPickStatus {
  AVAILABLE = "AVAILABLE",
  PICKING = "PICKING",
  PICKED = "PICKED"
}

@Entity("draft_picks")
export class DraftPick {
  @PrimaryGeneratedColumn()
  id: number | undefined;

  @Column({ type: "varchar", length: 255 })
  player_uuid: string = "";

  @ManyToOne(() => Player, (player) => player.draftPicks)
  @JoinColumn({ name: 'player_uuid', referencedColumnName: 'uuid' })
  player: Player | undefined;

  @Column({ type: "varchar", length: 255, nullable: true })
  teams_uuid: string | undefined;

  @Column({ type: "varchar", length: 255, nullable: true })
  tournament_uuid: string | undefined;
  
  @Column({ type: "varchar", length: 255 })
  drafted_by: string = "";

  @Column({ type: "int" })
  position: number = 0;

  @Column({ 
    type: "enum", 
    enum: DraftPickStatus, 
    default: DraftPickStatus.AVAILABLE 
  })
  status: DraftPickStatus = DraftPickStatus.AVAILABLE;

  @Column({ type: "boolean", default: false })
  seeded: boolean = false;

  @Column({ type: "varchar", length: 255, nullable: true })
  deletedBy: string | undefined;

  @Column({ type: "varchar", length: 255, nullable: true })
  updatedBy: string | undefined;

  @Column({ type: "timestamp", nullable: true })
  deletedAt: Date | null = null;

  @Column({ type: "timestamp", nullable: true })
  pickingAt: Date | null = null;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date = new Date();

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date = new Date();
}
