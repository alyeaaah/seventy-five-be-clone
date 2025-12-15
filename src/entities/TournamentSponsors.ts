import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from "typeorm";
import { Tournament } from "./Tournament";
import { Sponsors } from "./Sponsors";

  @Entity("tournamentSponsors")
  export class TournamentSponsors {
    @PrimaryGeneratedColumn()
    id: number | undefined;
  
    @Column("uuid", {
      name: "uuid",
      generated: "uuid",
      default: "uuid_generate_v4()",
    })
    uuid: string = "uuid_generate_v4()";
  
    @Column()
    tournament_uuid: string = "";

    @Column()
    sponsor_uuid: string = "";
  
    @Column({ type: "varchar", nullable: true })
    createdBy: string | undefined;
  
    @Column({ type: "varchar", nullable: true })
    deletedBy: string | undefined | null;
  
    @Column({ type: "datetime", nullable: true })
    deletedAt: Date | undefined | null;
  
    @CreateDateColumn({ type: "timestamp" })
    createdAt: Date = new Date();

    @ManyToOne(() => Tournament, (tournament) => tournament.sponsors)
    @JoinColumn({ name: 'tournament_uuid', referencedColumnName: 'uuid' })
    tournament: Tournament | undefined;

    @ManyToOne(() => Sponsors, (sponsors) => sponsors.uuid)
    @JoinColumn({ name: 'sponsor_uuid', referencedColumnName: 'uuid' })
    sponsor: Sponsors | undefined;


  }
  