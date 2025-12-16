import { IsDefined, IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { GenderOption, UserRole } from '../enums';

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
  })
  @IsDefined()
  @IsNotEmpty()
  gender: GenderOption;

  @Column()
  avatar: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column()
  refreshToken: string;

  // Добавить связи с другими entity
  // @Column()
  // skills: string;
  // @Column()
  // wantToLearn: string;
  // @Column()
  // favoriteSkills: string;
}
