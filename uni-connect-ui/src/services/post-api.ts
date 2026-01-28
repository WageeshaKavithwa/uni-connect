import axios from "axios";
import { getEnv } from "../env";

const API_URL = getEnv().API_URL + "/posts";

export const getAllPosts = async (token: string) => {
    try {
        const response = await axios.get(`${API_URL}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response;
    } catch (error) {
        throw error;
    }
}

export const getPostsByUser = async (userId: number, token: string) => {
    try {
        const response = await axios.get(`${API_URL}/${userId}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response;
    } catch (error) {
        throw error;
    }
};

export const getSavedPostsByUser = async (userId: number, token: string) => {
    try {
        const response = await axios.get(`${API_URL}/save/${userId}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response;
    } catch (error) {
        throw error;
    }
};

export const createPost = async (data: any, token: string) => {
    try {
        const form = new FormData();

        if (data.caption) form.append("Caption", data.caption);
        if (data.category) form.append("Category", data.category);
        if (typeof data.userId === "number") form.append("UserId", String(data.userId));

        const files = (data.images ?? []).slice(0, 5);
        for (const file of files) {
            form.append("Images", file);
        }

        const response = await axios.post(`${API_URL}`, form, {
            headers: { 
                "Content-Type": "multipart/form-data",
                Authorization: `Bearer ${token}`
            },
        });
        return response;
    } catch (error) {
        throw error;
    }
};

export const deletePost = async (postId: number, userId: number, token: string) => {
    try {
        const response = await axios.delete(`${API_URL}/${postId}/user/${userId}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response;
    }
    catch (error) {
        throw error;
    }
}

export const savePost = async (postId: number, userId: number, type: string, token: string) => {
    try {
        const response = await axios.put(`${API_URL}/${postId}/user/${userId}/${type}`, {}, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response;
    } catch (error) {
        throw error;
    }
}