import { User } from '../types/user';

const users: User[] = [];

export const getAllUsers = () : User[] => users;

export const getUserById = (id: string) : User | undefined => users.find((user) => user.id === id);

export const createUser = (user: User): User => {
    users.push(user);
    if (process.send) process.send({ type: "update", data: getAllUsers() });
    return user;
};

export const updateUser = (id: string, updatedUser: Partial<User>): User | null => {
    const index = users.findIndex((user) => user.id === id);
    if (index === -1) return null;
    users[index] = { ...users[index], ...updatedUser, id };
    if (process.send) process.send({ type: "update", data: getAllUsers() });
    return users[index];
};

export const deleteUser = (id: string): boolean => {
    const index = users.findIndex((user) => user.id === id);
    if (index === -1) return false;
    users.splice(index, 1);
    if (process.send) process.send({ type: "update", data: getAllUsers() });
    return true;
};

export const resetUsers = (): void => {
    users.length = 0;
};

export const sync = (_users: User[])=> {
    resetUsers();
    _users.forEach(user => users.push(user));
}