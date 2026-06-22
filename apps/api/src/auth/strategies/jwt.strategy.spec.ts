import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  it('validates a JWT payload into an authenticated user', () => {
    const configService = {
      getOrThrow: jest.fn<string, [string]>().mockReturnValue('test-secret')
    } as Pick<ConfigService, 'getOrThrow'>;
    const strategy = new JwtStrategy(configService as ConfigService);

    expect(
      strategy.validate({
        sub: 'user-id',
        email: 'student@grabgo.test',
        role: Role.STUDENT
      })
    ).toEqual({
      id: 'user-id',
      email: 'student@grabgo.test',
      role: Role.STUDENT
    });
  });
});
