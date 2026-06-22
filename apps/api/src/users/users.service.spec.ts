import { Test, TestingModule } from '@nestjs/testing';
import { Role, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserData, toSafeUser, UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  const prismaMock = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn()
    }
  };

  const user: User = {
    id: 'user-id',
    email: 'student@grabgo.test',
    passwordHash: 'hashed-password',
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
        UsersService,
        {
          provide: PrismaService,
          useValue: prismaMock
        }
      ]
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  it('finds a user by email', async () => {
    prismaMock.user.findUnique.mockResolvedValue(user);

    await expect(service.findByEmail(user.email)).resolves.toEqual(user);
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { email: user.email }
    });
  });

  it('finds a user by id', async () => {
    prismaMock.user.findUnique.mockResolvedValue(user);

    await expect(service.findById(user.id)).resolves.toEqual(user);
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { id: user.id }
    });
  });

  it('creates a user with an existing password hash', async () => {
    const data: CreateUserData = {
      email: user.email,
      passwordHash: user.passwordHash,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    };
    prismaMock.user.create.mockResolvedValue(user);

    await expect(service.createUser(data)).resolves.toEqual(user);
    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        phone: data.phone
      }
    });
  });

  it('removes passwordHash from a safe user representation', () => {
    const safeUser = toSafeUser(user);

    expect(safeUser).toEqual({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      phone: user.phone,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });
    expect(safeUser).not.toHaveProperty('passwordHash');
  });
});
