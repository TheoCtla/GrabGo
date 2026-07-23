import { PrismaClient, ProductType, Role, SlotStatus, SnackStatus } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

const SEED_PASSWORD = 'test1234';
const STUDENT_EMAIL = 'etudiant@test.com';
const MERCHANT_EMAIL = 'snack@test.com';
const SLOT_DURATION_MS = 15 * 60 * 1000;
const SEEDED_SLOT_COUNT = 6;

function getTodayAt(hour: number, minute: number): Date {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);

  return date;
}

function roundUpToNextQuarter(date: Date): Date {
  const rounded = new Date(date);
  const minutes = rounded.getMinutes();
  const minutesToAdd = (15 - (minutes % 15)) % 15;

  rounded.setSeconds(0, 0);

  if (minutesToAdd === 0) {
    rounded.setMinutes(minutes + 15);
    return rounded;
  }

  rounded.setMinutes(minutes + minutesToAdd);
  return rounded;
}

function getFreshSlotStarts(): Date[] {
  const preferredStart = new Date(roundUpToNextQuarter(new Date()).getTime() + 30 * 60 * 1000);
  const earliestStart = getTodayAt(11, 30);
  const latestStart = getTodayAt(22, 15);
  const firstStart = new Date(
    Math.min(Math.max(preferredStart.getTime(), earliestStart.getTime()), latestStart.getTime())
  );

  return Array.from({ length: SEEDED_SLOT_COUNT }, (_, index) => {
    return new Date(firstStart.getTime() + index * SLOT_DURATION_MS);
  });
}

async function main() {
  const passwordHash = await argon2.hash(SEED_PASSWORD);

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
      email: STUDENT_EMAIL
    },
    update: {
      passwordHash,
      firstName: 'Etudiant',
      lastName: 'Test',
      role: Role.STUDENT,
      isActive: true
    },
    create: {
      email: STUDENT_EMAIL,
      passwordHash,
      firstName: 'Etudiant',
      lastName: 'Test',
      role: Role.STUDENT,
      isActive: true
    }
  });

  const merchantUser = await prisma.user.upsert({
    where: {
      email: MERCHANT_EMAIL
    },
    update: {
      passwordHash,
      firstName: 'Snack',
      lastName: 'Test',
      role: Role.MERCHANT,
      isActive: true
    },
    create: {
      email: MERCHANT_EMAIL,
      passwordHash,
      firstName: 'Snack',
      lastName: 'Test',
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
      description: 'Snack de test pour le parcours GrabGo.'
    },
    create: {
      merchantId: merchant.id,
      campusId: campus.id,
      name: 'Snack Campus Test',
      description: 'Snack de test pour le parcours GrabGo.',
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

  const slotStarts = getFreshSlotStarts();

  // The seed owns the demo snack slots. Removing only slots without orders avoids stale
  // dates in manual tests while preserving existing orders, payments and withdrawal codes.
  await prisma.slot.deleteMany({
    where: {
      snackId: snack.id,
      startAt: {
        notIn: slotStarts
      },
      orders: {
        none: {}
      }
    }
  });

  for (const startAt of slotStarts) {
    const endAt = new Date(startAt.getTime() + SLOT_DURATION_MS);

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

  const firstSlotStartAt = slotStarts[0]?.toISOString();
  const lastSlotEndAt = slotStarts.at(-1)
    ? new Date(slotStarts[slotStarts.length - 1].getTime() + SLOT_DURATION_MS).toISOString()
    : undefined;

  const [campusCount, userCount, merchantCount, snackCount, productCount, slotCount, orderCount] =
    await Promise.all([
      prisma.campus.count(),
      prisma.user.count(),
      prisma.merchant.count(),
      prisma.snack.count(),
      prisma.product.count(),
      prisma.slot.count(),
      prisma.order.count()
    ]);

  console.log('GrabGo development seed completed.');
  console.log({
    campusId: campus.id,
    studentEmail: student.email,
    merchantEmail: merchantUser.email,
    snackId: snack.id,
    generatedSlotCount: slotStarts.length,
    firstSlotStartAt,
    lastSlotEndAt,
    campusCount,
    userCount,
    merchantCount,
    snackCount,
    productCount,
    slotCount,
    orderCount
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
