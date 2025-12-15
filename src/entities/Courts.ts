import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany
  } from "typeorm";
import { CourtFields } from "./CourtFields";
import { Tournament } from "./Tournament";  
  @Entity("courts")
  export class Courts {
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

    @Column()
    address: string = "";

    @Column()
    city: string = "";
    
    @Column()
    lat: string = "";
    
    @Column()
    long: string ="";
  
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

    @OneToMany(() => CourtFields, (courtFields) => courtFields.court)
    fields: CourtFields[] | undefined;

    @OneToMany(() => Tournament, (tournament) => tournament.court)
    tournament: Tournament[] | undefined;
  }
  