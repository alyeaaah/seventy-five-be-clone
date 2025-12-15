import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn
  } from "typeorm";
import { Tournament } from "./Tournament";
import { Player } from "./Player";
import { Team } from "./Team";
  
  @Entity("player_team")
  export class PlayerTeam {
    @PrimaryGeneratedColumn()
    id: number | undefined;
  
    @Column("uuid", {
      name: "uuid",
      generated: "uuid",
      default: "uuid_generate_v4()",
    })
    uuid: string | undefined = "uuid_generate_v4()";
    
    @Column()
    player_uuid: string | undefined = "";
  
    @Column()
    team_uuid: string | undefined = "";

    @Column()
    tournament_uuid: string | undefined = "";

    @Column({ type: "varchar", nullable: true })
    createdBy: string | undefined;

    @Column({ type: "varchar", nullable: true })
    deletedBy: string | undefined;

    @Column({ type: "timestamp", nullable: true })
    deletedAt: Date | null = null;

    @CreateDateColumn({ type: "timestamp" })
    createdAt: Date = new Date();

    @ManyToOne(() => Player, (player) => player.uuid)
    @JoinColumn({ name: 'player_uuid', referencedColumnName: 'uuid' })
    player: Player | undefined;

    @ManyToOne(() => Team, (team) => team.uuid)
    @JoinColumn({ name: 'team_uuid', referencedColumnName: 'uuid' })
    team: Team | undefined;

    @ManyToOne(() => Tournament, (t) => t.playerTeams)
    @JoinColumn({ name: 'tournament_uuid', referencedColumnName: 'uuid' })
    tournament: Tournament | undefined;
  }
  