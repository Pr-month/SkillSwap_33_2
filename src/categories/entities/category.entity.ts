import { IsDefined, IsNotEmpty, Length } from 'class-validator';
import { Skill } from '../../skills/entities/skill.entity';
import { User } from '../../users/entities/user.entity';
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

  @Column({ unique: true })
  name: string;

  @ManyToOne(() => Category, (category) => category.children, {
    nullable: true,
    onDelete: 'CASCADE', // при удалении родителя удаляются дети
  })
  parent: Category | null;

  @OneToMany(() => Category, (category) => category.parent)
  children: Category[];

  @OneToMany(() => Skill, (skill) => skill.category, { cascade: true })
  skills: Skill[];

  @ManyToMany(() => User, (user) => user.wantToLearn)
  @JoinTable()
  usersWantedToLearn: User[];
}
