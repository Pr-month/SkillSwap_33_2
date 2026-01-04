import { UPLOAD_PATH } from './file.constants';
import {
  validateFile,
  generateRandomFilename,
  ensureUploadDirectoryExists,
} from './file.utils';

describe('File Utils', () => {
  describe('validateFile', () => {
    it('should accept valid image', () => {
      expect(validateFile('image/jpeg', 'a.jpg')).toBe(true);
      expect(validateFile('image/png', 'b.PNG')).toBe(true);
    });

    it('should reject invalid MIME', () => {
      expect(validateFile('application/x-msdownload', 'a.exe')).toBe(false);
    });

    it('should reject valid MIME with invalid extension', () => {
      expect(validateFile('image/jpeg', 'fake.exe')).toBe(false);
    });

    it('should reject invalid MIME with valid extension', () => {
      expect(validateFile('text/plain', 'fake.jpg')).toBe(false);
    });
  });

  describe('generateRandomFilename', () => {
    it('should generate 32-char hex + lowercase extension', () => {
      const name = generateRandomFilename('TEST.JPG');
      expect(name).toMatch(/^[a-f0-9]{32}\.jpg$/);
    });
  });

  describe('ensureUploadDirectoryExists', () => {
    it('should not throw', () => {
      expect(() => ensureUploadDirectoryExists(UPLOAD_PATH)).not.toThrow();
    });
  });
});
