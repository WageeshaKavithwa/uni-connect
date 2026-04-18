import axios from "axios";
import { getEnv } from "../env";

const API_URL = `${getEnv().API_URL}/auth`;

const handleGetRequest = async (endpoint: string) => {
    try {
        const response = await axios.get(`${API_URL}${endpoint}`);
        return response;
    } catch (error) {
        throw error;
    }
};

const handlePostRequest = async (endpoint: string, data: any) => {
    try {
        const response = await axios.post(`${API_URL}${endpoint}`, data);
        return response;
    } catch (error) {
        throw error;
    }
};

export const getUserByEmail = async (email: string) => {
    return handleGetRequest(`/get-user?email=${email}`);
};

export const getUsers = async () => {
    return handleGetRequest("/get-users");
};

export const GetCoreUserByEmail = async (email: string) => {
    return handleGetRequest(`/get-core-user?email=${email}`);
};

export const createUser = async (userData: any) => {
    return handlePostRequest("/register", userData);
};

export const loginUser = async (loginData: any) => {
    return handlePostRequest("/login", loginData);
};