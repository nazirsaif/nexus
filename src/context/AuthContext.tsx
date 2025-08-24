import React, { createContext, useState, useContext, useEffect } from 'react';
import { User, UserRole, AuthContextType } from '../types';
import { users } from '../data/users'; // Keep for fallback
import toast from 'react-hot-toast';
import axios from 'axios';

// Create Auth Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Local storage keys
const USER_STORAGE_KEY = 'business_nexus_user';
const RESET_TOKEN_KEY = 'business_nexus_reset_token';
const TOKEN_STORAGE_KEY = 'business_nexus_token';

// API URL
const API_URL = 'http://localhost:5000/api';

// Auth Provider Component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for stored user on initial load
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const token = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (token) {
        try {
          const response = await axios.get(`${API_URL}/auth/me`, {
            headers: {
              'x-auth-token': token
            }
          });
          
          // Get user data from response
          const userData = response.data;
          
          // Verify user data exists
          if (!userData || (!userData.role && !userData.userType)) {
            throw new Error('Invalid user data received');
          }
          
          // Normalize user data - server returns userType but frontend expects role
          const normalizedUserData = {
            ...userData,
            role: userData.role || userData.userType
          };
          
          setUser(normalizedUserData as User);
          
          // Set axios default header for all future requests
          axios.defaults.headers.common['x-auth-token'] = token;
        } catch (error: unknown) {
          console.error('Error fetching user:', error);
          // Clear auth data on error
          localStorage.removeItem(TOKEN_STORAGE_KEY);
          localStorage.removeItem(USER_STORAGE_KEY);
          // Clear axios default header
          delete axios.defaults.headers.common['x-auth-token'];
        }
      }
      setIsLoading(false);
    };

    fetchCurrentUser();
    
    // Set up interceptor to handle 401 responses (expired or invalid token)
    const interceptor = axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response && error.response.status === 401) {
          // Auto logout on 401 Unauthorized
          localStorage.removeItem(TOKEN_STORAGE_KEY);
          localStorage.removeItem(USER_STORAGE_KEY);
          setUser(null);
          delete axios.defaults.headers.common['x-auth-token'];
          toast.error('Your session has expired. Please log in again.');
        }
        return Promise.reject(error);
      }
    );
    
    // Clean up interceptor on unmount
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  // Real login function that makes an API call
  const login = async (email: string, password: string, role: UserRole): Promise<void> => {
    setIsLoading(true);
    console.log('Attempting to login user:', { email, role });
    
    try {
      // Log the request being made
      console.log('Making login request to:', `${API_URL}/auth/login`);
      console.log('With data:', { email, password: '***', userType: role });
      
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
        userType: role
      });
      
      console.log('Login response received:', response.status);
      console.log('Login response data:', response.data);
      
      const { token, user: userData } = response.data;
      
      // Verify user data has required fields
      if (!userData || !userData.id) {
        throw new Error('Invalid user data received from server');
      }
      
      // Check if userType is present instead of role (server uses userType)
      if (!userData.userType && !userData.role) {
        throw new Error('User role information missing');
      }
      
      // Normalize user data - server returns userType but frontend expects role
      const normalizedUserData = {
        ...userData,
        role: userData.role || userData.userType
      };
      
      // Set user in state with normalized data
      setUser(normalizedUserData as User);
      
      // Store auth data with normalized user data
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(normalizedUserData));
      
      // Set authorization header for future requests
      axios.defaults.headers.common['x-auth-token'] = token;
      
      toast.success('Successfully logged in!');
    } catch (error: unknown) {
      console.error('Login error:', error);
      
      if (axios.isAxiosError(error)) {
        console.error('API Error Response:', error.response?.data);
        console.error('API Error Status:', error.response?.status);
        
        const errorMessage = error.response?.data?.message
          ? error.response.data.message
          : 'Login failed. Please check your credentials.';
        
        toast.error(errorMessage);
        throw new Error(errorMessage);
      } else {
        console.error('Non-Axios error:', error);
        toast.error('Login failed. Please check your credentials.');
        throw new Error('Login failed. Please check your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Real register function that makes an API call
  const register = async (name: string, email: string, password: string, role: UserRole): Promise<void> => {
    setIsLoading(true);
    console.log('Attempting to register user:', { name, email, role });
    
    try {
      // Log the request being made
      console.log('Making signup request to:', `${API_URL}/auth/signup`);
      console.log('With data:', { name, email, password: '***', userType: role });
      
      const response = await axios.post(`${API_URL}/auth/signup`, {
        name,
        email,
        password,
        userType: role
      });
      
      console.log('Signup response received:', response.status);
      console.log('Signup response data:', response.data);
      
      const { token, user: userData } = response.data;
      
      // Verify user data has required fields
      if (!userData || !userData.id) {
        throw new Error('Invalid user data received from server');
      }
      
      // Check if userType is present instead of role (server uses userType)
      if (!userData.userType && !userData.role) {
        throw new Error('User role information missing');
      }
      
      // Normalize user data - server returns userType but frontend expects role
      const normalizedUserData = {
        ...userData,
        role: userData.role || userData.userType
      };
      
      // Set user in state with normalized data
      setUser(normalizedUserData as User);
      
      // Store auth data with normalized user data
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(normalizedUserData));
      
      // Set authorization header for future requests
      axios.defaults.headers.common['x-auth-token'] = token;
      
      toast.success('Account created successfully!');
    } catch (error: unknown) {
      console.error('Registration error:', error);
      
      if (axios.isAxiosError(error)) {
        console.error('API Error Response:', error.response?.data);
        console.error('API Error Status:', error.response?.status);
        
        const errorMessage = error.response?.data?.message
          ? error.response.data.message
          : 'Registration failed. Please try again.';
        
        toast.error(errorMessage);
        throw new Error(errorMessage);
      } else {
        console.error('Non-Axios error:', error);
        toast.error('Registration failed. Please try again.');
        throw new Error('Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Mock forgot password function
  const forgotPassword = async (email: string): Promise<void> => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if user exists
      const user = users.find(u => u.email === email);
      if (!user) {
        throw new Error('No account found with this email');
      }
      
      // Generate reset token (in a real app, this would be a secure token)
      const resetToken = Math.random().toString(36).substring(2, 15);
      localStorage.setItem(RESET_TOKEN_KEY, resetToken);
      
      // In a real app, this would send an email
      toast.success('Password reset instructions sent to your email');
    } catch (error: unknown) {
      toast.error((error as Error).message);
      throw error;
    }
  };

  // Mock reset password function
  const resetPassword = async (token: string, newPassword: string): Promise<void> => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verify token
      const storedToken = localStorage.getItem(RESET_TOKEN_KEY);
      if (token !== storedToken) {
        throw new Error('Invalid or expired reset token');
      }
      
      // In a real app, this would update the user's password in the database
      localStorage.removeItem(RESET_TOKEN_KEY);
      toast.success('Password reset successfully');
    } catch (error: unknown) {
      toast.error((error as Error).message);
      throw error;
    }
  };

  // Logout function
  const logout = (): void => {
    // Clear user state
    setUser(null);
    
    // Clear local storage
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    
    // Clear authorization header
    delete axios.defaults.headers.common['x-auth-token'];
    
    toast.success('Logged out successfully');
  };

  // Update user profile using the secure API endpoint
  const updateProfile = async (userId: string, updates: Partial<User>): Promise<void> => {
    try {
      // Get token from storage
      const token = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (!token) {
        throw new Error('Authentication required');
      }
      
      // Call the profile update API
      const response = await axios.put(
        `${API_URL}/profile`,
        updates,
        {
          headers: {
            'x-auth-token': token
          }
        }
      );
      
      // Get updated user data from response
      const updatedUser = response.data as User;
      
      // Update user in state
      setUser(updatedUser);
      
      // Update local storage
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      
      toast.success('Profile updated successfully');
    } catch (error: unknown) {
      console.error('Profile update error:', error);
      
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message
          ? error.response.data.message
          : 'Failed to update profile. Please try again.';
        
        toast.error(errorMessage);
        throw new Error(errorMessage);
      } else {
        toast.error('Failed to update profile. Please try again.');
        throw error;
      }
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    updateProfile,
    isAuthenticated: !!user,
    isLoading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook for using auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};