import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

describe('ProductsController', () => {
  let controller: ProductsController;
  const productsServiceMock = {
    findBySnack: jest.fn(),
    findById: jest.fn()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: ProductsService,
          useValue: productsServiceMock
        }
      ]
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
    jest.clearAllMocks();
  });

  it('requires snackId to list products', () => {
    expect(() => controller.findBySnack()).toThrow(BadRequestException);
    expect(productsServiceMock.findBySnack).not.toHaveBeenCalled();
  });

  it('lists products for a snack', async () => {
    productsServiceMock.findBySnack.mockResolvedValue([]);

    await expect(controller.findBySnack('snack-id')).resolves.toEqual([]);
    expect(productsServiceMock.findBySnack).toHaveBeenCalledWith('snack-id');
  });
});
