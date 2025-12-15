import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn
  } from "typeorm";
import { Player } from "./Player";
import { Kudos } from "./Kudos";
import { Matches } from "./Matches";
  
  @Entity("player_kudos")
  export class PlayerKudos {
    @PrimaryGeneratedColumn()
    id: number | undefined;
  
    @Column("uuid", {
      name: "uuid",
      generated: "uuid",
      default: "uuid_generate_v4()",
    })
    uuid: string | undefined = "uuid_generate_v4()";

    @Column()
    kudos_uuid: string | undefined = "";
    
    @Column({type:"varchar", nullable:true})
    kudos_text: string | undefined = "";

    @Column("double", { name: "kudos_rating" })
    kudos_rating: number | null = null;

    @Column({type:"varchar", nullable:true})
    match_uuid: string | undefined = "";
    
    @Column()
    player_uuid: string | undefined = "";
  
    @Column()
    by_uuid: string | undefined = "";

    @Column({ type: "varchar", nullable: true })
    deletedBy: string | undefined | null;
  
    @Column({ type: "datetime", nullable: true })
    deletedAt: Date | undefined | null;
  
    @CreateDateColumn({ type: "timestamp" })
    createdAt: Date = new Date();

    @UpdateDateColumn({ type: "timestamp", onUpdate: "CURRENT_TIMESTAMP" })
    updatedAt: Date = new Date();

    @Column({ type: "varchar", nullable: true })
    updatedBy: string | undefined | null;
  
    @ManyToOne(() => Player, (player) => player.uuid)
    @JoinColumn({ name: 'player_uuid', referencedColumnName: 'uuid' })
    player: Player | undefined;

    @ManyToOne(() => Player, (player) => player.uuid)
    @JoinColumn({ name: 'by_uuid', referencedColumnName: 'uuid' })
    by: Player | undefined;

    @ManyToOne(() => Kudos, (kudos) => kudos.uuid)
    @JoinColumn({ name: 'kudos_uuid', referencedColumnName: 'uuid' })
    kudos: Kudos | undefined;

    @ManyToOne(() => Matches, (matches) => matches.player_kudos)
    @JoinColumn({ name: 'match_uuid', referencedColumnName: 'uuid' })
    matches: Matches | undefined;
  }
  