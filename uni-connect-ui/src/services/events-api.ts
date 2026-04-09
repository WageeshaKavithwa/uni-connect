import axios from "axios";
import { getEnv } from "../env";

const API_URL = `${getEnv().API_URL}/Event`;

const getAuthHeaders = (token: string, isMultipart = false) => ({
    headers: {
        ...(isMultipart && { "Content-Type": "multipart/form-data" }),
        Authorization: `Bearer ${token}`,
    },
});

export const createEvent = async (eventData: any, token: string) => {
    try {
        const form = new FormData();

        if (eventData?.EventName) form.append("EventName", eventData.EventName);
        if (eventData?.EventDate) form.append("EventDate", eventData.EventDate);
        if (eventData?.Description) form.append("Description", eventData.Description);
        if (eventData?.Location) form.append("Location", eventData.Location);
        if (typeof eventData?.UserId === "number") form.append("UserId", String(eventData.UserId));
        if (eventData?.SpecialNote) form.append("SpecialNote", eventData.SpecialNote);

        if (eventData?.Thumbnail instanceof File) {
            form.append("Thumbnail", eventData.Thumbnail);
        }

        const response = await axios.post(API_URL, form, getAuthHeaders(token, true));
        return response;
    } catch (error) {
        throw error;
    }
};

export const getEvents = async (token: string) => {
    try {
        const response = await axios.get(API_URL, getAuthHeaders(token));
        return response;
    } catch (error) {
        throw error;
    }
};

export const getEventsByUser = async (userId: number, token: string) => {
    try {
        const response = await axios.get(`${API_URL}/${userId}`, getAuthHeaders(token));
        return response;
    } catch (error) {
        throw error;
    }
};

export const deleteEvent = async (eventId: number, userId: number, token: string) => {
    try {
        const response = await axios.delete(`${API_URL}/${eventId}/${userId}`, getAuthHeaders(token));
        return response;
    } catch (error) {
        throw error;
    }
};