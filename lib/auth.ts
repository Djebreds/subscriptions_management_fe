import api from "./api";
import axios from "axios";

export async function login(username: string, password: string) {
  const res = await api.post("auth/login", { username, password });

  console.log(res);

  const { access, refresh, user } = res.data;

  localStorage.setItem("access", access);
  localStorage.setItem("refresh", refresh);

  return user;
}

export async function register(
  firstName: string,
  lastName: string,
  username: string,
  password: string
) {
  const res = await api.post("auth/register", {
    firstName,
    lastName,
    username,
    password,
  });

  console.log(res);

  return res.data;
}

export async function registerAndLogin(
  firstName: string,
  lastName: string,
  username: string,
  password: string
) {
  await register(firstName, lastName, username, password);

  return await login(username, password);
}

export async function refreshToken(): Promise<string> {
  const refreshToken = localStorage.getItem("refresh");

  if (!refreshToken) throw new Error("No refresh token available");

  const res = await axios.post(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/token/refresh`,
    { refresh: refreshToken }
  );

  const { access } = res.data;

  localStorage.setItem("access", access);

  return access;
}

export function logout() {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
}

export async function currentUser() {
  try {
    const { data } = await api.get("auth/me");
    return { data };
  } catch (error: unknown) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "An unknown error occurred" };
  }
}
