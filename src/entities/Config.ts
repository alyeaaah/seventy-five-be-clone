import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index } from "typeorm";

export enum ConfigType {
    CONTENT = "content",
    VERSION = "version", 
    CONFIG = "config"
}

@Entity("configs")
@Index(["key"], { unique: true })
@Index(["type"])
@Index(["deletedAt"])
export class Config {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "varchar", length: "255", unique: true })
    key!: string;

    @Column({ type: "text", nullable: true })
    value!: string;

    @Column({ 
        type: "enum", 
        enum: ConfigType, 
        default: ConfigType.CONFIG 
    })
    type!: ConfigType;

    @Column({ type: "text", nullable: true })
    description!: string;

    @Column({ type: "varchar", length: "36", nullable: true })
    createdBy: string | undefined;

    @Column({ type: "varchar", length: "36", nullable: true })
    updatedBy: string | undefined;

    @Column({ type: "varchar", length: "36", nullable: true })
    deletedBy: string | undefined;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @DeleteDateColumn()
    deletedAt!: Date;
}
