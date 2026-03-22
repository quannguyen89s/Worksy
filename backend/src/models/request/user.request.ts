export interface LoginRequestBody {
    email: string
    password: string
}

export interface RegisterRequestBody {
    name: string
    email: string
    password: string
    confirm_password: string
}

export interface VerifyEmailRequestBody {
    emailVerifyToken: string
}

export interface ForgotPasswordRequestBody {
    email: string
}

export interface VerifyForgotPasswordRequestBody {
    forgotPasswordToken: string
}