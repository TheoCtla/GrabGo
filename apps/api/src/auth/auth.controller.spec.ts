import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authServiceMock: {
    register: jest.Mock;
    registerStudent: jest.Mock;
    login: jest.Mock;
  };

  beforeEach(async () => {
    authServiceMock = {
      register: jest.fn(),
      registerStudent: jest.fn(),
      login: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authServiceMock
        }
      ]
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('returns the current authenticated user from /me', () => {
    const user = {
      id: 'user-id',
      email: 'student@grabgo.test',
      role: Role.STUDENT
    };

    expect(controller.me(user)).toEqual(user);
  });

  it('delegates student registration to the auth service', async () => {
    const authResponse = {
      accessToken: 'student-token',
      user: {
        id: 'student-id',
        email: 'student@grabgo.test',
        firstName: 'Ada',
        lastName: 'Lovelace',
        role: Role.STUDENT,
        phone: null,
        isActive: true,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z')
      }
    };
    const payload = {
      email: 'student@grabgo.test',
      password: 'Password123!',
      firstName: 'Ada',
      lastName: 'Lovelace'
    };

    authServiceMock.registerStudent.mockResolvedValue(authResponse);

    await expect(controller.registerStudent(payload)).resolves.toEqual(authResponse);
    expect(authServiceMock.registerStudent).toHaveBeenCalledWith(payload);
  });
});
