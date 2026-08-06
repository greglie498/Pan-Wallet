import axios, {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosError,
} from "axios";

import {
  tokenStorage,
  adminTokenStorage,
} from "../storage/token.storage";

const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  "https://gonad-atypical-lather.ngrok-free.dev/api/v1";


// ======================================================
// USER CLIENT
// ======================================================

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    "ngrok-skip-browser-warning": "true",
  },
});


// ======================================================
// ADMIN CLIENT
// ======================================================

export const adminClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    "ngrok-skip-browser-warning": "true",
  },
});


// ======================================================
// ATTACH TOKENS
// ======================================================

apiClient.interceptors.request.use(
  async(config: InternalAxiosRequestConfig)=>{

    const token = await tokenStorage.getAccessToken();

    if(token){
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  }
);


adminClient.interceptors.request.use(
  async(config: InternalAxiosRequestConfig)=>{

    const token = await adminTokenStorage.getAccessToken();

    if(token){
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  }
);


// ======================================================
// REFRESH STATE
// ======================================================

let isRefreshing = false;

let isAdminRefreshing = false;


let failedQueue:any[] = [];
let adminFailedQueue:any[] = [];


const processQueue = (
  queue:any[],
  error:any,
  token:string|null=null
)=>{
  queue.forEach(promise=>{
    if(error){
      promise.reject(error);
    }
    else if(token){
      promise.resolve(token);
    }
  });
  queue.length = 0;

};


let authFailureHandler: (()=>void)|undefined;

export const setAuthFailureHandler = (handler:()=>void)=>{
  authFailureHandler = handler;
};


// ======================================================
// USER RESPONSE INTERCEPTOR
// ======================================================

apiClient.interceptors.response.use(
  response=>response,

  async(error:AxiosError)=>{


  const originalRequest =
  error.config as InternalAxiosRequestConfig & {
    _retry?:boolean;
  };


  if(
    error.response?.status !==401 ||
    originalRequest._retry
  ){
    return Promise.reject(error);
  }



  if(isRefreshing){
    return new Promise((resolve,reject)=>{
      failedQueue.push({
        resolve:(token:string)=>{
          originalRequest.headers.Authorization =
          `Bearer ${token}`;
          resolve(
            apiClient(originalRequest)
          );
        },
        reject
      });

    });

  }

  originalRequest._retry=true;
  isRefreshing=true;

  try{
    const refreshToken =
    await tokenStorage.getRefreshToken();

    if(!refreshToken){
      throw new Error(
        "No refresh token available"
      );
    }

    const response = await axios.post( `${BASE_URL}/auth/refresh`,{ refreshToken } );
    const { accessToken, refreshToken:newRefreshToken } = response.data.data;

    await tokenStorage.setTokens( accessToken, newRefreshToken );
    processQueue( failedQueue, null, accessToken );
    originalRequest.headers.Authorization = `Bearer ${accessToken}`;

    return apiClient(originalRequest);

  }catch(refreshError){
    processQueue( failedQueue, refreshError );
    await tokenStorage.clearTokens();
    authFailureHandler?.();

    return Promise.reject(refreshError);

    } finally{
      isRefreshing=false;
    }
});


// ======================================================
// ADMIN RESPONSE INTERCEPTOR
// ======================================================

adminClient.interceptors.response.use(
  response=>response,
  async(error:AxiosError)=>{

  const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?:boolean; };

    if(
      error.response?.status !==401 ||
      originalRequest._retry
    ) {
      return Promise.reject(error);
    }

    if(isAdminRefreshing){
      return new Promise((resolve,reject)=>{
        adminFailedQueue.push({
          resolve:(token:string)=>{
            originalRequest.headers.Authorization =`Bearer ${token}`;

            resolve( adminClient(originalRequest));
          },
          reject
        });
      });
    }

    originalRequest._retry=true;
    isAdminRefreshing=true;

    try{
      const refreshToken = await adminTokenStorage.getRefreshToken();

      if(!refreshToken){
        throw new Error(
          "No admin refresh token available"
        );
      }
      const response = await axios.post( `${BASE_URL}/admin/refresh`,{ refreshToken });
      const { accessToken, refreshToken:newRefreshToken } = response.data.data;

      await adminTokenStorage.setTokens(
        accessToken,
        newRefreshToken
      );

      processQueue(
        adminFailedQueue,
        null,
        accessToken
      );

      originalRequest.headers.Authorization = `Bearer ${accessToken}`;

      return adminClient(originalRequest);

    } catch(refreshError){
      processQueue(
        adminFailedQueue,
        refreshError
      );
      await adminTokenStorage.clearTokens();
      authFailureHandler?.();
      return Promise.reject(refreshError);
    } finally{
      isAdminRefreshing=false;
    }
});