export interface LoginRequestBody {
    email: string
    password: string
}

export interface RegisterRequestBody {
    name: string
    email: string
    password: string
    confirm_password: string
    location?: { lat: number; lng: number }
}

export interface VerifyEmailRequestBody {
    emailVerifyToken: string
}

export interface ForgotPasswordRequestBody {
    email: string
}

export interface VerifyForgotPasswordOTPRequestBody {
    email: string
    otp: string
}

export interface ResetPasswordRequestBody {
    email: string
    otp: string
    password: string
    confirm_password: string
}