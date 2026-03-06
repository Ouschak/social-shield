export interface UserResponse {
    email: string;
    id: number;
    is_active: boolean;
}

export interface LoginResponse {
    access_token: string;
    token_type: string;
}
