import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn
  } from "typeorm";
import { Tournament } from "./Tournament";
  
  @Entity("rules")
  export class Rule {
    @PrimaryGeneratedColumn()
    id: number | undefined;
  
    @Column("uuid", {
      name: "uuid",
      generated: "uuid",
      default: "uuid_generate_v4()",
    })
    uuid: string | undefined = "uuid_generate_v4()";
  
    @Column()
    tournament_uuid: string = "";
  
    @Column({type: "text"})
    description: string = "";
  
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

    @ManyToOne(() => Tournament, (tournament) => tournament.uuid)
    @JoinColumn({ name: 'tournament_uuid', referencedColumnName: 'uuid' })
    tournament: Tournament | undefined;
  }
  