import fs from 'fs';
import path from 'path';
import { User, AuthSession, UserRole } from '@/types/index';

const DATA_DIR = path.join(process.cwd(), 'data', 'auth');

// Ensure auth data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export class AuthStorage {
  private static getUsersPath() {
    return path.join(DATA_DIR, 'users.json');
  }

  private static getSessionsPath() {
    return path.join(DATA_DIR, 'sessions.json');
  }

  private static getRolesPath() {
    return path.join(DATA_DIR, 'roles.json');
  }

  // Users
  static getUsers(): User[] {
    try {
      const data = fs.readFileSync(this.getUsersPath(), 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  }

  static saveUsers(users: User[]): void {
    fs.writeFileSync(this.getUsersPath(), JSON.stringify(users, null, 2));
  }

  static findUserByUsername(username: string): User | null {
    const users = this.getUsers();
    return users.find(user => user.username === username && user.isActive) || null;
  }

  static findUserById(id: string): User | null {
    const users = this.getUsers();
    return users.find(user => user.id === id && user.isActive) || null;
  }

  static updateUserLastLogin(userId: string): void {
    const users = this.getUsers();
    const userIndex = users.findIndex(user => user.id === userId);
    if (userIndex !== -1) {
      users[userIndex].lastLogin = new Date().toISOString();
      users[userIndex].updatedAt = new Date().toISOString();
      this.saveUsers(users);
    }
  }

  // Sessions
  static getSessions(): AuthSession[] {
    try {
      const data = fs.readFileSync(this.getSessionsPath(), 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  }

  static saveSessions(sessions: AuthSession[]): void {
    fs.writeFileSync(this.getSessionsPath(), JSON.stringify(sessions, null, 2));
  }

  static createSession(user: Omit<User, 'password'>): AuthSession {
    const token = this.generateToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
    
    const session: AuthSession = {
      user,
      token,
      expiresAt
    };

    const sessions = this.getSessions();
    // Remove any existing sessions for this user
    const filteredSessions = sessions.filter(s => s.user.id !== user.id);
    filteredSessions.push(session);
    
    this.saveSessions(filteredSessions);
    return session;
  }

  static findSessionByToken(token: string): AuthSession | null {
    const sessions = this.getSessions();
    const session = sessions.find(s => s.token === token);
    
    if (!session) return null;
    
    // Check if session is expired
    if (new Date() > new Date(session.expiresAt)) {
      this.removeSession(token);
      return null;
    }
    
    return session;
  }

  static removeSession(token: string): void {
    const sessions = this.getSessions();
    const filteredSessions = sessions.filter(s => s.token !== token);
    this.saveSessions(filteredSessions);
  }

  static cleanExpiredSessions(): void {
    const sessions = this.getSessions();
    const now = new Date();
    const validSessions = sessions.filter(s => new Date(s.expiresAt) > now);
    this.saveSessions(validSessions);
  }

  // Roles
  static getRoles(): UserRole[] {
    try {
      const data = fs.readFileSync(this.getRolesPath(), 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  }

  static findRoleById(id: string): UserRole | null {
    const roles = this.getRoles();
    return roles.find(role => role.id === id) || null;
  }

  // Utility functions
  private static generateToken(): string {
    return 'auth_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  // Validate credentials
  static validateCredentials(username: string, password: string): User | null {
    const user = this.findUserByUsername(username);
    if (!user || user.password !== password) {
      return null;
    }
    return user;
  }
}
