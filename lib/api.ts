import * as SecureStore from "expo-secure-store";
import axios from "axios";
import { API_URL } from "../constants";

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  countryCode: number;
  mobileNumber: string;
}

interface VerifyOtpData {
  otp: string;
  email: string | null;
  phone: string | null;
}

class Api {
  private buildHeaders(token?: string, customHeaders?: any): any {
    return {
      ...(token && { Authorization: `Bearer ${token}` }),
      ...customHeaders,
    };
  }

  async get(url: string, params?: any, token?: string, headers?: any) {
    const response = await axios.get(`${API_URL}${url}`, {
      params,
      headers: this.buildHeaders(token, headers),
    });
    return response.data;
  }

  async post(url: string, data: any, token?: string, params?: any, headers?: any) {
    const response = await axios.post(`${API_URL}${url}`, data, {
      params,
      headers: this.buildHeaders(token, headers),
    });
    return response.data;
  }

  async put(url: string, data: any, token?: string, params?: any, headers?: any) {
    const response = await axios.put(`${API_URL}${url}`, data, {
      params,
      headers: this.buildHeaders(token, headers),
    });
    return response.data;
  }

  async patch(url: string, data: any, token?: string, params?: any, headers?: any) {
    const response = await axios.patch(`${API_URL}${url}`, data, {
      params,
      headers: this.buildHeaders(token, headers),
    });
    return response.data;
  }

  async delete(url: string, token?: string, params?: any, headers?: any) {
    const response = await axios.delete(`${API_URL}${url}`, {
      params,
      headers: this.buildHeaders(token, headers),
    });
    return response.data;
  }
}

class ApiService {
  private api = new Api();

  async registerUser(data: RegisterData) {
    return this.api.post(
      'api/users/register',
      data,
      undefined,
      undefined,
      { 'Content-Type': 'application/json' }
    );
  }

  async loginUser(data: LoginData) {
    try {
      const response = await this.api.post(
        'api/users/login',
        data,
        undefined,
        undefined,
        { 'Content-Type': 'application/json' }
      );

      const token = response.token;
      if (token) {
        await SecureStore.setItemAsync('auth_token', token);
      }

      return response;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  async logoutUser() {
    await SecureStore.deleteItemAsync('auth_token');
  }

  async verifyOtp(data: VerifyOtpData) {
    try {
      const response = await this.api.post(
        'api/users/verify-otp',
        data,
        undefined,
        undefined,
        { 'Content-Type': 'application/json' }
      );

      const token = response.token;
      if (token) {
        await SecureStore.setItemAsync('auth_token', token);
      }
      return response;
    } catch (error) {
      console.error('OTP verification failed:', error);
      throw error;
    }
  }
}

const apiService = new ApiService();

export default apiService;