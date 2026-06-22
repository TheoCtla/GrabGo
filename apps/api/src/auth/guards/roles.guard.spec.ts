import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { AuthenticatedUser } from '../types/authenticated-user.type';
import { RolesGuard } from './roles.guard';

function createExecutionContext(user?: AuthenticatedUser): ExecutionContext {
  return {
    getHandler: () => RolesGuard,
    getClass: () => RolesGuard,
    switchToHttp: () => ({
      getRequest: () => ({ user })
    })
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  const reflector = {
    getAllAndOverride: jest.fn<Role[] | undefined, [string, unknown[]]>()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows an expected role', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.MERCHANT]);
    const guard = new RolesGuard(reflector as unknown as Reflector);

    expect(
      guard.canActivate(
        createExecutionContext({
          id: 'merchant-id',
          email: 'merchant@grabgo.test',
          role: Role.MERCHANT
        })
      )
    ).toBe(true);
  });

  it('refuses a non-authorized role', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);
    const guard = new RolesGuard(reflector as unknown as Reflector);

    expect(
      guard.canActivate(
        createExecutionContext({
          id: 'student-id',
          email: 'student@grabgo.test',
          role: Role.STUDENT
        })
      )
    ).toBe(false);
  });
});
