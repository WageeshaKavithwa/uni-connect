import axios from "axios";
import { getEnv } from "../env";

const API_URL = `${getEnv().API_URL}/Chat`;

const getAuthHeaders = (token: string, extraHeaders = {}) => ({
    headers: {
        Authorization: `Bearer ${token}`,
        ...extraHeaders,
    },
});

export const getAllChats = async (token: string, userId: number) => {
    try {
        const response = await axios.get(
            `${API_URL}/conversations/${userId}`,
            getAuthHeaders(token)
        );
        return response;
    } catch (error) {
        throw error;
    }
};

export const getMessagesByChat = async (token: string, chatId: number) => {
    try {
        const response = await axios.get(
            `${API_URL}/messages/${chatId}`,
            getAuthHeaders(token)
        );
        return response;
    } catch (error) {
        throw error;
    }
};

export const sendMessage = async (token: string, data: any) => {
    try {
        const response = await axios.post(
            `${API_URL}/send`,
            data,
            getAuthHeaders(token, {
                "Content-Type": "multipart/form-data",
            })
        );
        return response;
    } catch (error) {
        throw error;
    }
};

export const markMessagesAsRead = async (token: string, body: any) => {
    try {
        const response = await axios.post(
            `${API_URL}/read`,
            body,
            getAuthHeaders(token)
        );
        return response;
    } catch (error) {
        throw error;
    }
};

export const getUnreadChatCount = async (token: string, userId: number) => {
    try {
        const response = await axios.get(
            `${API_URL}/unread-count/${userId}`,
            getAuthHeaders(token)
        );
        return response;
    } catch (error) {
        throw error;
    }
};

export const checkChatExists = async (
    token: string,
    userId1: number,
    userId2: number
) => {
    try {
        const response = await axios.get(
            `${API_URL}/check-exists/${userId1}/${userId2}`,
            getAuthHeaders(token)
        );
        return response;
    } catch (error) {
        throw error;
    }
};

export const createChat = async (token: string, data: any) => {
    try {
        const response = await axios.post(
            `${API_URL}/create-conversation`,
            data,
            getAuthHeaders(token)
        );
        return response;
    } catch (error) {
        throw error;
    }
};