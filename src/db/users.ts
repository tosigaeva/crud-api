import { User } from '../types/user';

const users: User[] = [];

export const getAllUsers = () : User[] => users;

export const getUserById = (id: string) : User | undefined => users.find((user) => user.id === id);

export const createUser = (user: User): User => {
    users.push(user);
    return user;
};

export const updateUser = (id: string, updatedUser: Partial<User>): User | null => {
    const index = users.findIndex((user) => user.id === id);
    if (index === -1) return null;
    users[index] = { ...users[index], ...updatedUser, id };
    return users[index];
};

export const deleteUser = (id: string): boolean => {
    const index = users.findIndex((user) => user.id === id);
    if (index === -1) return false;
    users.splice(index, 1);
    return true;
};