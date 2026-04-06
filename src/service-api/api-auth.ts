import {auth$} from "@/boot/axios.ts";

export function loginRequest(username: string, password: string) {
    return auth$.post('/login', null, {
        params: { username, password },
    })
}