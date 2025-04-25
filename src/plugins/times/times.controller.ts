import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { LoggedUser } from 'src/decorators/auth/LoggedUser.decorator';
import { CreateTimeDto } from 'src/dto/time/create-time.dto';
import { GetTimeDto } from 'src/dto/time/get-time.dto';
import { AccessTokenGuard } from 'src/modules/auth/access-token.guard';
import { LoggedUserType } from 'src/modules/auth/LoggedUser.type';

import { TimesService } from './times.service';

@UseGuards(AccessTokenGuard)
@ApiBearerAuth()
@ApiTags('Times')
@Controller('plugins/times')
export class TimesController {
  constructor(private readonly timesService: TimesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      stopAtFirstError: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )
  @ApiOperation({ summary: 'Create one time for the current logged user' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: GetTimeDto,
    isArray: false,
  })
  async createOne(
    @Body() createTimeDto: CreateTimeDto,
    @LoggedUser() loggedUser: LoggedUserType,
  ) {
    const time = await this.timesService.createOne(
      loggedUser.userId,
      createTimeDto,
    );

    return plainToInstance(GetTimeDto, time, {
      excludeExtraneousValues: true,
    });
  }

  @Get('list')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get logged user times' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: GetTimeDto,
    isArray: true,
  })
  async findAll(@LoggedUser() loggedUser: LoggedUserType) {
    const times = await this.timesService.findAll(loggedUser.userId);

    return plainToInstance(GetTimeDto, times, {
      excludeExtraneousValues: true,
    });
  }

  @Get('id/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get one time for the current logged user' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: GetTimeDto,
    isArray: false,
  })
  async findOne(
    @Param('id', new ParseIntPipe()) strId: string,
    @LoggedUser() loggedUser: LoggedUserType,
  ) {
    const id = Number(strId);

    if (Number.isNaN(id) || id <= 0) {
      throw new BadRequestException('Invalid id.');
    }

    const time = await this.timesService.findOne(id, loggedUser.userId);

    return plainToInstance(GetTimeDto, time, { excludeExtraneousValues: true });
  }

  @Delete('id/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete one time for the current logged user' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
  })
  async deleteOne(
    @Param('id', new ParseIntPipe()) strId: string,
    @LoggedUser() loggedUser: LoggedUserType,
  ) {
    const id = Number(strId);

    if (Number.isNaN(id) || id <= 0) {
      throw new BadRequestException('Invalid id.');
    }

    await this.timesService.deleteOne(id, loggedUser.userId);

    return;
  }
}
