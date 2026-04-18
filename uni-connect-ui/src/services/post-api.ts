import axios from "axios";
import { getEnv } from "../env";

const API_URL = `${getEnv().API_URL}/posts`;

// Helper to generate auth headers
const getAuthConfig = (token: string) => ({
    headers: {
        Authorization: `Bearer ${token}`
    }
});

export const getAllPosts = async (token: string) => {
    try {
        return await axios.get(API_URL, getAuthConfig(token));
    } catch (error) {
        throw error;
    }
};

export const getPostsByUser = async (userId: number, token: string) => {
    try {
        return await axios.get(`${API_URL}/${userId}`, getAuthConfig(token));
    } catch (error) {
        throw error;
    }
};

export const getSavedPostsByUser = async (userId: number, token: string) => {
    try {
        return await axios.get(`${API_URL}/save/${userId}`, getAuthConfig(token));
    } catch (error) {
        throw error;
    }
};

export const createPost = async (data: any, token: string) => {
    try {
        const form = new FormData();

        if (data.caption) form.append("Caption", data.caption);
        if (data.category) form.append("Category", data.category);
        if (typeof data.userId === "number") {
            form.append("UserId", String(data.userId));
        }

        (data.images ?? [])
            .slice(0, 5)
            .forEach((file: File) => form.append("Images", file));

        return await axios.post(API_URL, form, {
            headers: {
                ...getAuthConfig(token).headers,
                "Content-Type": "multipart/form-data"
            }
        });
    } catch (error) {
        throw error;
    }
};

export const deletePost = async (
    postId: number,
    userId: number,
    token: string
) => {
    try {
        return await axios.delete(
            `${API_URL}/${postId}/user/${userId}`,
            getAuthConfig(token)
        );
    } catch (error) {
        throw error;
    }
};

export const savePost = async (
    postId: number,
    userId: number,
    type: string,
    token: string
) => {
    try {
        return await axios.put(
            `${API_URL}/${postId}/user/${userId}/${type}`,
            {},
            getAuthConfig(token)
        );
    } catch (error) {
        throw error;
    }
};