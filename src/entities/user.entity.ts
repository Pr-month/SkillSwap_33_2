import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BeforeInsert,
  OneToMany,
  BeforeUpdate,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { RefreshToken } from '../entities/refreshToken.entity';
import { GenderOption, UserRole } from '../users/enums';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  userRole: UserRole;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: false })
  username: string;

  @Column({ nullable: false })
  @Exclude()
  password: string;

  @Column()
  birthday: Date;

  @Column({
    type: 'enum',
    enum: GenderOption,
    default: GenderOption.MALE,
  })
  gender: GenderOption;

  @Column()
  city: string;

  @Column({ type: 'text', array: true })
  skill: string[];

  @Column({ type: 'text', array: true })
  subSkill: string[];

  @Column({ type: 'text', array: true })
  skillToTeach: string[];

  @Column({ type: 'text', array: true })
  subSkillToTeach: string[];

  @Column({ length: 500 })
  descriptionSkillToTeach: string;

  // @Column({ nullable: true })
  // image: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  emailToLowerCase() {
    this.email = this.email.toLowerCase();
  }

  @OneToMany(() => RefreshToken, (token) => token.user, {
    cascade: true, // автоматически сохраняет/обновляет/удаляет связанные сущности
  })
  refreshTokens: RefreshToken[];
}
