import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from '../types/authenticated-user.type';

type RequestWithUser = {
  user?: AuthenticatedUser;
};

export function getCurrentUser(_data: unknown, context: ExecutionContext): AuthenticatedUser {
  const request = context.switchToHttp().getRequest<RequestWithUser>();
  return request.user as AuthenticatedUser;
}

export const CurrentUser = createParamDecorator(getCurrentUser);
