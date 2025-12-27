import { FilesService } from './files.service';

describe('FilesService', () => {
  let service: FilesService;

  beforeEach(() => {
    service = new FilesService();
  });

  it('should create file response', () => {
    const file = {
      filename: 'abc123.jpg',
      originalname: 'photo.JPG',
      mimetype: 'image/jpeg',
      size: 2048,
    } as Express.Multer.File;

    const result = service.createFileResponse(file);

    expect(result).toEqual({
      url: '/uploads/abc123.jpg',
      name: 'photo.JPG',
      mimeType: 'image/jpeg',
      size: 2048,
    });
  });
});
