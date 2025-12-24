import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';

describe('FilesController', () => {
  let controller: FilesController;
  let service: FilesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FilesController],
      providers: [
        {
          provide: FilesService,
          useValue: {
            createFileResponse: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<FilesController>(FilesController);
    service = module.get<FilesService>(FilesService);
  });

  it('should return service response when file is provided', () => {
    const mockFile = {
      filename: 'abc123.jpg',
      originalname: 'test.jpg',
      mimetype: 'image/jpeg',
      size: 2048,
    } as Express.Multer.File;

    const mockResponse = {
      url: '/uploads/abc123.jpg',
      name: 'test.jpg',
      mimeType: 'image/jpeg',
      size: 2048,
    };

    const createFileResponseSpy = jest
      .spyOn(service, 'createFileResponse')
      .mockReturnValue(mockResponse);

    const result = controller.uploadFile(mockFile);

    expect(result).toBe(mockResponse);
    expect(createFileResponseSpy).toHaveBeenCalledWith(mockFile);
  });

  it('should throw BadRequestException if file is not provided', () => {
    expect(() => controller.uploadFile(undefined)).toThrow(BadRequestException);
  });
});
