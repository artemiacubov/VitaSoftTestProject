import type {IComment, IHealthCheck, IPost, IUsers} from "@/type/api.type.ts";
import {api$} from "@/boot/axios.ts";
import {map} from "rxjs";

//Users

export const getUsers = () => {
    return api$.get<IUsers>(`/userInfo/findAll`)
        .pipe(
            map(({data}) => data)
        )
}

export const createUser = (userData: { blogName: string; fullName: string }) => {
    return api$.post<IUsers>(`/userInfo`, userData)
        .pipe(
            map(({data}) => data)
        )
}

export const deleteUserById = (id: number) => {
    return api$.delete<IUsers>(`/userInfo/${id}`)
        .pipe(
            map(({data}) => data)
        )
}

//Posts

export const createPost = (
    userInfoId: number,
    postData: {
        briefDescription: string;
        fullDescription: string;
        title: string;
    }) => {
        return api$.post<IPost>(`/post?userInfoId=${userInfoId}`, postData)
            .pipe(
                map(({data}) => data)
            )
}

export const editPost = (
    postData: {
        id: number;
        title: string;
        briefDescription: string;
        fullDescription: string;
    }) => {
    return api$.put<IPost>(`/post`, postData)
        .pipe(
            map(({data}) => data)
        )
}

export const getPostById = (id: number) => {
    return api$.get<IPost>(`/post/${id}`)
        .pipe(
            map(({data}) => data)
        )
}

export const deletePostById = (id: number) => {
    return api$.delete<IPost>(`/post/${id}`)
        .pipe(
            map(({data}) => data)
        )
}

//Comments

export const createComment = (
    postId: number,
    commentData: {
        email: string;
        textComment: string;
        userInfo: string;
    }) => {

    return api$.post<IComment>(`/comment?postId=${postId}`, commentData)
        .pipe(
            map(({data}) => data)
        )
}

export const deleteCommentById = (id: number) => {
    return api$.delete<IComment>(`/comment/${id}`)
        .pipe(
            map(({data}) => data)
        )
}

//HealthCheck

export const getHealthCheck = (id: number) => {
    return api$.get<IHealthCheck>(`/healthCheck`)
        .pipe(
            map(({data}) => data)
        )
}








