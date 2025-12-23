import { UserRole } from '../users/enums';

export type TJwtPayload = {
  sub: string;
  email: string;
  role: UserRole;
};

export type TAuthResponse = Request & {
  user: TJwtPayload;
};

export type Tokens = {
  accessToken: string;
  refreshToken: string;
};

export type JwtPayloadWithRoles = {
  sub: string;
  email: string;
  roles: string[];
};

export type AuthenticatedRequest = Request & {
  user: JwtPayloadWithRoles;
};
