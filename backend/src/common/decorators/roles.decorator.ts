import { SetMetadata } from '@nestjs/common';

export type AppRole = 'USER' | 'ADMIN';
export const ROLES_KEY = 'roles';
// @Roles('ADMIN') + RolesGuard — §11.
export const Roles = (...roles: AppRole[]) => SetMetadata(ROLES_KEY, roles);
