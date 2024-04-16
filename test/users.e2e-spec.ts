import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { UserController } from '../src/user/user.controller';
import { UserService } from '../src/user/user.service';
import {
  BadRequestException,
  HttpStatus,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { CreateUserDto } from '../src/user/dto/create-user.dto/create-user.dto';
import { AllExceptionsFilter } from '../src/filters/exceptions.filter';

describe('UserController', () => {
  let app: INestApplication;
  const userService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [], // Replace with actual UserModule import
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: userService }],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        exceptionFactory: (validationErrors = []) => {
          const simplifiedMessages = validationErrors.flatMap((err) => {
            // Concatenate the property name with each constraint description
            return Object.values(err.constraints).map((message) => {
              return message;
            });
          });
          return new BadRequestException({
            statusCode: 400,
            error: 'Bad Request',
            message: simplifiedMessages,
          });
        },
      }),
    );

    await app.init();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    // await app.close();
  });

  //  ** Create User Tests **

  it('/POST users (Create User)', () => {
    const newUserData: CreateUserDto = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password',
    };
    userService.create.mockReturnValue(
      Promise.resolve({ ...newUserData, _id: 1 }),
    );

    return request(app.getHttpServer())
      .post('/users')
      .send(newUserData)
      .expect(({ body }) => {
        expect(body.statusCode).toBe(HttpStatus.CREATED);
        expect(body.message).toBe('User created successfully');
        expect(body.data).toEqual({ ...newUserData, _id: 1 });
      });
  });

  it('/POST users - Validation Error', async () => {
    const invalidUserData = { username: 'test' }; // Missing required fields like email

    await request(app.getHttpServer())
      .post('/users')
      .send(invalidUserData)
      .expect(HttpStatus.BAD_REQUEST)
      .expect(({ body }) => {
        expect(body.statusCode).toBe(HttpStatus.BAD_REQUEST);
        expect(body.error).toBe('Bad Request');
        expect(body.message).toEqual([
          'email should not be empty',
          'email must be an email',
          'password should not be empty',
          'password must be a string',
        ]);
      });
  });

  it('/POST users - Validation Error - No Username', async () => {
    const invalidUserData = { email: 'test@email.com', password: '1234' }; // Missing required fields like email

    // const err = new BadRequestException({
    //   statusCode: 400,
    //   error: 'Bad Request',
    //   message: ['username should not be empty', 'username must be a string'],
    // });
    // userService.create.mockRejectedValue(err);

    await request(app.getHttpServer())
      .post('/users')
      .send(invalidUserData)
      .expect(HttpStatus.BAD_REQUEST)
      .expect(({ body }) => {
        expect(body.statusCode).toBe(HttpStatus.BAD_REQUEST);
        expect(body.error).toBe('Bad Request');
        expect(body.message).toEqual([
          'username should not be empty',
          'username must be a string',
        ]);
      });
  });

  it('/POST users - Validation Error - No Email', async () => {
    const invalidUserData = { username: 'test', password: 'pass1234' }; // Missing required fields like email

    // const err = new BadRequestException({
    //   statusCode: 400,
    //   error: 'Bad Request',
    //   message: ['email should not be empty', 'email must be an email'],
    // });
    // userService.create.mockRejectedValue(err);

    await request(app.getHttpServer())
      .post('/users')
      .send(invalidUserData)
      .expect(HttpStatus.BAD_REQUEST)
      .expect(({ body }) => {
        expect(body.statusCode).toBe(HttpStatus.BAD_REQUEST);
        expect(body.error).toBe('Bad Request');
        expect(body.message).toEqual([
          'email should not be empty',
          'email must be an email',
        ]);
      });
  });

  it('/POST users - Validation Error - No Password', async () => {
    const invalidUserData = { username: 'test', email: 'abc@gmail.com' }; // Missing required fields like email

    // userService.create.mockRejectedValue(
    //   new BadRequestException({
    //     statusCode: 400,
    //     error: 'Bad Request',
    //     message: ['password should not be empty', 'password must be a string'],
    //   }),
    // );

    await request(app.getHttpServer())
      .post('/users')
      .send(invalidUserData)
      .expect(HttpStatus.BAD_REQUEST)
      .expect(({ body }) => {
        expect(body.statusCode).toBe(HttpStatus.BAD_REQUEST);
        expect(body.error).toBe('Bad Request');
        expect(body.message).toEqual([
          'password should not be empty',
          'password must be a string',
        ]);
      });
  });

  //  ** Read User Tests **

  it('/GET users (Find All Users)', () => {
    const users = [{ id: 1, username: 'user1', email: 'user1@example.com' }];
    userService.findAll.mockReturnValue(Promise.resolve(users));

    return request(app.getHttpServer())
      .get('/users')
      .expect(HttpStatus.OK)
      .expect(({ body }) => {
        expect(body.statusCode).toBe(HttpStatus.OK);
        expect(body.message).toBe('Users fetched successfully');
        expect(body.data).toEqual(users);
      });
  });

  it('/GET users/:id (Find One User)', () => {
    const userId = 1;
    const user = { id: userId, username: 'user1', email: 'user1@example.com' };
    userService.findOne.mockReturnValue(Promise.resolve(user));

    return request(app.getHttpServer())
      .get(`/users/${userId}`)
      .expect(HttpStatus.FOUND)
      .expect(({ body }) => {
        expect(body.statusCode).toBe(HttpStatus.FOUND);
        expect(body.message).toBe('User fetched successfully');
        expect(body.data).toEqual(user);
      });
  });

  it('/GET users/:id (Find One User) - Not Found', async () => {
    const userId = 10; // Non-existent ID
    userService.findOne.mockReturnValue(Promise.resolve(null));

    await request(app.getHttpServer())
      .get(`/users/${userId}`)
      .expect(404)
      .expect(({ body }) => {
        expect(body.statusCode).toBe(404);
        expect(body.error).toBe('Not Found');
        expect(body.message).toEqual(['User does not exist']);
      });
  });

  it('/PUT users/:id (Update User)', () => {
    const userId = 1;
    const updateData = { email: 'updated@example.com' };
    const updatedUser = { ...updateData, id: userId, username: 'user1' }; // Existing username
    userService.update.mockReturnValue(Promise.resolve(updatedUser));

    return request(app.getHttpServer())
      .put(`/users/${userId}`)
      .send(updateData)
      .expect(200)
      .expect(({ body }) => {
        expect(body.statusCode).toBe(200);
        expect(body.message).toBe('User updated successfully');
        expect(body.data).toEqual(updatedUser);
      });
  });

  it('/PUT users/:id (Update User) - Not Found', () => {
    const userId = 10; // Non-existent ID
    const updateData = { email: 'updated@example.com' };
    userService.update.mockReturnValue(Promise.resolve(null));

    return request(app.getHttpServer())
      .put(`/users/${userId}`)
      .send(updateData)
      .expect(404); // Replace with appropriate error status code for not found
  });
});