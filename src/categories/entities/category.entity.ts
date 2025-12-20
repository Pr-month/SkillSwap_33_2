import { IsDefined, IsNotEmpty, Length } from 'class-validator';
import { Skill } from 'src/skills/entities/skill.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @IsDefined()
  @IsNotEmpty()
  @Length(2, 100)
  name: string;

  @ManyToOne(() => Category, (category) => category.children, {
    nullable: true,
  })
  parent: Category | null;

  @OneToMany(() => Category, (category) => category.parent, { cascade: true })
  children: Category[];

  @OneToMany(() => Skill, (skill) => skill.category, { cascade: true })
  skills: Skill[];

  @ManyToMany(() => User, (user) => user.wantToLearn)
  @JoinTable()
  usersWantedToLearn: User[];
}
