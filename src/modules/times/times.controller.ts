import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Res,
  UnsupportedMediaTypeException,
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
import { Response } from 'express';
import { DateTime } from 'luxon';
import { unparse } from 'papaparse';
import { LoggedUser } from 'src/decorators/auth/LoggedUser.decorator';
import { CreateTimeDto } from 'src/dto/time/create-time.dto';
import { GetCsvTimeExportDto } from 'src/dto/time/export/get-csv-time-export';
import { GetJsonTimeExportDto } from 'src/dto/time/export/get-json-time-export';
import { GetTimeDto } from 'src/dto/time/get-time.dto';
import { GetTimesQueryDto } from 'src/dto/time/get-times-query.dto';
import { PutTimeDto } from 'src/dto/time/put-time.dto';
import { AccessTokenGuard } from 'src/modules/auth/access-token.guard';
import { LoggedUserType } from 'src/modules/auth/LoggedUser.type';

import { timeExportAcceptSchema } from './time-export.schema';
import { TimesService } from './times.service';

@UseGuards(AccessTokenGuard)
@ApiBearerAuth()
@ApiTags('Times')
@Controller('times')
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

  @Get('export')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get times export',
    description:
      'Use the Accept header to specify the export type (application/json, text/csv, application/pdf).',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Times export in the requested type (application/json, text/csv, application/pdf).',
    isArray: false,
    headers: {
      Accept: {
        description: 'application/json, text/csv, application/pdf',
        required: true,
        schema: {
          type: 'string',
          enum: ['application/json', 'text/csv', 'application/pdf'],
        },
      },
    },
  })
  async exportTimes(
    @LoggedUser() loggedUser: LoggedUserType,
    @Headers('Accept') rawAccept: string,
    @Res() response: Response,
    @Query() query: GetTimesQueryDto,
  ) {
    const parsedAccept = timeExportAcceptSchema.safeParse(rawAccept);

    if (!!parsedAccept.error) {
      throw new UnsupportedMediaTypeException({
        message: 'Unsupported export type.',
      });
    }

    const times = await this.timesService.findAll(loggedUser.userId, {
      order: query.order ?? 'ASC',
      orderby: query.orderby ?? 'date',
      from: query.from ?? DateTime.now().startOf('month').toISODate(),
      to: query.to ?? DateTime.now().endOf('month').toISODate(),
    });

    switch (parsedAccept.data) {
      case 'text/csv':
        response.setHeader('Content-Type', 'text/csv; charset=utf-8');
        response.setHeader(
          'Content-Disposition',
          'attachment; filename="times.csv"',
        );
        response.send(
          unparse(
            plainToInstance(GetCsvTimeExportDto, times, {
              excludeExtraneousValues: true,
            }),
          ),
        );
        break;
      case 'application/pdf':
        throw new UnsupportedMediaTypeException({
          message: 'Export type not yet implemented.',
        });
      case 'application/json':
      default:
        response.setHeader('Content-Type', 'application/json; charset=utf-8');
        response.setHeader(
          'Content-Disposition',
          'attachment; filename="times.json"',
        );
        response.send(
          JSON.stringify(
            plainToInstance(GetJsonTimeExportDto, times, {
              excludeExtraneousValues: true,
            }),
            null,
            2,
          ),
        );
        break;
    }
  }
}
