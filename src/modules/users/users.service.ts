import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from 'src/dto/user/create-user.dto';
import { UpdateUserDto } from 'src/dto/user/update-user.dto';
import { User } from 'src/entities/user/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async findOneById(id: number): Promise<User> {
    const query = this.usersRepo.createQueryBuilder('user');

    query.where('user.id = :id', { id });

    const user = await query.getOne();

    if (user === null) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findOneByEmail(email: string): Promise<User> {
    const query = this.usersRepo.createQueryBuilder('user');

    query.where('user.email = :email', { email });

    const user = await query.getOne();

    if (user === null) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findOneByUsername(username: string): Promise<User> {
    const query = this.usersRepo.createQueryBuilder('user');

    query.where('user.username = :username', { username });

    const user = await query.getOne();

    if (user === null) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findMany(): Promise<User[]> {
    const query = this.usersRepo.createQueryBuilder('users');

    query.orderBy('users.username', 'ASC');

    const users = await query.getMany();

    return users;
  }

  async updateOne(user: UpdateUserDto): Promise<User> {
    // Get user
    const dbUser = await this.findOneById(user.id);

    if (dbUser === null) {
      throw new NotFoundException('User not found');
    }

    // Check username is unique
    const existingUserUsernameQuery = this.usersRepo.createQueryBuilder('user');

    existingUserUsernameQuery.where('user.username = :username', {
      username: user.username,
    });

    const existingUserUsername = await existingUserUsernameQuery.getOne();

    if (existingUserUsername !== null && existingUserUsername.id !== user.id) {
      throw new ConflictException('Username already in use');
    }

    // Check email is unique
    const existingUserEmailQuery = this.usersRepo.createQueryBuilder('user');

    existingUserEmailQuery.where('user.email = :email', {
      email: user.email,
    });

    const existingUserEmail = await existingUserEmailQuery.getOne();

    if (existingUserEmail !== null && existingUserEmail.id !== user.id) {
      throw new ConflictException('Email already in use');
    }

    // Update fields
    dbUser.email = user.email;
    dbUser.username = user.username;

    // Save user
    await this.usersRepo.save(dbUser);

    return this.findOneById(dbUser.id);
  }

  async createOne(user: CreateUserDto): Promise<User> {
    // Check username is unique
    const existingUserUsernameQuery = this.usersRepo.createQueryBuilder('user');

    existingUserUsernameQuery.where('user.username = :username', {
      username: user.username,
    });

    const existingUserUsername = await existingUserUsernameQuery.getOne();

    if (existingUserUsername !== null) {
      throw new ConflictException('Username already in use');
    }

    // Check email is unique
    const existingUserEmailQuery = this.usersRepo.createQueryBuilder('user');

    existingUserEmailQuery.where('user.email = :email', {
      email: user.email,
    });

    const existingUserEmail = await existingUserEmailQuery.getOne();

    if (existingUserEmail !== null) {
      throw new ConflictException('Email already in use');
    }

    const newUser = this.usersRepo.create(user);

    await this.usersRepo.save(newUser);

    return this.findOneById(newUser.id);
  }

  async deleteUserById(userId: number): Promise<void> {
    const user = await this.findOneById(userId);

    await this.usersRepo.remove(user);
  }
}
