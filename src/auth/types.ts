import { TParentSkillSubSkills } from '../types/skill.type';
import { UserRole } from '../users/enums';

export type TJwtPayload = {
  sub: string;
  email: string;
  role: UserRole;
};

export enum GenderOption {
  MALE = 'male',
  FEMALE = 'female',
}

export type TAuthResponse = {
  user: TJwtPayload;
  createdAt: string | number | Date;
  name: string;
  image: string | File[];
  city: string;
  gender: GenderOption;
  birthdayDate: string;
  description: string;
  likes: string[];
  canTeach: TParentSkillSubSkills[];
  wantsToLearn: TParentSkillSubSkills[];
};
