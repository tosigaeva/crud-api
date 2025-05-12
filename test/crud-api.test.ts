import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import supertest from 'supertest';
import { server } from '../src';
import { HttpStatusCode } from '../src/types/http-status-code';
import { resetUsers } from '../src/db/users';

server.close();

const TEST_PORT = 3001;
const request = supertest(server);
const API_BASE_URL = '/api/users';

const testUser = {
  username: 'test',
  age: 20,
  hobbies: ['aaa', 'bbb']
};

const updatedUser = {
  username: 'test123',
  age: 21,
  hobbies: ['123']
};

describe('User API', () => {
  beforeAll(async (): Promise<void> => {
    return new Promise((resolve) => {
      server.listen(TEST_PORT, () => {
        console.log(`Test server listening on port ${TEST_PORT}`);
        resolve();
      });
    });
  });

  afterAll(async (): Promise<void> => {
    return new Promise((resolve) => {
      server.close(() => {
        console.log('Test server closed');
        resolve();
      });
    });
  });

  beforeEach(() => {
    resetUsers();
  });

  let testUserId: string;

  describe('GET /api/users', () => {
    it('should return an empty list when there are no users', async () => {
      const response = await request.get(API_BASE_URL);
      
      expect(response.status).toBe(HttpStatusCode.OK);
      expect(response.body).toEqual([]);
    });
  });

  describe('POST /api/users', () => {
    it('should create a new user with valid data', async () => {
      const response = await request.post(API_BASE_URL).send(testUser);
      
      expect(response.status).toBe(HttpStatusCode.CREATED);
      expect(response.body).toMatchObject({
        ...testUser,
        id: expect.any(String)
      });
      
      testUserId = response.body.id;
    });

    it('should return 400 for invalid user data', async () => {
      const invalidUser = { username: 'test', age: 'twenty', hobbies: 'reading' };
      const response = await request.post(API_BASE_URL).send(invalidUser);
      
      expect(response.status).toBe(HttpStatusCode.BAD_REQUEST);
      expect(response.body).toHaveProperty('message', 'Invalid user data');
    });
  });

  describe('GET /api/users/:id', () => {
    beforeEach(async () => {
      const response = await request.post(API_BASE_URL).send(testUser);
      testUserId = response.body.id;
    });

    it('should find a user by ID', async () => {
      const response = await request.get(`${API_BASE_URL}/${testUserId}`);
      
      expect(response.status).toBe(HttpStatusCode.OK);
      expect(response.body).toEqual({
        id: testUserId,
        ...testUser
      });
    });

    it('should return 404 when user does not exist', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const response = await request.get(`${API_BASE_URL}/${nonExistentId}`);
      
      expect(response.status).toBe(HttpStatusCode.NOT_FOUND);
      expect(response.body).toHaveProperty('message', 'User not found');
    });
  });

  describe('PUT /api/users/:id', () => {
    beforeEach(async () => {
      const response = await request.post(API_BASE_URL).send(testUser);
      testUserId = response.body.id;
    });

    it('should update the user with valid data', async () => {
      const response = await request
        .put(`${API_BASE_URL}/${testUserId}`)
        .send(updatedUser);
      
      expect(response.status).toBe(HttpStatusCode.OK);
      expect(response.body).toEqual({
        id: testUserId,
        ...updatedUser
      });
    });

    it('should return 404 when trying to update non-existent user', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const response = await request
        .put(`${API_BASE_URL}/${nonExistentId}`)
        .send(updatedUser);
      
      expect(response.status).toBe(HttpStatusCode.NOT_FOUND);
      expect(response.body).toHaveProperty('message', 'User not found');
    });
  });

  describe('DELETE /api/users/:id', () => {
    beforeEach(async () => {
      // Create a test user for this suite
      const response = await request.post(API_BASE_URL).send(testUser);
      testUserId = response.body.id;
    });

    it('should delete a user by ID', async () => {
      const response = await request.delete(`${API_BASE_URL}/${testUserId}`);
      
      expect(response.status).toBe(HttpStatusCode.NO_CONTENT);
      expect(response.body).toEqual({});
    });

    it('should return 404 when trying to get deleted user', async () => {
      await request.delete(`${API_BASE_URL}/${testUserId}`);
      const response = await request.get(`${API_BASE_URL}/${testUserId}`);
      
      expect(response.status).toBe(HttpStatusCode.NOT_FOUND);
      expect(response.body).toHaveProperty('message', 'User not found');
    });

    it('should return 404 when trying to delete non-existent user', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const response = await request.delete(`${API_BASE_URL}/${nonExistentId}`);
      
      expect(response.status).toBe(HttpStatusCode.NOT_FOUND);
      expect(response.body).toHaveProperty('message', 'User not found');
    });
  });
});
