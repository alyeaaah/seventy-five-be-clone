import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Player } from "./Player";
import { Tournament } from "./Tournament";
import { TournamentEvent } from "./TournamentEvent";

export enum DraftPickStatus {
  AVAILABLE = "AVAILABLE",
  PICKING = "PICKING",
  PICKED = "PICKED",
  REQUESTED = "REQUESTED",
  WAITLISTED = "WAITLISTED",
  REJECTED = "REJECTED",
  APPROVED = "APPROVED"
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

  @ManyToOne(() => Player, (player) => player.draftPickPartner)
  @JoinColumn({ name: 'drafted_by', referencedColumnName: 'uuid' })
  partner: Player | undefined;

  @Column({ type: "varchar", length: 255, nullable: true })
  teams_uuid: string | undefined;

  @Column({ type: "varchar", length: 255, nullable: true })
  tournament_uuid: string | undefined;

  @ManyToOne(() => Tournament, (tournament) => tournament.draft_picks)
  @JoinColumn({ name: 'tournament_uuid', referencedColumnName: 'uuid' })
  tournament: Tournament | undefined;

  @Column({ type: "varchar", length: 255, nullable: true })
  tournament_event_uuid: string | undefined;

  @ManyToOne(() => TournamentEvent, (tournamentEvent) => tournamentEvent.draft_picks)
  @JoinColumn({ name: 'tournament_event_uuid', referencedColumnName: 'uuid' })
  tournament_event: TournamentEvent | undefined;

  @Column({ type: "text", nullable: true })
  attachment: string | undefined;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  commitment_fee: number | undefined;
  
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

  @Column({ type: "boolean", default: false })
  approval_email_sent: boolean = false;

  @Column({ type: "boolean", default: false })
  draftpick_email_sent: boolean = false;

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
