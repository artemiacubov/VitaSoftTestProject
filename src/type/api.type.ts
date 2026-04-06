export interface IComment {
    dateTime: string;
    email: string;
    id: number;
    textComment: string;
    userInfo: string;
}

export interface IPost {
    briefDescription: string;
    comments: IComment[];
    dateTime: string;
    fullDescription: string;
    id: number;
    title: string;
    userInfoId: number;
}

export interface IUsers {
    blogName: string;
    fullName: string;
    id: number;
    post: IPost[];
}

export interface IHealthCheck {
    check: string;
}
