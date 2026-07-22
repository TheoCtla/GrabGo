import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Role, User } from '@prisma/client';
import * as argon2 from 'argon2';
import { CreateUserData, UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

type UsersServiceMock = {
  findByEmail: jest.Mock<Promise<User | null>, [string]>;
  createUser: jest.Mock<Promise<User>, [CreateUserData]>;
};

type JwtServiceMock = {
  signAsync: jest.Mock<Promise<string>, [Record<string, unknown>]>;
};

describe('AuthService', () => {
  let service: AuthService;
  const usersServiceMock: UsersServiceMock = {
    findByEmail: jest.fn<Promise<User | null>, [string]>(),
    createUser: jest.fn<Promise<User>, [CreateUserData]>()
  };
  const jwtServiceMock: JwtServiceMock = {
    signAsync: jest.fn<Promise<string>, [Record<string, unknown>]>()
  };

  const user: User = {
    id: 'user-id',
    email: 'student@grabgo.test',
    passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$placeholder$placeholder',
    firstName: 'Ada',
    lastName: 'Lovelace',
    role: Role.STUDENT,
    phone: null,
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z')
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: usersServiceMock
        },
        {
          provide: JwtService,
          useValue: jwtServiceMock
        }
      ]
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
    jwtServiceMock.signAsync.mockResolvedValue('signed-token');
  });

  it('register hashes the password and creates a user', async () => {
    usersServiceMock.findByEmail.mockResolvedValue(null);
    usersServiceMock.createUser.mockImplementation((data) =>
      Promise.resolve({
        ...user,
        passwordHash: data.passwordHash
      })
    );

    const response = await service.register({
      email: user.email,
      password: 'StrongPassword123',
      firstName: user.firstName,
      lastName: user.lastName
    });

    const createPayload = usersServiceMock.createUser.mock.calls[0]?.[0];

    if (!createPayload) {
      throw new Error('Expected createUser to be called');
    }

    expect(createPayload.passwordHash).not.toBe('StrongPassword123');
    await expect(argon2.verify(createPayload.passwordHash, 'StrongPassword123')).resolves.toBe(
      true
    );
    expect(createPayload.role).toBe(Role.STUDENT);
    expect(response.accessToken).toBe('signed-token');
    expect(response.user).not.toHaveProperty('passwordHash');
  });

  it('register refuses an already used email', async () => {
    usersServiceMock.findByEmail.mockResolvedValue(user);

    await expect(
      service.register({
        email: user.email,
        password: 'StrongPassword123',
        firstName: user.firstName,
        lastName: user.lastName
      })
    ).rejects.toBeInstanceOf(ConflictException);
    expect(usersServiceMock.createUser).not.toHaveBeenCalled();
  });

  it('registerStudent forces the student role and returns a safe session', async () => {
    usersServiceMock.findByEmail.mockResolvedValue(null);
    usersServiceMock.createUser.mockImplementation((data) =>
      Promise.resolve({
        ...user,
        passwordHash: data.passwordHash,
        role: data.role ?? Role.MERCHANT
      })
    );

    const response = await service.registerStudent({
      email: user.email,
      password: 'StrongPassword123',
      firstName: user.firstName,
      lastName: user.lastName
    });

    const createPayload = usersServiceMock.createUser.mock.calls[0]?.[0];

    if (!createPayload) {
      throw new Error('Expected createUser to be called');
    }

    expect(createPayload.role).toBe(Role.STUDENT);
    expect(createPayload.passwordHash).not.toBe('StrongPassword123');
    await expect(argon2.verify(createPayload.passwordHash, 'StrongPassword123')).resolves.toBe(
      true
    );
    expect(response.accessToken).toBe('signed-token');
    expect(response.user.role).toBe(Role.STUDENT);
    expect(response.user).not.toHaveProperty('passwordHash');
  });

  it('registerStudent refuses an already used email', async () => {
    usersServiceMock.findByEmail.mockResolvedValue(user);

    await expect(
      service.registerStudent({
        email: user.email,
        password: 'StrongPassword123',
        firstName: user.firstName,
        lastName: user.lastName
      })
    ).rejects.toBeInstanceOf(ConflictException);
    expect(usersServiceMock.createUser).not.toHaveBeenCalled();
  });

  it('login returns a token for valid credentials', async () => {
    const passwordHash = await argon2.hash('StrongPassword123');
    usersServiceMock.findByEmail.mockResolvedValue({
      ...user,
      passwordHash
    });

    const response = await service.login({
      email: user.email,
      password: 'StrongPassword123'
    });

    expect(response.accessToken).toBe('signed-token');
    expect(response.user).not.toHaveProperty('passwordHash');
    expect(jwtServiceMock.signAsync).toHaveBeenCalledWith({
      sub: user.id,
      email: user.email,
      role: user.role
    });
  });

  it('login refuses invalid credentials', async () => {
    const passwordHash = await argon2.hash('StrongPassword123');
    usersServiceMock.findByEmail.mockResolvedValue({
      ...user,
      passwordHash
    });

    await expect(
      service.login({
        email: user.email,
        password: 'WrongPassword123'
      })
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('register does not allow creating an admin', async () => {
    usersServiceMock.findByEmail.mockResolvedValue(null);

    await expect(
      service.register({
        email: 'admin@grabgo.test',
        password: 'StrongPassword123',
        firstName: 'Grace',
        lastName: 'Hopper',
        role: Role.ADMIN
      })
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(usersServiceMock.createUser).not.toHaveBeenCalled();
  });
});
