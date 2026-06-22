import { ExecutionContext } from '@nestjs/common';
import { Role } from '@prisma/client';
import { getCurrentUser } from './current-user.decorator';

describe('CurrentUser decorator', () => {
  it('gets the authenticated user from the request', () => {
    const user = {
      id: 'user-id',
      email: 'student@grabgo.test',
      role: Role.STUDENT
    };
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ user })
      })
    } as unknown as ExecutionContext;

    expect(getCurrentUser(undefined, context)).toEqual(user);
  });
});
