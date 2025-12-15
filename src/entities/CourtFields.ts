import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    OneToMany
  } from "typeorm";
import { Courts } from "./Courts";
import { Matches } from "./Matches";
  
export enum CourtTyoeEnum {
  grass = "Grass",
  hardCourt = "Hard Court",
  clay = "Clay",
  flexiPave = "Flexi Pave"
};
  @Entity("court_fields")
  export class CourtFields {
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

    @Column({ type: "enum", enum: CourtTyoeEnum, nullable: true })
    type: string = CourtTyoeEnum.hardCourt;


    @Column({ type: "varchar", nullable: true })
    court_uuid: string | undefined;
    
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

    @ManyToOne(() => Courts, (court) => court.fields)
    @JoinColumn({ name: "court_uuid", referencedColumnName: "uuid" })
    court: Courts | undefined;

    @OneToMany(() => Matches, (match) => match.court_field)
    matches: Matches[] | undefined;
  }
  