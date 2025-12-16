import { IsDefined, IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

enum UserRole {
  user = 'USER',
  admin = 'ADMIN',
}

enum UserGender {
  male = 'мужской',
  female = 'женский',
}

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
    enum: UserGender,
  })
  @IsDefined()
  @IsNotEmpty()
  gender: string;

  @Column()
  avatar: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.user,
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
