import axios from "axios";
import { getEnv } from "../env";

const API_URL = getEnv().API_URL + "/auth";

export const getUserByEmail = async (email: string) => {
    try {
        const response = await axios.get(`${API_URL}/get-user?email=${email}`);
        return response;
    } catch (error) {
        throw error;
    }
}

export const getUsers = async () => {
    try {
        const response = await axios.get(`${API_URL}/get-users`);
        return response;
    } catch (error) {
        throw error;
    }
}

export const GetCoreUserByEmail = async (email: string) => {
    try {
        const response = await axios.get(`${API_URL}/get-core-user?email=${email}`);
        return response;
    } catch (error) {
        throw error;
    }
}

export const createUser = async (userData: any) => {
    try {
        const response = await axios.post(`${API_URL}/register`, userData);
        return response;
    } catch (error) {
        throw error;
    }
}

export const loginUser = async (loginData: any) => {
    try {
        const response = await axios.post(`${API_URL}/login`, loginData);
        return response;
    } catch (error) {
        throw error;
    }
}