export enum UserVerifyStatus {
    Unverified,
    Verified,
    Banned
}

export enum TokenType {
    AccessToken,
    RefreshToken,
    ForgotPasswordToken,
    EmailVerifyToken
}

export enum Role {
    Customer = "customer",
    Worker = "worker",
    Admin = "admin"
}