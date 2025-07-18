export const generateRandomPassword = (length: number = 10): string => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};
