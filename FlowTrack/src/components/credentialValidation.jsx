    export function isValidUsername(username) {

        if (username == null) return false;

        if (username.length >= 3 && username.length <= 20) return /^[a-zA-Z0-9]+$/.test(username); else return false;
    }

    export function isValidPassword(password) {

        if (password == null) return false;

        if (password.length < 8 || password.length > 50) return false;
        return /[A-Z]/.test(password) &&
            /[a-z]/.test(password) &&
            /[0-9]/.test(password);
    }

    export function isValidEmail(email) {

        if (email == null) return false;

        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

   export function getCookie(name) {
    return document.cookie
        .split("; ")
        .find(row => row.startsWith(name + "="))
        ?.split("=")[1];
}