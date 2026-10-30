import { UserRoleEnum } from "../enums/userEnum";

export interface UserInterface {
    userId: string;
    email: string;
    password: string;
    name: string;
    role: UserRoleEnum;
    createdAt: string;
    uploadedAt: string;
}

