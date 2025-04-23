import { User, UserRole } from '../types/user';

// Mock user data for development
const MOCK_USERS: User[] = [
  {
    id: 'user1',
    email: 'solar@example.com',
    name: 'Solar Producer',
    role: 'PRODUCER' as UserRole,
    balance: 10000,
    avatar: 'https://randomuser.me/api/portraits/men/1.jpg'
  },
  {
    id: 'user2',
    email: 'wind@example.com',
    name: 'Wind Farm',
    role: 'PRODUCER' as UserRole,
    balance: 15000,
    avatar: 'https://randomuser.me/api/portraits/women/2.jpg'
  },
  {
    id: 'user3',
    email: 'buyer@example.com',
    name: 'Energy Buyer',
    role: 'CONSUMER' as UserRole,
    balance: 25000,
    avatar: 'https://randomuser.me/api/portraits/men/3.jpg'
  }
];

class AuthService {
  private currentUser: User | null = null;
  private authListeners: ((user: User | null) => void)[] = [];

  constructor() {
    // Check for saved user in localStorage
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        this.currentUser = JSON.parse(savedUser);
      } catch (error) {
        console.error('Failed to parse saved user:', error);
        localStorage.removeItem('currentUser');
      }
    }
  }

  public login(email: string, password: string): Promise<User> {
    return new Promise((resolve, reject) => {
      // Simulate API call delay
      setTimeout(() => {
        const user = MOCK_USERS.find(u => u.email === email);
        if (user) {
          this.currentUser = user;
          localStorage.setItem('currentUser', JSON.stringify(user));
          this.notifyListeners();
          resolve(user);
        } else {
          reject(new Error('Invalid email or password'));
        }
      }, 800);
    });
  }

  public logout(): void {
    this.currentUser = null;
    localStorage.removeItem('currentUser');
    this.notifyListeners();
  }

  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  public isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  public subscribeToAuthChanges(callback: (user: User | null) => void): () => void {
    this.authListeners.push(callback);
    
    // Immediately call with current state
    callback(this.currentUser);
    
    // Return unsubscribe function
    return () => {
      this.authListeners = this.authListeners.filter(cb => cb !== callback);
    };
  }

  private notifyListeners(): void {
    this.authListeners.forEach(callback => callback(this.currentUser));
  }
}

export const authService = new AuthService();
