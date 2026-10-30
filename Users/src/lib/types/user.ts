import { UserRoleEnum } from "../enums/userEnum";

export interface UserInterface {
    userID: string;
    email: string;
    password: string;
    name: string;
    role: UserRoleEnum;
    createdAt: string;
    uploadedAt: string;
}

