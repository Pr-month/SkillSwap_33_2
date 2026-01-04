import { User } from '../entities/user.entity';

export class ResGetUsersDto {
  data: User[];
  meta: {
    total: number;
    page: number;
    lastPage: number;
    limit: number;
  };
}
