import axios, { AxiosError } from "axios";
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
  mediaBase64: string;
  mediaType: 'image' | 'video';
  caption?: string;
  mimeType?: string;
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

  async delete(url: string, token?: string, params?: any, headers?: any, data?: any) {
    const response = await axios.delete(`${API_URL}/${url}`, {
      params,
      data,
      headers: this.buildHeaders(token, headers),
    });
    return response.data;
  }
}

class ApiService {
  private api = new Api();
  
  // ---------------------------MESSAGE/CHAT ROUTES---------------------------
  async createConversation(data: { title?: string; participants: string[]; type?: 'private' | 'group' }) {
    try {
      const auth_token = await AsyncStorage.getItem('auth_token');
      if (!auth_token) throw new Error('No auth token found');
      return this.api.post('api/messages/conversations', data, auth_token, undefined, {
        'Content-Type': 'application/json',
      });
    } catch (error) {
      console.error('Failed to create conversation:', error);
      throw error;
    }
  }

  async getConversations(page: number = 1, limit: number = 20) {
    try {
      const auth_token = await AsyncStorage.getItem('auth_token');
      if (!auth_token) throw new Error('No auth token found');
      return this.api.get('api/messages/conversations', { page, limit }, auth_token);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      throw error;
    }
  }

  async getMessages(conversationId: string, page: number = 1, limit: number = 50) {
    try {
      const auth_token = await AsyncStorage.getItem('auth_token');
      if (!auth_token) throw new Error('No auth token found');
      return this.api.get(`api/messages/conversations/${conversationId}`, { page, limit }, auth_token);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      throw error;
    }
  }

  async sendMessage(conversationId: string, content: string, file?: { uri: string; name: string; type: string }) {
    try {
      const auth_token = await AsyncStorage.getItem('auth_token');
      if (!auth_token) throw new Error('No auth token found');
      if (file) {
        const form = new FormData();
        form.append('content', content);
        form.append('file', {
          // @ts-ignore RN FormData file
          uri: file.uri,
          name: file.name,
          type: file.type,
        });
        return this.api.post(`api/messages/conversations/${conversationId}`, form, auth_token);
      }
      return this.api.post(
        `api/messages/conversations/${conversationId}`,
        { content },
        auth_token,
        undefined,
        { 'Content-Type': 'application/json' }
      );
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }

  async getUnreadCounts() {
    try {
      const auth_token = await AsyncStorage.getItem('auth_token');
      if (!auth_token) throw new Error('No auth token found');
      return this.api.get('api/messages/unread', undefined, auth_token);
    } catch (error) {
      console.error('Failed to fetch unread counts:', error);
      throw error;
    }
  }

  async deleteMessage(messageId: string) {
    try {
      const auth_token = await AsyncStorage.getItem('auth_token');
      if (!auth_token) throw new Error('No auth token found');
      return this.api.delete(`api/messages/${messageId}`, auth_token);
    } catch (error) {
      console.error('Failed to delete message:', error);
      throw error;
    }
  }

  // ---------------------------REELS ROUTES---------------------------
  async getPersonalizedReels(page: number = 1, limit: number = 10) {
    try {
      const auth_token = await AsyncStorage.getItem('auth_token');
      if (!auth_token) throw new Error('No auth token found');
      return this.api.get('api/reels/feed/personalized', { page, limit }, auth_token);
    } catch (error) {
      console.error('Failed to fetch personalized reels:', error);
      throw error;
    }
  }

  async getTrendingReels(page: number = 1, limit: number = 10) {
    try {
      const auth_token = await AsyncStorage.getItem('auth_token');
      if (!auth_token) throw new Error('No auth token found');
      return this.api.get('api/reels/discover/trending', { page, limit }, auth_token);
    } catch (error) {
      console.error('Failed to fetch trending reels:', error);
      throw error;
    }
  }

  async trackReelView(reelId: string, watchDuration: number) {
    try {
      const auth_token = await AsyncStorage.getItem('auth_token');
      if (!auth_token) throw new Error('No auth token found');
      // backend expects body { duration }
      return this.api.post(`api/reels/${reelId}/view`, { duration: watchDuration }, auth_token, undefined, {
        'Content-Type': 'application/json',
      });
    } catch (error) {
      console.error('Failed to track reel view:', error);
      throw error;
    }
  }

  async commentOnReel(reelId: string, content: string) {
    try {
      const auth_token = await AsyncStorage.getItem('auth_token');
      if (!auth_token) throw new Error('No auth token found');
      return this.api.post(`api/reels/${reelId}/comments`, { content }, auth_token, undefined, {
        'Content-Type': 'application/json',
      });
    } catch (error) {
      console.error('Failed to comment on reel:', error);
      throw error;
    }
  }
  
  async getReelComments(reelId: string, page: number = 1, limit: number = 50) {
    try {
      const auth_token = await AsyncStorage.getItem('auth_token');
      if (!auth_token) throw new Error('No auth token found');
      return this.api.get(`api/reels/${reelId}/comments`, { page, limit }, auth_token);
    } catch (error) {
      console.error('Failed to fetch reel comments:', error);
      throw error;
    }
  }

  async reactToReel(reelId: string, type: 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry') {
    try {
      const auth_token = await AsyncStorage.getItem('auth_token');
      if (!auth_token) throw new Error('No auth token found');
      return this.api.post(
        `api/reels/${reelId}/reactions`,
        { type },
        auth_token,
        undefined,
        { 'Content-Type': 'application/json' }
      );
    } catch (error) {
      console.error('Failed to react to reel:', error);
      // Don't throw to keep UI responsive even if backend missing.
      return { ok: false } as any
    }
  }
  
  async createReel(data: {
    media_url: string;
    thumbnail_url?: string | null;
    duration?: number | null;
    caption?: string | null;
    music_track_url?: string | null;
    music_track_name?: string | null;
    music_artist_name?: string | null;
  }) {
    try {
      const auth_token = await AsyncStorage.getItem('auth_token');
      if (!auth_token) throw new Error('No auth token found');
      return this.api.post('api/reels', data, auth_token, undefined, { 'Content-Type': 'application/json' });
    } catch (error) {
      console.error('Failed to create reel:', error);
      throw error;
    }
  }
  
  // ---------------------------USER ROUTES---------------------------
  async searchUsers(query: string) {
    try {
      const auth_token = await AsyncStorage.getItem('auth_token');
      if (!auth_token) {
        throw new Error('No auth token found');
      }
      return this.api.get('api/users/search', { query }, auth_token);
    } catch (error) {
      console.error('Failed to search users:', error);
      throw error;
    }
  }

  async getProfile(userId: string) {
    try {
      const auth_token = await AsyncStorage.getItem('auth_token');
      if (!auth_token) throw new Error('No auth token found');
      return this.api.get(`api/users/profile/${userId}`, undefined, auth_token)
    } catch (error) {
      console.error('Failed to fetch profile:', error)
      throw error
    }
  }

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

  async getUserPosts(userId: string, page: number = 1, limit: number = 20) {
    try {
      const auth_token = await AsyncStorage.getItem('auth_token')
      if (!auth_token) throw new Error('No auth token found')
      return this.api.get(`api/posts/user/${userId}`, { page, limit }, auth_token)
    } catch (error) {
      console.error('Failed to fetch user posts:', error)
      throw error
    }
  }

  async getPostComments(postId: string, page: number = 1, limit: number = 50) {
    try {
      const auth_token = await AsyncStorage.getItem('auth_token');
      if (!auth_token) throw new Error('No auth token found');
      return this.api.get(`api/posts/${postId}/comments`, { page, limit }, auth_token);
    } catch (error) {
      console.error('Failed to fetch post comments:', error);
      throw error;
    }
  }

  async commentOnPost(postId: string, content: string) {
    try {
      const auth_token = await AsyncStorage.getItem('auth_token');
      if (!auth_token) throw new Error('No auth token found');
      return this.api.post(`api/posts/${postId}/comments`, { content }, auth_token, undefined, {
        'Content-Type': 'application/json',
      });
    } catch (error) {
      console.error('Failed to comment on post:', error);
      throw error;
    }
  }

  async reactToPost(postId: string, type: 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry') {
    try {
      const auth_token = await AsyncStorage.getItem('auth_token');
      if (!auth_token) throw new Error('No auth token found');
      return this.api.post(
        `api/posts/${postId}/reactions`,
        { type },
        auth_token,
        undefined,
        { 'Content-Type': 'application/json' }
      );
    } catch (error) {
      console.error('Failed to react to post:', error);
      return { ok: false } as any
    }
  }

  async reactToComment(commentId: string, type: 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry') {
    try {
      const auth_token = await AsyncStorage.getItem('auth_token');
      if (!auth_token) throw new Error('No auth token found');
      return this.api.post(
        `api/comments/${commentId}/reactions`,
        { type },
        auth_token,
        undefined,
        { 'Content-Type': 'application/json' }
      );
    } catch (error) {
      console.error('Failed to react to comment:', error);
      return { ok: false } as any
    }
  }

  async getReactions(contentType: 'post' | 'comment' | 'story' | 'reel', contentId: string) {
    try {
      const auth_token = await AsyncStorage.getItem('auth_token');
      if (!auth_token) throw new Error('No auth token found');
      return this.api.get(`api/reactions/${contentType}/${contentId}`, undefined, auth_token);
    } catch (error) {
      console.error('Failed to fetch reactions:', error);
      throw error;
    }
  }

  async removeReaction(contentType: 'post' | 'comment' | 'story' | 'reel', contentId: string) {
    try {
      const auth_token = await AsyncStorage.getItem('auth_token');
      if (!auth_token) throw new Error('No auth token found');
      return this.api.delete(`api/reactions/${contentType}/${contentId}`, auth_token);
    } catch (error) {
      console.error('Failed to remove reaction:', error);
      throw error;
    }
  }

  // ---------------------------COMMENTS (NESTED)---------------------------
  async getCommentReplies(commentId: string, page: number = 1, limit: number = 50) {
    try {
      const auth_token = await AsyncStorage.getItem('auth_token');
      if (!auth_token) throw new Error('No auth token found');
      return this.api.get(`api/comments/${commentId}/replies`, { page, limit }, auth_token);
    } catch (error) {
      console.error('Failed to fetch comment replies:', error);
      throw error;
    }
  }

  async replyToComment(commentId: string, content: string) {
    try {
      const auth_token = await AsyncStorage.getItem('auth_token');
      if (!auth_token) throw new Error('No auth token found');
      return this.api.post(
        `api/comments/${commentId}/replies`,
        { content },
        auth_token,
        undefined,
        { 'Content-Type': 'application/json' }
      );
    } catch (error) {
      console.error('Failed to reply to comment:', error);
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
      console.log(response.error)
      return response;
    } catch (error: AxiosError | unknown) {
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

  // ---------------------------STORY REACTIONS---------------------------

  async reactToStory(storyId: string, type: 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry') {
    try {
      const auth_token = await AsyncStorage.getItem('auth_token');
      if (!auth_token) throw new Error('No auth token found');
      return this.api.post(
        `api/stories/${storyId}/reactions`,
        { type },
        auth_token,
        undefined,
        { 'Content-Type': 'application/json' }
      );
    } catch (error) {
      console.error('Failed to react to story:', error);
      return { ok: false } as any
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

  // ---------------------------NOTIFICATION ROUTES---------------------------
  async getNotifications(page: number = 1, limit: number = 20) {
    try {
      const auth_token = await AsyncStorage.getItem('auth_token');
      if (!auth_token) throw new Error('No auth token found');
      return this.api.get('api/notifications', { page, limit }, auth_token);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      throw error;
    }
  }

  async getUnreadNotificationsCount() {
    try {
      const auth_token = await AsyncStorage.getItem('auth_token');
      if (!auth_token) throw new Error('No auth token found');
      return this.api.get('api/notifications/unread', undefined, auth_token);
    } catch (error) {
      console.error('Failed to fetch unread notifications count:', error);
      throw error;
    }
  }

  async markNotificationsRead(notificationIds: string[]) {
    try {
      const auth_token = await AsyncStorage.getItem('auth_token');
      if (!auth_token) throw new Error('No auth token found');
      return this.api.post('api/notifications/read', { notificationIds }, auth_token, undefined, {
        'Content-Type': 'application/json',
      });
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
      throw error;
    }
  }

  async deleteNotifications(notificationIds: string[]) {
    try {
      const auth_token = await AsyncStorage.getItem('auth_token');
      if (!auth_token) throw new Error('No auth token found');
      return this.api.delete('api/notifications', auth_token, undefined, undefined, { notificationIds });
    } catch (error) {
      console.error('Failed to delete notifications:', error);
      throw error;
    }
  }

  async getNotificationPreferences() {
    try {
      const auth_token = await AsyncStorage.getItem('auth_token');
      if (!auth_token) throw new Error('No auth token found');
      return this.api.get('api/notifications/preferences', undefined, auth_token);
    } catch (error) {
      console.error('Failed to get notification preferences:', error);
      throw error;
    }
  }

  async updateNotificationPreferences(preferences: any) {
    try {
      const auth_token = await AsyncStorage.getItem('auth_token');
      if (!auth_token) throw new Error('No auth token found');
      return this.api.put('api/notifications/preferences', { preferences }, auth_token, undefined, {
        'Content-Type': 'application/json',
      });
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
      throw error;
    }
  }
}

const apiService = new ApiService();

export default apiService;
