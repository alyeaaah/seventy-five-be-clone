import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, OneToMany, ManyToOne, JoinColumn } from "typeorm";
import { Team } from "./Team";
import { Tournament } from "./Tournament";
import { Matches } from "./Matches";

@Entity("tournament_groups")
export class TournamentGroup extends BaseEntity {
  
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", unique: true })
  group_uuid!: string;

  @Column({ type: "varchar" })
  tournament_uuid!: string;

  @Column({ type: "varchar", nullable: true })
  group_name: string | null = null;

  @Column({ type: "varchar", nullable: true })
  winner_uuid: string | null = null;

  @Column({ type: "varchar", nullable: true })
  createdBy!: string;

  @Column({ type: "varchar", nullable: true })
  deletedBy: string | null = null;

  @DeleteDateColumn({ type: "timestamp", nullable: true })
  deletedAt: Date | null = null;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP" })
  updatedAt: Date | null = null;

  @OneToMany(() => Team, (team) => team.group)
  teams: Team[] | undefined; 

  @OneToMany(() => Matches, (match) => match.tournament_group)
  matches: Matches[] | undefined; 
  
  @ManyToOne(() => Tournament, (tournament) => tournament.groups)
  @JoinColumn({ name: 'tournament_uuid', referencedColumnName: 'uuid' })
  tournament: Tournament | undefined;
}
