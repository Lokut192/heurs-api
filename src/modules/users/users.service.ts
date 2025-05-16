import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from 'src/dto/user/create-user.dto';
import { UpdateUserDto } from 'src/dto/user/update-user.dto';
import { Profile } from 'src/entities/user/profile/profile.entity';
import { User } from 'src/entities/user/user.entity';
import { Repository } from 'typeorm';

import { Profiles } from './user-profile/profiles.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(Profile)
    private readonly profilesRepo: Repository<Profile>,
  ) {}

  // #region Read

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

  async findUserProfiles(userId: number): Promise<Profile[]> {
    const user = await this.usersRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.profiles', 'profiles')
      .where('user.id = :id', { id: userId })
      .getOne();

    if (user === null) {
      throw new NotFoundException('User not found');
    }

    return user.profiles;
  }

  // #endregion Read

  // #region Update

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

  // #endregion Update

  // #region Create

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

    const userUserProfile = await this.profilesRepo.findOneBy({
      identifier: Profiles.User,
    });

    if (userUserProfile === null) {
      throw new InternalServerErrorException('Profiles are not created.');
    }

    const newUser = this.usersRepo.create({
      ...user,
      profiles: [{ id: userUserProfile.id }],
    });

    await this.usersRepo.save(newUser);

    return this.findOneById(newUser.id);
  }

  // #endregion Create

  // #region Delete

  async deleteUserById(userId: number): Promise<void> {
    const user = await this.findOneById(userId);

    await this.usersRepo.remove(user);
  }

  // #endregion Delete

  // #region Utils

  static passwordMatch(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static hashPassword(password: string): string {
    return bcrypt.hashSync(password, 10);
  }

  // #endregion Utils
}
