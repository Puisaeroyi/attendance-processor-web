import {
  isAdmin,
  isManager,
  isManagerOrAdmin,
  hasRole,
  toUserProfile,
  type UserProfile,
  type UserRole,
} from '../types';

describe('Auth Helper Functions', () => {
  describe('toUserProfile', () => {
    it('should convert user object to UserProfile', () => {
      const user = {
        id: '123',
        email: 'test@example.com',
        username: 'testuser',
        role: 'ADMIN' as UserRole,
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
        passwordHash: 'secret', // Should be excluded
      };

      const profile = toUserProfile(user);

      expect(profile).toEqual({
        id: '123',
        email: 'test@example.com',
        username: 'testuser',
        role: 'ADMIN',
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
      });
      expect(profile).not.toHaveProperty('passwordHash');
    });

    it('should return null for null input', () => {
      expect(toUserProfile(null)).toBeNull();
    });

    it('should handle user with null optional fields', () => {
      const user = {
        id: '456',
        email: 'user@example.com',
        username: 'user',
        role: 'USER' as UserRole,
        firstName: null,
        lastName: null,
        isActive: true,
      };

      const profile = toUserProfile(user);

      expect(profile).toEqual({
        id: '456',
        email: 'user@example.com',
        username: 'user',
        role: 'USER',
        firstName: null,
        lastName: null,
        isActive: true,
      });
    });
  });

  describe('isAdmin', () => {
    it('should return true for ADMIN role', () => {
      const adminUser: UserProfile = {
        id: '1',
        email: 'admin@example.com',
        username: 'admin',
        role: 'ADMIN',
        firstName: 'Admin',
        lastName: 'User',
        isActive: true,
      };

      expect(isAdmin(adminUser)).toBe(true);
    });

    it('should return false for non-ADMIN roles', () => {
      const managerUser: UserProfile = {
        id: '2',
        email: 'manager@example.com',
        username: 'manager',
        role: 'MANAGER',
        firstName: 'Manager',
        lastName: 'User',
        isActive: true,
      };

      const regularUser: UserProfile = {
        id: '3',
        email: 'user@example.com',
        username: 'user',
        role: 'USER',
        firstName: 'Regular',
        lastName: 'User',
        isActive: true,
      };

      expect(isAdmin(managerUser)).toBe(false);
      expect(isAdmin(regularUser)).toBe(false);
    });

    it('should return false for null user', () => {
      expect(isAdmin(null)).toBe(false);
    });
  });

  describe('isManager', () => {
    it('should return true for MANAGER role', () => {
      const managerUser: UserProfile = {
        id: '2',
        email: 'manager@example.com',
        username: 'manager',
        role: 'MANAGER',
        firstName: 'Manager',
        lastName: 'User',
        isActive: true,
      };

      expect(isManager(managerUser)).toBe(true);
    });

    it('should return false for non-MANAGER roles', () => {
      const adminUser: UserProfile = {
        id: '1',
        email: 'admin@example.com',
        username: 'admin',
        role: 'ADMIN',
        firstName: 'Admin',
        lastName: 'User',
        isActive: true,
      };

      const regularUser: UserProfile = {
        id: '3',
        email: 'user@example.com',
        username: 'user',
        role: 'USER',
        firstName: 'Regular',
        lastName: 'User',
        isActive: true,
      };

      expect(isManager(adminUser)).toBe(false);
      expect(isManager(regularUser)).toBe(false);
    });

    it('should return false for null user', () => {
      expect(isManager(null)).toBe(false);
    });
  });

  describe('isManagerOrAdmin', () => {
    it('should return true for ADMIN role', () => {
      const adminUser: UserProfile = {
        id: '1',
        email: 'admin@example.com',
        username: 'admin',
        role: 'ADMIN',
        firstName: 'Admin',
        lastName: 'User',
        isActive: true,
      };

      expect(isManagerOrAdmin(adminUser)).toBe(true);
    });

    it('should return true for MANAGER role', () => {
      const managerUser: UserProfile = {
        id: '2',
        email: 'manager@example.com',
        username: 'manager',
        role: 'MANAGER',
        firstName: 'Manager',
        lastName: 'User',
        isActive: true,
      };

      expect(isManagerOrAdmin(managerUser)).toBe(true);
    });

    it('should return false for USER role', () => {
      const regularUser: UserProfile = {
        id: '3',
        email: 'user@example.com',
        username: 'user',
        role: 'USER',
        firstName: 'Regular',
        lastName: 'User',
        isActive: true,
      };

      expect(isManagerOrAdmin(regularUser)).toBe(false);
    });

    it('should return false for null user', () => {
      expect(isManagerOrAdmin(null)).toBe(false);
    });
  });

  describe('hasRole', () => {
    it('should return true when user has specified role', () => {
      const adminUser: UserProfile = {
        id: '1',
        email: 'admin@example.com',
        username: 'admin',
        role: 'ADMIN',
        firstName: 'Admin',
        lastName: 'User',
        isActive: true,
      };

      expect(hasRole(adminUser, ['ADMIN'])).toBe(true);
      expect(hasRole(adminUser, ['ADMIN', 'MANAGER'])).toBe(true);
    });

    it('should return false when user does not have specified role', () => {
      const regularUser: UserProfile = {
        id: '3',
        email: 'user@example.com',
        username: 'user',
        role: 'USER',
        firstName: 'Regular',
        lastName: 'User',
        isActive: true,
      };

      expect(hasRole(regularUser, ['ADMIN'])).toBe(false);
      expect(hasRole(regularUser, ['ADMIN', 'MANAGER'])).toBe(false);
    });

    it('should return false for null user', () => {
      expect(hasRole(null, ['ADMIN'])).toBe(false);
    });

    it('should handle empty roles array', () => {
      const adminUser: UserProfile = {
        id: '1',
        email: 'admin@example.com',
        username: 'admin',
        role: 'ADMIN',
        firstName: 'Admin',
        lastName: 'User',
        isActive: true,
      };

      expect(hasRole(adminUser, [])).toBe(false);
    });
  });
});
