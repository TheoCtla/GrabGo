import { PrismaClient, ProductType, Role, SlotStatus, SnackStatus } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

const TEST_PASSWORD = 'Password123!';

function getTomorrowAt(hour: number, minute: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(hour, minute, 0, 0);

  return date;
}

async function main() {
  const passwordHash = await argon2.hash(TEST_PASSWORD);

  const campus = await prisma.campus.upsert({
    where: {
      name_city: {
        name: 'Sophia Ynov Campus',
        city: 'Sophia Antipolis'
      }
    },
    update: {
      address: '123 Route des Lucioles'
    },
    create: {
      name: 'Sophia Ynov Campus',
      city: 'Sophia Antipolis',
      address: '123 Route des Lucioles'
    }
  });

  const student = await prisma.user.upsert({
    where: {
      email: 'student.test@grabgo.local'
    },
    update: {
      passwordHash,
      firstName: 'Ada',
      lastName: 'Lovelace',
      role: Role.STUDENT,
      isActive: true
    },
    create: {
      email: 'student.test@grabgo.local',
      passwordHash,
      firstName: 'Ada',
      lastName: 'Lovelace',
      role: Role.STUDENT,
      isActive: true
    }
  });

  const merchantUser = await prisma.user.upsert({
    where: {
      email: 'merchant.test@grabgo.local'
    },
    update: {
      passwordHash,
      firstName: 'Marco',
      lastName: 'Snack',
      role: Role.MERCHANT,
      isActive: true
    },
    create: {
      email: 'merchant.test@grabgo.local',
      passwordHash,
      firstName: 'Marco',
      lastName: 'Snack',
      role: Role.MERCHANT,
      isActive: true
    }
  });

  const merchant = await prisma.merchant.upsert({
    where: {
      userId: merchantUser.id
    },
    update: {
      companyName: 'GrabGo Snack Test',
      siret: '12345678900012'
    },
    create: {
      userId: merchantUser.id,
      companyName: 'GrabGo Snack Test',
      siret: '12345678900012'
    }
  });

  const snack = await prisma.snack.upsert({
    where: {
      merchantId_name: {
        merchantId: merchant.id,
        name: 'Snack Campus Test'
      }
    },
    update: {
      campusId: campus.id,
      status: SnackStatus.ONLINE,
      circuitBreaker: false,
      snoozedUntil: null,
      description: 'Snack de test pour le parcours Postman GrabGo.'
    },
    create: {
      merchantId: merchant.id,
      campusId: campus.id,
      name: 'Snack Campus Test',
      description: 'Snack de test pour le parcours Postman GrabGo.',
      status: SnackStatus.ONLINE,
      circuitBreaker: false,
      snoozedUntil: null
    }
  });

  const products = [
    {
      name: 'Sandwich Poulet',
      description: 'Sandwich poulet crudites.',
      type: ProductType.SANDWICH,
      priceCents: 550,
      stock: 30
    },
    {
      name: 'Salade Cesar',
      description: 'Salade Cesar prete a emporter.',
      type: ProductType.OTHER,
      priceCents: 650,
      stock: 20
    },
    {
      name: 'Cookie',
      description: 'Cookie pepites de chocolat.',
      type: ProductType.DESSERT,
      priceCents: 250,
      stock: 40
    },
    {
      name: 'Eau',
      description: 'Bouteille eau 50cl.',
      type: ProductType.DRINK,
      priceCents: 150,
      stock: 60
    }
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: {
        snackId_name: {
          snackId: snack.id,
          name: product.name
        }
      },
      update: {
        description: product.description,
        type: product.type,
        priceCents: product.priceCents,
        stock: product.stock,
        isAvailable: true,
        allergensVerifiedAt: new Date()
      },
      create: {
        snackId: snack.id,
        name: product.name,
        description: product.description,
        type: product.type,
        priceCents: product.priceCents,
        stock: product.stock,
        isAvailable: true,
        allergensVerifiedAt: new Date()
      }
    });
  }

  const slotStarts = [
    getTomorrowAt(12, 0),
    getTomorrowAt(12, 15),
    getTomorrowAt(12, 30),
    getTomorrowAt(12, 45),
    getTomorrowAt(13, 0),
    getTomorrowAt(13, 15)
  ];

  for (const startAt of slotStarts) {
    const endAt = new Date(startAt.getTime() + 15 * 60 * 1000);

    await prisma.slot.upsert({
      where: {
        snackId_startAt: {
          snackId: snack.id,
          startAt
        }
      },
      update: {
        endAt,
        capacity: 8,
        status: SlotStatus.AVAILABLE
      },
      create: {
        snackId: snack.id,
        startAt,
        endAt,
        capacity: 8,
        reservedCount: 0,
        status: SlotStatus.AVAILABLE
      }
    });
  }

  const counts = await Promise.all([
    prisma.campus.count(),
    prisma.user.count(),
    prisma.merchant.count(),
    prisma.snack.count(),
    prisma.product.count(),
    prisma.slot.count(),
    prisma.order.count(),
    prisma.payment.count(),
    prisma.withdrawalCode.count()
  ]);

  const [
    campusCount,
    userCount,
    merchantCount,
    snackCount,
    productCount,
    slotCount,
    orderCount,
    paymentCount,
    withdrawalCodeCount
  ] = counts;

  console.log('GrabGo development seed completed.');
  console.log({
    campusId: campus.id,
    studentEmail: student.email,
    merchantEmail: merchantUser.email,
    snackId: snack.id,
    campusCount,
    userCount,
    merchantCount,
    snackCount,
    productCount,
    slotCount,
    orderCount,
    paymentCount,
    withdrawalCodeCount
  });
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
