import { UserRole } from '../users/enums';

export type TJwtPayload = {
  sub: string;
  email: string;
  role: UserRole;
};

export type TAuthResponse = Request & {
  user: TJwtPayload;
};
