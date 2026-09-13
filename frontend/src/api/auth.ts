import { api } from './client';
import { User, Role } from '../types';

export interface LoginResponse {
  token: string;
  user: User;
}

export const authApi = {
  // Client login
  loginUser: async (email: string, password: string): Promise<LoginResponse> => {
    return api.post<LoginResponse>('/auth/login', { email, password }, false);
  },

  // Staff (Manager / Supervisor) login
  loginStaff: async (email: string, password: string): Promise<LoginResponse> => {
    return api.post<LoginResponse>('/auth/login', { email, password }, true);
  },

  // Client registration
  registerUser: async (name: string, email: string, password: string): Promise<User> => {
    return api.post<User>('/auth/register', { name, email, password }, false);
  },

  // Supervisor registers staff
  registerStaff: async (name: string, email: string, password: string, role: Role): Promise<User> => {
    return api.post<User>('/auth/register', { name, email, password, role }, true);
  },

  // Get current user profile
  getUserProfile: async (): Promise<User> => {
    return api.get<User>('/users/me', false);
  },

  // Update client profile
  updateUserProfile: async (data: { name?: string; email?: string; password?: string }): Promise<User> => {
    return api.put<User>('/users/me', data, false);
  },

  // Get current staff profile
  getStaffProfile: async (): Promise<User> => {
    return api.get<User>('/staff/profile', true);
  },

  // Logout
  logoutUser: async (): Promise<void> => {
    return api.post('/auth/logout', {}, false);
  },

  logoutStaff: async (): Promise<void> => {
    return api.post('/auth/logout', {}, true);
  },
};
