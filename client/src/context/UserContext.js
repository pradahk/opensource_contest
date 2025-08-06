import React, { createContext, useContext, useReducer, useEffect } from "react";
import { authAPI, utils } from "../services/api";

// 초기 상태
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// 액션 타입
const USER_ACTIONS = {
  LOGIN_START: "LOGIN_START",
  LOGIN_SUCCESS: "LOGIN_SUCCESS",
  LOGIN_FAILURE: "LOGIN_FAILURE",
  LOGOUT: "LOGOUT",
  UPDATE_USER: "UPDATE_USER",
  SET_LOADING: "SET_LOADING",
  CLEAR_ERROR: "CLEAR_ERROR",
};

// 리듀서
const userReducer = (state, action) => {
  switch (action.type) {
    case USER_ACTIONS.LOGIN_START:
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case USER_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case USER_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };

    case USER_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };

    case USER_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };

    case USER_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };

    case USER_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
};

// Context 생성
const UserContext = createContext();

// Provider 컴포넌트
export const UserProvider = ({ children }) => {
  const [state, dispatch] = useReducer(userReducer, initialState);

  // 앱 시작 시 토큰 검증
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem("token");
      const user = utils.getUser();

      if (token && utils.isTokenValid() && user) {
        dispatch({
          type: USER_ACTIONS.LOGIN_SUCCESS,
          payload: { user, token },
        });
      } else {
        // 토큰이 유효하지 않으면 제거
        if (token) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
        dispatch({ type: USER_ACTIONS.SET_LOADING, payload: false });
      }
    };

    initializeAuth();
  }, []);

  // 로그인 함수
  const login = async (email, password) => {
    try {
      dispatch({ type: USER_ACTIONS.LOGIN_START });

      const response = await authAPI.login({ email, password });

      // 토큰과 사용자 정보 저장
      localStorage.setItem("token", response.token);
      utils.setUser(response.user);

      dispatch({
        type: USER_ACTIONS.LOGIN_SUCCESS,
        payload: {
          user: response.user,
          token: response.token,
        },
      });

      return { success: true };
    } catch (error) {
      const errorMessage = utils.getErrorMessage(error);
      dispatch({
        type: USER_ACTIONS.LOGIN_FAILURE,
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  };

  // 회원가입 함수
  const register = async (userData) => {
    try {
      dispatch({ type: USER_ACTIONS.LOGIN_START });

      const response = await authAPI.register(userData);

      dispatch({ type: USER_ACTIONS.SET_LOADING, payload: false });
      return { success: true, message: response.message };
    } catch (error) {
      const errorMessage = utils.getErrorMessage(error);
      dispatch({
        type: USER_ACTIONS.LOGIN_FAILURE,
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  };

  // 로그아웃 함수
  const logout = () => {
    authAPI.logout();
    dispatch({ type: USER_ACTIONS.LOGOUT });
  };

  // 사용자 정보 업데이트
  const updateUser = (userData) => {
    dispatch({
      type: USER_ACTIONS.UPDATE_USER,
      payload: userData,
    });
    utils.setUser({ ...state.user, ...userData });
  };

  // 에러 초기화
  const clearError = () => {
    dispatch({ type: USER_ACTIONS.CLEAR_ERROR });
  };

  // 로딩 상태 설정
  const setLoading = (isLoading) => {
    dispatch({ type: USER_ACTIONS.SET_LOADING, payload: isLoading });
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    updateUser,
    clearError,
    setLoading,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

// Hook
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

export default UserContext;
