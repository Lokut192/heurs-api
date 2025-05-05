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
  Put,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { LoggedUser } from 'src/decorators/auth/LoggedUser.decorator';
import { CreateTimeDto } from 'src/dto/time/create-time.dto';
import { GetTimeDto } from 'src/dto/time/get-time.dto';
import { GetTimesQueryDto } from 'src/dto/time/get-times-query.dto';
import { PutTimeDto } from 'src/dto/time/put-time.dto';
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
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      stopAtFirstError: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  )
  async findAll(
    @LoggedUser() loggedUser: LoggedUserType,
    @Query() query: GetTimesQueryDto,
  ) {
    const times = await this.timesService.findAll(loggedUser.userId, {
      ...query,
      // from: query.from
      //   ? DateTime.fromISO(query.from, { zone: 'UTC' }).toJSDate()
      //   : undefined,
      // to: query.to
      //   ? DateTime.fromISO(query.to, { zone: 'UTC' }).toJSDate()
      //   : undefined,
    });

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
  @ApiParam({ name: 'id', type: 'number' })
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

  @Put('id/:id')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      stopAtFirstError: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )
  @ApiParam({ name: 'id', type: 'number' })
  @ApiOperation({ summary: 'CrUpdate one time for the current logged user' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: GetTimeDto,
    isArray: false,
  })
  async updateOne(
    @Body() updateTimeDto: PutTimeDto,
    @LoggedUser() loggedUser: LoggedUserType,
  ) {
    const time = await this.timesService.updateOne(
      loggedUser.userId,
      updateTimeDto,
    );

    return plainToInstance(GetTimeDto, time, {
      excludeExtraneousValues: true,
    });
  }

  @Delete('id/:id')
  @ApiParam({ name: 'id', type: 'number' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete one time for the current logged user' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Times has been successfully deleted',
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

  @Delete('all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete all times for the current logged user' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'All times have been successfully deleted',
  })
  async deleteAll(@LoggedUser() loggedUser: LoggedUserType) {
    await this.timesService.deleteAll(loggedUser.userId);

    return;
  }

  @Get('types')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get times types' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'All available times types',
    isArray: true,
  })
  findAllTypes() {
    return this.timesService.findAllTypes();
  }
}
