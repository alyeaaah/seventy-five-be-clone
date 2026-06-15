import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  JoinColumn
} from "typeorm";
import { Tournament } from "./Tournament";
import { DraftPick } from "./DraftPick";

export enum statusTournamentEventEnum {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
  POSTPONED = "POSTPONED",
  ONGOING = "ONGOING",
  ENDED = "ENDED",
  CANCELLED = "CANCELLED",
}

@Entity("tournament_event")
export class TournamentEvent {
  @PrimaryGeneratedColumn()
  id: number | undefined;

  @Column("uuid", {
    name: "uuid",
    generated: "uuid",
    default: "uuid_generate_v4()",
  })
  uuid!: string;

  @Column()
  name: string = "";

  @Column({ type: "varchar", nullable: true })
  media_url: string | undefined;

  @Column("text")
  description: string = "";

  @Column("text")
  rules: string = "";

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0.00 })
  commitment_fee: number = 0.00;

  @Column({ type: "enum", enum: statusTournamentEventEnum, nullable: true })
  status: statusTournamentEventEnum = statusTournamentEventEnum.DRAFT;

  @Column({ type: "timestamp", nullable: true })
  registration_closed: Date | null = null;

  @Column({ type: "timestamp", nullable: true })
  published_at: Date | null = null;

  @Column({ type: "varchar", nullable: true })
  created_by: string | undefined;

  @Column({ type: "varchar", nullable: true })
  updated_by: string | undefined;

  @CreateDateColumn({ type: "timestamp" })
  created_at: Date = new Date();

  @UpdateDateColumn({ type: "timestamp", nullable: true })
  updated_at: Date | undefined = new Date();

  @OneToMany(() => Tournament, (tournament) => tournament.tournament_event)
  tournaments: Tournament[] | undefined;

  @OneToMany(() => DraftPick, (draftPick) => draftPick.tournament_event)
  draft_picks: DraftPick[] | undefined;
  
}
