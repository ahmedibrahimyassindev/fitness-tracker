import * as authService from "../services/auth.service.js";

export async function register(req, res, next) {
  try {
    const result = await authService.registerUser(req.body);
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const result = await authService.loginUser(req.body);
    res.status(200).json({
      success: true,
      message: "Logged in successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(req, res, next) {
  try {
    res.status(200).json({
      success: true,
      message: "Logged out successfully"
    });
  } catch (error) {
    next(error);
  }
}

