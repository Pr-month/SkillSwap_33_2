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
import { Expose, Transform, Exclude } from 'class-transformer';

@Entity()
export class Request {
  @PrimaryGeneratedColumn('uuid')
  @Expose()
  id: string;

  @CreateDateColumn()
  @Expose()
  createdAt: Date;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'senderId' })
  @Exclude()
  sender: User;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'receiverId' })
  @Exclude()
  receiver: User;

  @Column({
    type: 'enum',
    enum: RequestStatus,
    default: RequestStatus.PENDING,
  })
  @Expose()
  status: RequestStatus;

  @ManyToOne(() => Skill, { nullable: false })
  @JoinColumn({ name: 'offeredSkillId' })
  @Exclude()
  offeredSkill: Skill;

  @ManyToOne(() => Skill, { nullable: false })
  @JoinColumn({ name: 'requestedSkillId' })
  @Exclude()
  requestedSkill: Skill;

  @Column({ default: false })
  @Expose()
  isRead: boolean;

  @Expose()
  @Transform(({ obj }: { obj: Request }) => obj.sender?.id)
  senderId: string;

  @Expose()
  @Transform(({ obj }: { obj: Request }) => obj.receiver?.id)
  receiverId: string;

  @Expose()
  @Transform(({ obj }: { obj: Request }) => obj.offeredSkill?.id)
  offeredSkillId: string;

  @Expose()
  @Transform(({ obj }: { obj: Request }) => obj.requestedSkill?.id)
  requestedSkillId: string;
}
