import axios from "axios";
import { getEnv } from "../env";

const API_URL = getEnv().API_URL + "/items"

export const getAllItems = async (token: string) => {
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

export const getItemsByUser = async (userId: number, token: string) => {
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
}

export const createItem = async (itemData: any, token: string) => {
    try {
        const form = new FormData();

        if (itemData.title) form.append("Name", itemData.title);
        if (itemData.description) form.append("Description", itemData.description);
        if (itemData.price) form.append("Price", String(itemData.price));
        if (typeof itemData.userId === "number") form.append("UserId", String(itemData.userId));
        if (itemData.images && itemData.images.length > 0) {
            const files = (itemData.images ?? []).slice(0, 5);
            for (const file of files) {
                form.append("Images", file);
            }
        }
        const response = await axios.post(`${API_URL}`, form, {
            headers: { 
                "Content-Type": "multipart/form-data",
                Authorization: `Bearer ${token}`
            }
        });
        return response;
    } catch (error) {
        throw error;
    }
}

export const deleteItem = async (itemId: number, token: string) => {
    try {
        const response = await axios.delete(`${API_URL}/${itemId}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response;
    } catch (error) {
        throw error;
    }
}