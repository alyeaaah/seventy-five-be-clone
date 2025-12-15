import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
  } from "typeorm";
import { Gallery } from "./Gallery";
import { User } from "./User";
import { Player } from "./Player";
  
  @Entity("player_gallery")
  export class PlayerGallery {
    @PrimaryGeneratedColumn()
    id: number | undefined;
  
    @Column()
    gallery_uuid: string = "";

    @Column()
    player_uuid: string = "";

    @Column("double", { name: "x_percent" })
    x_percent: number = 0;

    @Column("double", { name: "y_percent" })
    y_percent: number = 0;
  
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

    @ManyToOne(() => Gallery, (gallery) => gallery.uuid)
    @JoinColumn({ name: 'gallery_uuid', referencedColumnName: 'uuid' })
    gallery: Gallery | undefined;

    @ManyToOne(() => Player, (player) => player.uuid)
    @JoinColumn({ name: 'player_uuid', referencedColumnName: 'uuid' })
    player: Player | undefined;

    @ManyToOne(() => User, (user) => user.blogPosts)
    @JoinColumn({ name: 'createdBy', referencedColumnName: 'uuid' })
    author: User | undefined;
  }
  