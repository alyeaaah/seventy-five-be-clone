import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany
} from "typeorm";
import { TournamentSponsors } from "./TournamentSponsors";
  
  export enum SponsorsType {
    global = "global",
    tournament = "tournament",
    match = "match",
    blog = "blog"
  };

  @Entity("sponsors")
  export class Sponsors {
    @PrimaryGeneratedColumn()
    id: number | undefined;
  
    @Column("uuid", {
      name: "uuid",
      generated: "uuid",
      default: "uuid_generate_v4()",
    })
    uuid: string = "uuid_generate_v4()";
  
    @Column()
    name: string = "";

    @Column({nullable: true, type: "varchar"})
    slot: string | undefined;

    @Column()
    description: string = "";
    
    @Column()
    media_url: string = "";

    @Column({ type: "enum", nullable: false, enum: SponsorsType, default: SponsorsType.global})
    type: SponsorsType = SponsorsType.global;

  
    @Column({ type: "varchar", nullable: true })
    createdBy: string | undefined;
  
    @Column({ type: "varchar", nullable: true })
    deletedBy: string | undefined | null;
  
    @Column({ type: "datetime", nullable: true })
    deletedAt: Date | undefined | null;
  
    @CreateDateColumn({ type: "timestamp" })
    createdAt: Date = new Date();
  
    @UpdateDateColumn({ type: "timestamp" })
    updatedAt: Date = new Date();

    @OneToMany(() => TournamentSponsors, (rule) => rule.sponsor_uuid)
    tournament: TournamentSponsors[] | undefined;
  }
  