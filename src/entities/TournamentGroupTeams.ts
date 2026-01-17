import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, OneToMany, OneToOne } from "typeorm";
import { TournamentGroup } from "./TournamentGroups";  // Adjust the path as needed
import { Team } from "./Team";

@Entity("tournament_group_teams")
export class TournamentGroupTeam extends BaseEntity {

  @PrimaryGeneratedColumn()
  id!: number;  // Use `!` to assert that the value will be set by the database

  @Column({ type: "varchar" })
  tournament_uuid!: string;

  @Column({ type: "varchar" })
  group_uuid!: string;

  @Column({ type: "varchar" })
  team_uuid!: string;


  @Column({ type: "int", default: 0 })
  matches_won!: number;

  @Column({ type: "int", default: 0 })
  games_won!: number;

  @Column({ type: "int", default: 0 })
  point!: number;

  @Column({ type: "int", default: 0 })
  matches_played!: number;

  @Column({ type: "varchar", nullable: true })
  createdBy!: string;

  @Column({ type: "varchar", nullable: true })
  deletedBy!: string;

  @DeleteDateColumn({ type: "timestamp", nullable: true })
  deletedAt!: Date;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP" })
  updatedAt!: Date;

  @ManyToOne(() => TournamentGroup, (group) => group.teams)
  group: TournamentGroup | undefined;  
  
  @OneToOne(() => Team, (team) => team.tournamentGroupTeam)
  team: Team | undefined;
}
