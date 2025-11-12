import { apiClient } from "./client";
import type {
    UserProfile,
    UpdateProfileDto,
    SetupProfileDto,
    UploadProfilePictureResponse,
} from "./types";

export const profileService = {
    /**
     * Get user profile by user ID
     */
    getUserProfile: (userId: string) => {
        return apiClient.get<UserProfile>(`/api/profile/${userId}`);
    },

    /**
     * Setup user profile (initial profile creation with username)
     */
    setupProfile: (data: SetupProfileDto) => {
        return apiClient.post<UserProfile>("/api/profile/setup", data);
    },

    /**
     * Update current user's profile
     */
    updateProfile: (data: UpdateProfileDto) => {
        return apiClient.patch<UserProfile>("/api/profile", data);
    },

    /**
     * Upload profile picture
     */
    uploadProfilePicture: (file: File) => {
        const response = apiClient.uploadFile<UploadProfilePictureResponse>(
            "/api/profile/picture",
            file
        );

        console.log({ response })
        return response;
    },

    /**
     * Search users by username or email
     */
    searchUsers: (query: string) => {
        return apiClient.get<UserProfile[]>("/api/users/search", {
            params: { q: query },
        });
    },
};
