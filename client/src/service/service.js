
import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

export async function loginUser(credentials) {
  const response = await API.post("/auth/login", credentials);
  return response.data;
}

export async function registerUser(userData) {
  const response = await API.post("/auth/register", userData);
  return response.data;
}
