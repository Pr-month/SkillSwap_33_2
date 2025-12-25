import { Exclude } from 'class-transformer';
import { IsDefined, IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { RefreshToken } from './refreshToken.entity';
import { GenderOption, UserRole } from '../enums';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Skill } from 'src/skills/entities/skill.entity';
import { Category } from 'src/categories/entities/category.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @IsDefined()
  @MinLength(2)
  name: string;

  @Column({ unique: true })
  @IsEmail()
  @IsDefined()
  email: string;

  @Column()
  @IsDefined()
  @MinLength(8)
  @Exclude()
  password: string;

  @Column()
  about: string;

  @Column()
  @IsDefined()
  @IsNotEmpty()
  birthdate: Date;

  @Column()
  city: string;

  @Column({
    type: 'enum',
    enum: GenderOption,
    default: GenderOption.MALE,
  })
  @IsDefined()
  @IsNotEmpty()
  gender: GenderOption;

  @Column({ nullable: true }) // пока нет фронта, может быть null
  avatar: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @BeforeInsert()
  @BeforeUpdate()
  emailToLowerCase() {
    this.email = this.email.toLowerCase();
  }

  @OneToMany(() => RefreshToken, (token) => token.user, {
    cascade: true, // автоматически сохраняет/обновляет/удаляет связанные сущности
  })
  refreshTokens: RefreshToken[];

  @OneToMany(() => Skill, (skill) => skill.owner, { cascade: true })
  skills: Skill[];

  @ManyToMany(() => Category, (category) => category.usersWantedToLearn)
  wantToLearn: Category[];

  @ManyToMany(() => Skill, (skill) => skill.interestedUsers)
  favoriteSkills: Skill[];
}
