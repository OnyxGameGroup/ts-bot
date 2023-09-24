import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum ActionEnum {
    LOG = "log",
    KICK = "kick",
    BAN = "ban",
    WARN = "warn",
    DISABLE = "disable",
    UNKNOWN = "unknown"
}

@Entity()
export class ModerationEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;
    
    @Column({
        type: 'varchar',
    })
    suspect: string;

    @Column({
        type: "enum",
        enum: ["log", "kick", "ban", "warn", "disable", "unknown"],
    })
    action: ActionEnum;

    @Column({
        type: 'varchar',
    })
    moderator: string;

    @Column({
        type: 'varchar',
    })
    moderatorNote: string;

    @Column({
        type: 'date',
    })
    date: Date;
}