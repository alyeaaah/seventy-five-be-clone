import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    JoinColumn,
  } from "typeorm";
import { MatchPoint } from "./MatchPoint";
import { Tournament } from "./Tournament";
import { Matches } from "./Matches";
  

  @Entity("point_config")
  export class PointConfig {
    @PrimaryGeneratedColumn()
    id: number | undefined;
  
    @Column("uuid", {
      name: "uuid",
      generated: "uuid",
      default: "uuid_generate_v4()",
    })
    uuid: string | undefined = "uuid_generate_v4()";  

    @Column()
    name: string = "";
  
    @Column({ type: "boolean", default: false })
    isDefault: boolean = false;
  
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

    @OneToMany(() => MatchPoint, (matchPoint) => matchPoint.point_config)
    points: MatchPoint[] | undefined;

    @OneToMany(() => Tournament, (tournament) => tournament.point_config)
    tournaments: Tournament[] | undefined;

    @OneToMany(() => Matches, (matches) => matches.point_config)
    matches: Matches[] | undefined;
  }
  