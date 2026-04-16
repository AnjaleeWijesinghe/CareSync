/**
 * Unit tests for uploadMiddleware (multer memoryStorage + Cloudinary stream)
 */

// Isolate from real Cloudinary by mocking the module before requiring the middleware
jest.mock('cloudinary', () => {
  const { Writable } = require('stream');

  const makeMockStream = (callback, result) => {
    const mockStream = new Writable({
      write(chunk, encoding, done) { done(); },
    });
    setImmediate(() => callback(null, result));
    return mockStream;
  };

  const mockUploadStream = jest.fn((options, callback) =>
    makeMockStream(callback, {
      secure_url: 'https://res.cloudinary.com/test/image/upload/v1/caresync/test.jpg',
      public_id: 'caresync/test',
    })
  );

  return {
    v2: {
      config: jest.fn(),
      uploader: { upload_stream: mockUploadStream },
    },
  };
});

// Set required env vars before loading middleware
process.env.CLOUDINARY_CLOUD_NAME = 'test';
process.env.CLOUDINARY_API_KEY = 'key';
process.env.CLOUDINARY_API_SECRET = 'secret';

const upload = require('../middleware/uploadMiddleware');
const { cloudinaryUpload, uploadToCloudinary } = require('../middleware/uploadMiddleware');

describe('uploadMiddleware', () => {
  it('should export a multer instance', () => {
    expect(typeof upload.single).toBe('function');
    expect(typeof upload.array).toBe('function');
  });

  it('should export cloudinaryUpload middleware', () => {
    expect(typeof cloudinaryUpload).toBe('function');
  });

  it('cloudinaryUpload should call next() immediately when no file', async () => {
    const req = {};
    const res = {};
    const next = jest.fn();

    await cloudinaryUpload(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(); // no error
  });

  it('cloudinaryUpload should attach secure_url to req.file.path on success', async () => {
    const req = { file: { buffer: Buffer.from('fake image data'), mimetype: 'image/jpeg', originalname: 'photo.jpg' } };
    const res = {};
    const next = jest.fn();

    await cloudinaryUpload(req, res, next);

    expect(next).toHaveBeenCalledWith(); // no error
    expect(req.file.path).toBe('https://res.cloudinary.com/test/image/upload/v1/caresync/test.jpg');
    expect(req.file.cloudinaryPublicId).toBe('caresync/test');
  });

  it('cloudinaryUpload should call next(err) on Cloudinary failure', async () => {
    // Override mock to return an error for this test
    const cloudinary = require('cloudinary');
    cloudinary.v2.uploader.upload_stream.mockImplementationOnce((options, callback) => {
      const { Writable } = require('stream');
      const mockStream = new Writable({ write(chunk, enc, done) { done(); } });
      setImmediate(() => callback(new Error('Cloudinary upload failed')));
      return mockStream;
    });

    const req = { file: { buffer: Buffer.from('bad data'), mimetype: 'image/jpeg' } };
    const res = {};
    const next = jest.fn();

    await cloudinaryUpload(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(next.mock.calls[0][0].message).toBe('Cloudinary upload failed');
  });
});
