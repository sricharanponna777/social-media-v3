import axios from "axios";
import { API_URL } from "../constants";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Visibility = 'public' | 'private' | 'friends';

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  countryCode: number;
  mobileNumber: string;
}

export interface VerifyOtpData {
  otp: string;
  email: string | null;
}

export interface CreatePostData {
  caption: string;
  media: string[];
  visibility: Visibility;
}

export interface CreateStoryData {
  mediaUrl: string;
  mediaType: 'image' | 'video';
  caption?: string;
  duration?: number;
}

export interface ViewStoryData {
  viewDuration?: number;
  completed?: boolean;
  deviceInfo?: any;
  locationData?: any;
}

class Api {
  private buildHeaders(token?: string, customHeaders?: any): any {
    return {
      ...(token && { Authorization: `Bearer ${token}` }),
      ...customHeaders,
    };
  }

  async get(url: string, params?: any, token?: string, headers?: any) {
    const response = await axios.get(`${API_URL}/${url}`, {
      params,
      headers: this.buildHeaders(token, headers),
    });
    return response.data;
  }

  async post(url: string, data: any, token?: string, params?: any, headers?: any) {
    const response = await axios.post(`${API_URL}/${url}`, data, {
      params,
      headers: this.buildHeaders(token, headers),
    });
    return response.data;
  }

  async put(url: string, data: any, token?: string, params?: any, headers?: any) {
    const response = await axios.put(`${API_URL}/${url}`, data, {
      params,
      headers: this.buildHeaders(token, headers),
    });
    return response.data;
  }

  async patch(url: string, data: any, token?: string, params?: any, headers?: any) {
    const response = await axios.patch(`${API_URL}/${url}`, data, {
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
  
  // ---------------------------USER ROUTES---------------------------
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
        await AsyncStorage.setItem('auth_token', token);
        console.log('Token:', token);
      }

      return response;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
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
      await AsyncStorage.setItem('auth_token', response.token);
      return response;
    } catch (error) {
      console.error('OTP verification failed:', error);
      throw error;
    }
  }

  async validateToken(data: any) {  
    try {
      const token = await AsyncStorage.getItem('auth_token');
      console.log('Token:', token);
      if (!token) {
        throw new Error('No auth token found');
      }
      const response = await this.api.post(
        'api/users/verify-token',
        data,
        token,
        undefined,
        { 'Content-Type': 'application/json' }
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  // ---------------------------UPLOAD ROUTES---------------------------
  async uploadImage(data: FormData) {
    try {
      const auth_token = await AsyncStorage.getItem('auth_token');
      if (!auth_token) {
        throw new Error('No auth token found');
      }
      const response = await this.api.post(
        'api/uploads/image',
        data,
        auth_token,
        undefined
      );
      console.log(response)
      return response;
    } catch (error) {
      console.error('Image upload failed:', error);
      throw error;
    }
  }

  async uploadVideo(data: FormData) {
    try {
      const auth_token = await AsyncStorage.getItem('auth_token');
      if (!auth_token) {
        throw new Error('No auth token found');
      }
      const response = await this.api.post(
        'api/uploads/video',
        data,
        auth_token,
        undefined,
        { 'Content-Type': 'multipart/form-data' }
      );
      return response;
    } catch (error) {
      console.error('Video upload failed:', error);
      throw error;
    }
  }

  // ---------------------------POST ROUTES---------------------------
  async createPost(data: CreatePostData) {
    try {
      const auth_token = await AsyncStorage.getItem('auth_token');
      if (!auth_token) {
        throw new Error('No auth token found');
      }
      const response = await this.api.post(
        'api/posts',
        data,
        auth_token,
        undefined,
        { 'Content-Type': 'application/json' }
      );
      return response;
    } catch (error) {
      console.error('Post creation failed:', error);
      throw error;
    }
  }

  async getFeed(page: number, limit: number) {
    try {
      const auth_token = await AsyncStorage.getItem('auth_token')
      if (!auth_token) {
        throw new Error("No auth token found")
      }
      const response = await this.api.get(
        'api/posts/feed',
        {
          page,
          limit,
        },
        auth_token,
      )
      response.page = page
      response.limit = limit
      return response
    } catch (error) {
      console.error('Feed retrieval failed:', error);
      throw error;
    }
  }

  // ---------------------------STORY ROUTES---------------------------
  async createStory(data: CreateStoryData) {
    try {
      const auth_token = await AsyncStorage.getItem('auth_token');
      if (!auth_token) {
        throw new Error('No auth token found');
      }
      const response = await this.api.post(
        'api/stories',
        data,
        auth_token,
        undefined,
        { 'Content-Type': 'application/json' }
      );
      return response;
    } catch (error) {
      console.error('Story creation failed:', error);
      throw error;
    }
  }

  async getFeedStories() {
    try {
      const auth_token = await AsyncStorage.getItem('auth_token');
      if (!auth_token) {
        throw new Error('No auth token found');
      }
      return this.api.get('api/stories/feed', undefined, auth_token);
    } catch (error) {
      console.error('Failed to fetch stories:', error);
      throw error;
    }
  }

  async getStory(id: string) {
    try {
      const auth_token = await AsyncStorage.getItem('auth_token');
      if (!auth_token) {
        throw new Error('No auth token found');
      }
      return this.api.get(`api/stories/${id}`, undefined, auth_token);
    } catch (error) {
      console.error('Failed to fetch story:', error);
      throw error;
    }
  }

  async viewStory(id: string, data: ViewStoryData) {
    try {
      const auth_token = await AsyncStorage.getItem('auth_token');
      if (!auth_token) {
        throw new Error('No auth token found');
      }
      return this.api.post(
        `api/stories/${id}/view`,
        data,
        auth_token,
        undefined,
        { 'Content-Type': 'application/json' }
      );
    } catch (error) {
      console.error('Failed to record story view:', error);
      throw error;
    }
  }

  // ---------------------------FRIEND ROUTES---------------------------
  async getFriends() {
    try {
      const auth_token = await AsyncStorage.getItem('auth_token');
      if (!auth_token) {
        throw new Error('No auth token found');
      }
      return this.api.get('api/friends', undefined, auth_token);
    } catch (error) {
      console.error('Failed to fetch friends:', error);
      throw error;
    }
  }

  async getFriendRequests() {
    try {
      const auth_token = await AsyncStorage.getItem('auth_token');
      if (!auth_token) {
        throw new Error('No auth token found');
      }
      return this.api.get('api/friends/requests', undefined, auth_token);
    } catch (error) {
      console.error('Failed to fetch friend requests:', error);
      throw error;
    }
  }

  async sendFriendRequest(receiverId: string) {
    try {
      const auth_token = await AsyncStorage.getItem('auth_token');
      if (!auth_token) {
        throw new Error('No auth token found');
      }
      return this.api.post(
        'api/friends/request',
        { receiverId },
        auth_token,
        undefined,
        { 'Content-Type': 'application/json' }
      );
    } catch (error) {
      console.error('Failed to send friend request:', error);
      throw error;
    }
  }

  async acceptFriendRequest(requestId: string) {
    try {
      const auth_token = await AsyncStorage.getItem('auth_token');
      if (!auth_token) {
        throw new Error('No auth token found');
      }
      return this.api.post(
        `api/friends/request/${requestId}/accept`,
        {},
        auth_token,
        undefined,
        { 'Content-Type': 'application/json' }
      );
    } catch (error) {
      console.error('Failed to accept friend request:', error);
      throw error;
    }
  }

  async rejectFriendRequest(requestId: string) {
    try {
      const auth_token = await AsyncStorage.getItem('auth_token');
      if (!auth_token) {
        throw new Error('No auth token found');
      }
      return this.api.post(
        `api/friends/request/${requestId}/reject`,
        {},
        auth_token,
        undefined,
        { 'Content-Type': 'application/json' }
      );
    } catch (error) {
      console.error('Failed to reject friend request:', error);
      throw error;
    }
  }

  async removeFriend(friendshipId: string) {
    try {
      const auth_token = await AsyncStorage.getItem('auth_token');
      if (!auth_token) {
        throw new Error('No auth token found');
      }
      return this.api.delete(`api/friends/${friendshipId}`, auth_token);
    } catch (error) {
      console.error('Failed to remove friend:', error);
      throw error;
    }
  }

  async blockFriend(friendshipId: string) {
    try {
      const auth_token = await AsyncStorage.getItem('auth_token');
      if (!auth_token) {
        throw new Error('No auth token found');
      }
      return this.api.post(
        `api/friends/${friendshipId}/block`,
        {},
        auth_token,
        undefined,
        { 'Content-Type': 'application/json' }
      );
    } catch (error) {
      console.error('Failed to block friend:', error);
      throw error;
    }
  }

  async checkFriendshipStatus(otherUserId: string) {
    try {
      const auth_token = await AsyncStorage.getItem('auth_token');
      if (!auth_token) {
        throw new Error('No auth token found');
      }
      return this.api.get(`api/friends/status/${otherUserId}`, undefined, auth_token);
    } catch (error) {
      console.error('Failed to check friendship status:', error);
      throw error;
    }
  }
}

const apiService = new ApiService();

export default apiService;
