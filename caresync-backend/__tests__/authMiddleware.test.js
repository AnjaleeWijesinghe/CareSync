/**
 * Unit tests for authMiddleware
 */
const { protect, authorise } = require('../middleware/authMiddleware');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'test_secret';

describe('authMiddleware', () => {
  describe('protect', () => {
    it('should return 401 when no Authorization header', () => {
      const req = { headers: {} };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when token is invalid', () => {
      const req = { headers: { authorization: 'Bearer invalid_token' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next and attach user when token is valid', () => {
      const payload = { id: 'user123', role: 'patient' };
      const token = jwt.sign(payload, process.env.JWT_SECRET);
      const req = { headers: { authorization: `Bearer ${token}` } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      protect(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user.id).toBe('user123');
      expect(req.user.role).toBe('patient');
    });
  });

  describe('authorise', () => {
    it('should return 403 when role not in allowed list', () => {
      const req = { user: { role: 'patient' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      authorise('admin')(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next when role is in allowed list', () => {
      const req = { user: { role: 'admin' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      authorise('admin', 'doctor')(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });
});
