import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn, ManyToOne,
  JoinColumn
} from "typeorm";
import { Team } from "./Team";
import { Matches, MatchStatus } from "./Matches";
import { Player } from "./Player";

export enum MatchHistoryType {
  INJURY = "INJURY",
  NO_SHOW = "NO_SHOW",
  PAUSED = "PAUSED",
  RESUMED = "RESUMED",
  SUSPENDED = "SUSPENDED",
  OTHERS = "OTHERS",
}


@Entity("match_histories")
export class MatchHistories {
  @PrimaryGeneratedColumn()
  id: number | undefined;

  @Column("uuid", {
    name: "uuid",
    generated: "uuid",
    default: "uuid_generate_v4()",
  })
  uuid: string = "uuid_generate_v4()";

  @Column({nullable: true})
  match_uuid: string = "";

  @Column({nullable: true})
  team_uuid: string = "";

  @Column({nullable: true})
  player_uuid: string = "";

  @Column({nullable: true})
  notes?: string = "";

  @Column({nullable: true})
  set: number = 0;

  @Column({nullable: true})
  status?: MatchStatus;
  
  @Column({nullable: true})
  prev_status?: MatchStatus;

  @Column({nullable: true})
  type: MatchHistoryType = MatchHistoryType.OTHERS;

  @Column({ type: "varchar", nullable: true })
  createdBy: string | undefined;

  @Column({ type: "datetime", nullable: true })
  deletedAt: Date | undefined | null;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date = new Date();

  @ManyToOne(() => Matches, (matches) => matches.uuid)
  @JoinColumn({ name: "match_uuid", referencedColumnName: "uuid" })
  matches: Matches | undefined;

  @ManyToOne(() => Team, (team) => team.uuid)
  @JoinColumn({ name: 'team_uuid', referencedColumnName: 'uuid' })
  team: Team | undefined;

  @ManyToOne(() => Player, (player) => player.uuid)
  @JoinColumn({ name: 'player_uuid', referencedColumnName: 'uuid' })
  player: Player | undefined;

}
