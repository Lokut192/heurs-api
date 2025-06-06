import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { DateTime } from 'luxon';
import { User } from 'src/entities/user/user.entity';
import { Repository } from 'typeorm';

import { TimeZoneService } from '../time-zone/time-zone.service';
import { TimesStatisticsService } from '../times/statistics/times-statistics.service';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly timezoneService: TimeZoneService,
    private readonly timesStatsService: TimesStatisticsService,
  ) {}

  // #region Times stats

  @Cron('0 * * * *') // Every hours
  // @Cron('*/5 * * * * *') // Every 5 seconds for testing
  async sendMonthlyTimesStatsEmailReport() {
    // Get eligible timezones
    //! Uncomment this line in production
    const eligibleTimezones =
      await this.getCurrentEligibleTimezonesForFirstDayOfMonthAndForHour(9); // Send email at 9am every first day of month

    // Debug eligible timezones
    // const eligibleTimezones =
    //   await this.debug_getCurrentEligibleTimezonesForFirstDayOfMonthAndForHour(
    //     DateTime.now().hour,
    //   );

    const monthDateTime = DateTime.now().startOf('month').minus({ months: 1 });
    const yearDateTime = DateTime.now().startOf('month').minus({ months: 1 });

    if (eligibleTimezones.length === 0) {
      // If no timezone is eligible, do not send email
      return;
    }

    const [month, year] = [
      monthDateTime.setZone(eligibleTimezones[0] ?? undefined).month,
      yearDateTime.setZone(eligibleTimezones[0] ?? undefined).year,
    ];

    this.logger.log(`Sending email for month ${month} and year ${year}`);

    // Get eligible users query
    const usersQuery = this.usersRepo
      .createQueryBuilder('user')
      .select(['user.id', 'user.username'])
      .leftJoin('user.settings', 'setting')
      .where('setting.code = :code', { code: 'TIME_ZONE' })
      .andWhere('setting.value IN (:...timezones)', {
        timezones: eligibleTimezones,
      })
      .where('setting.code = :code', { code: 'MONTHLY_TIMES_STATS_EMAIL' })
      .andWhere('setting.value = :value', {
        value: '1',
      });

    // Get eligible users data
    const [users, usersCount] = await Promise.all([
      usersQuery.getMany(),
      usersQuery.getCount(),
    ]);

    this.logger.log(
      `${usersCount} eligible users to send monthly times stats email to.`,
    );

    // console.log(JSON.stringify(users, null, 2));
    // return;

    for (const { id: userId, username: userUsername } of users) {
      try {
        void this.timesStatsService
          .sendMonthlyTimesStatsEmail(userId, month, year)
          .then(() => {
            this.logger.log(
              `Successfully sent monthly times stats email for user ${userUsername}.`,
            );
          })
          .catch((error) => {
            this.logger.error(
              `Could not send monthly times stats email for user ${userUsername}:`,
            );
            console.error(error);
          });
      } catch (_error) {
        // Do nothing
      }
    }
  }

  @Cron('0 * * * *') // Every hours
  // @Cron('*/5 * * * * *') // Every 5 seconds for testing
  async sendWeeklyTimesStatsEmailReport() {
    // Get eligible timezones
    //! Uncomment this line in production
    const eligibleTimezones =
      await this.getCurrentEligibleTimezonesForFirstDayOfWeekAndForHour(9); // Send email at 9am every first day of week

    // Debug eligible timezones
    // const eligibleTimezones =
    //   await this.debug_getCurrentEligibleTimezonesForFirstDayOfMonthAndForHour(
    //     DateTime.now().hour,
    //   );

    const weekDateTime = DateTime.now().startOf('week').minus({ weeks: 1 });
    const yearDateTime = DateTime.now().startOf('week').minus({ weeks: 1 });

    if (eligibleTimezones.length === 0) {
      // If no timezone is eligible, do not send email
      return;
    }

    const [week, year] = [
      weekDateTime.setZone(eligibleTimezones[0] ?? undefined).weekNumber,
      yearDateTime.setZone(eligibleTimezones[0] ?? undefined).weekYear,
    ];

    this.logger.log(`Sending email for week ${week} and year ${year}`);

    // Get eligible users query
    const usersQuery = this.usersRepo
      .createQueryBuilder('user')
      .select(['user.id', 'user.username'])
      .leftJoin('user.settings', 'setting')
      .where('setting.code = :code', { code: 'TIME_ZONE' })
      .andWhere('setting.value IN (:...timezones)', {
        timezones: eligibleTimezones,
      })
      .where('setting.code = :code', { code: 'WEEKLY_TIMES_STATS_EMAIL' })
      .andWhere('setting.value = :value', {
        value: '1',
      });

    // Get eligible users data
    const [users, usersCount] = await Promise.all([
      usersQuery.getMany(),
      usersQuery.getCount(),
    ]);

    this.logger.log(
      `${usersCount} eligible users to send weekly times stats email to.`,
    );

    // console.log(JSON.stringify(users, null, 2));
    // return;

    for (const { id: userId, username: userUsername } of users) {
      try {
        void this.timesStatsService
          .sendWeeklyTimesStatsEmail(userId, week, year)
          .then(() => {
            this.logger.log(
              `Successfully sent weekly times stats email for user ${userUsername}.`,
            );
          })
          .catch((error) => {
            this.logger.error(
              `Could not send weekly times stats email for user ${userUsername}:`,
            );
            console.error(error);
          });
      } catch (_error) {
        // Do nothing
      }
    }
  }

  // #endregion Times stats

  // #region Utils

  /**
   * Retrieves a list of timezones where the current local time matches the specified hour
   * and it is the first day of the month.
   *
   * @param hour - The hour to check against in the local timezone.
   * @returns A promise that resolves to an array of timezone names that are eligible.
   */
  private async getCurrentEligibleTimezonesForFirstDayOfMonthAndForHour(
    hour: number,
  ) {
    const timezones = await this.timezoneService.findAll();
    const eligibleTimezones = [] as string[];

    for (const tz of timezones) {
      const localDate = DateTime.now().setZone(tz.name).startOf('hour');

      if (localDate.hour === hour && localDate.day === 1) {
        eligibleTimezones.push(tz.name);
      }
    }

    return eligibleTimezones;
  }

  /**
   * Retrieves a list of timezones where the current local time matches the specified hour
   * and it is the first day of the week.
   *
   * @param hour - The hour to check against in the local timezone.
   * @returns A promise that resolves to an array of timezone names that are eligible.
   */
  private async getCurrentEligibleTimezonesForFirstDayOfWeekAndForHour(
    hour: number,
  ) {
    const timezones = await this.timezoneService.findAll();
    const eligibleTimezones = [] as string[];

    for (const tz of timezones) {
      const localDate = DateTime.now().setZone(tz.name).startOf('hour');

      if (localDate.hour === hour && localDate.weekday === 1) {
        eligibleTimezones.push(tz.name);
      }
    }

    return eligibleTimezones;
  }

  /**
   * Retrieves a list of timezones where the current local time matches the specified hour
   * and it is the first day of the month.
   *
   * @param hour - The hour to check against in the local timezone.
   * @returns A promise that resolves to an array of timezone names that are eligible.
   */
  private async debug_getCurrentEligibleTimezonesForFirstDayOfMonthAndForHour(
    hour: number,
  ) {
    const timezones = await this.timezoneService.findAll();
    const eligibleTimezones = [] as string[];

    for (const tz of timezones) {
      const localDate = DateTime.now().setZone(tz.name).startOf('hour');

      if (localDate.hour === hour) {
        eligibleTimezones.push(tz.name);
      }
    }

    return eligibleTimezones;
  }

  /**
   * Retrieves a list of timezones where the current local time matches the specified hour
   * and it is the first day of the week.
   *
   * @param hour - The hour to check against in the local timezone.
   * @returns A promise that resolves to an array of timezone names that are eligible.
   */
  private async debug_getCurrentEligibleTimezonesForFirstDayOfWeekAndForHour(
    hour: number,
  ) {
    const timezones = await this.timezoneService.findAll();
    const eligibleTimezones = [] as string[];

    for (const tz of timezones) {
      const localDate = DateTime.now().setZone(tz.name).startOf('hour');

      if (localDate.hour === hour) {
        eligibleTimezones.push(tz.name);
      }
    }

    return eligibleTimezones;
  }

  // #endregion Utils
}
