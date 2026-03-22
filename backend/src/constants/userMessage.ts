export const USER_MESSAGE = {
    // Validation
    VALIDATION_ERROR: "Validation error",
    EMAIL_REQUIRED: "Email is required",
    EMAIL_INVALID: "Email is invalid",
    EMAIL_ALREADY_EXISTS: "Email already exists",
    PASSWORD_REQUIRED: "Password is required",
    PASSWORD_MIN_LENGTH: "Password must be at least 6 characters",
    PASSWORD_UPPERCASE: "Password must contain at least 1 uppercase letter",
    PASSWORD_NUMBER: "Password must contain at least 1 number",
    CONFIRM_PASSWORD_REQUIRED: "Confirm password is required",
    CONFIRM_PASSWORD_NOT_MATCH: "Confirm password does not match",
    PASSWORD_NOT_MATCH: "Password does not match",
    NAME_REQUIRED: "Name is required",
    NAME_LENGTH: "Name must be between 2 and 50 characters",
    NAME_ALREADY_EXISTS: "Name already exists",
    EMAIL_VERIFY_TOKEN_REQUIRED: "Email verify token is required",
    EMAIL_VERIFY_TOKEN_MUST_BE_STRING: "Email verify token must be a string",

    // Auth
    LOGIN_SUCCESSFUL: "Login successful",
    REGISTER_SUCCESSFUL: "Register successful",
    USER_NOT_FOUND: "User not found",
    INVALID_PASSWORD: "Invalid password",
    EMAIL_NOT_VERIFIED: "Please verify your email before login",
    USER_ALREADY_EXISTS: "User already exists",

    // Verify Email
    VERIFY_EMAIL_SUCCESSFUL: "Verify email successfully",
    EMAIL_ALREADY_VERIFIED: "Email already verified",
    INVALID_EMAIL_VERIFY_TOKEN: "Invalid email verify token",
    RESEND_VERIFY_EMAIL_SUCCESSFUL: "Resend verification email successfully",

    // General
    INTERNAL_SERVER_ERROR: "Internal server error",
} as const

export default USER_MESSAGE
