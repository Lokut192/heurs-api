import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  GoneException,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { CreateUserDto } from 'src/dto/user/create-user.dto';
import { GetUserDto } from 'src/dto/user/get-user.dto';
import { UpdateUserDto } from 'src/dto/user/update-user.dto';

import { UsersService } from './users.service';

@Controller('users')
@ApiTags('Users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // #region Read

  @Get('list')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a list of users' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of users',
    type: GetUserDto,
    isArray: true,
  })
  async getUsers() {
    if (process.env.NODE_ENV !== 'development') {
      throw new GoneException('Endpoint not available in production yet.');
    }

    const users = await this.usersService.findMany();

    return plainToInstance(GetUserDto, users);
  }

  @Get('id/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a user by its id' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The user',
    type: GetUserDto,
    isArray: false,
  })
  @ApiParam({
    name: 'id',
    schema: { type: 'number' },
    description: 'The user id',
  })
  async getUserById(@Param('id', new ParseIntPipe()) idStr: string) {
    if (process.env.NODE_ENV !== 'development') {
      throw new GoneException('Endpoint not available in production yet.');
    }

    const userId = Number(idStr);

    if (Number.isNaN(userId) || userId <= 0) {
      throw new BadRequestException('Invalid id.');
    }

    const user = await this.usersService.findOneById(userId);

    return plainToInstance(GetUserDto, user);
  }

  // #endregion Read

  // #region Create

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({
    type: CreateUserDto,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The created user',
    type: GetUserDto,
    isArray: false,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Username or email already in use',
  })
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      stopAtFirstError: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )
  async createUser(@Body() userDto: CreateUserDto) {
    if (process.env.NODE_ENV !== 'development') {
      throw new GoneException('Endpoint not available in production yet.');
    }

    const user = await this.usersService.createOne(userDto);

    return plainToInstance(GetUserDto, user);
  }

  // #endregion Create

  // #region Update

  @Put('id/:id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'id',
    schema: { type: 'number' },
    description: 'The user id',
  })
  @ApiBody({
    type: UpdateUserDto,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The created user',
    type: GetUserDto,
    isArray: false,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User does not exist',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Username or email already in use',
  })
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      stopAtFirstError: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )
  async updateOneUser(
    @Param('id', new ParseIntPipe()) idStr: string,
    @Body() userDto: UpdateUserDto,
  ) {
    if (process.env.NODE_ENV !== 'development') {
      throw new GoneException('Endpoint not available in production yet.');
    }

    const userId = Number(idStr);

    if (Number.isNaN(userId) || userId <= 0) {
      throw new BadRequestException('Invalid id.');
    }

    if (userId !== userDto.id) {
      throw new BadRequestException('Id in param and body do not match.');
    }

    const user = await this.usersService.updateOne(userDto);

    return plainToInstance(GetUserDto, user);
  }

  // #endregion Update

  // #region Delete

  @Delete('id/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({
    name: 'id',
    schema: { type: 'number' },
    description: 'The user id',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'User successfully deleted',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      stopAtFirstError: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )
  async deleteOneUser(@Param('id', new ParseIntPipe()) idStr: string) {
    if (process.env.NODE_ENV !== 'development') {
      throw new GoneException('Endpoint not available in production yet.');
    }

    const userId = Number(idStr);

    if (Number.isNaN(userId) || userId <= 0) {
      throw new BadRequestException('Invalid id.');
    }

    await this.usersService.deleteUserById(userId);

    return;
  }

  // #endregion Delete
}
