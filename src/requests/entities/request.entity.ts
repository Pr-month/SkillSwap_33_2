import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { RequestStatus } from '../request-status.enum';
import { User } from '../../users/entities/user.entity';
import { Skill } from '../../skills/entities/skill.entity';
import { Expose } from 'class-transformer';

@Entity()
export class Request {
  @PrimaryGeneratedColumn('uuid')
  @Expose()
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'senderId' })
  sender: User;

  @Column()
  @Expose()
  senderId: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'receiverId' })
  receiver: User;

  @Column()
  @Expose()
  receiverId: string;

  @Column({
    type: 'enum',
    enum: RequestStatus,
    default: RequestStatus.PENDING,
  })
  @Expose()
  status: RequestStatus;

  @ManyToOne(() => Skill, { nullable: false })
  @JoinColumn({ name: 'offeredSkillId' })
  offeredSkill: Skill;

  @Column()
  @Expose()
  offeredSkillId: string;

  @ManyToOne(() => Skill, { nullable: false })
  @JoinColumn({ name: 'requestedSkillId' })
  requestedSkill: Skill;

  @Column()
  @Expose()
  requestedSkillId: string;

  @Column({ default: false })
  isRead: boolean;
}
