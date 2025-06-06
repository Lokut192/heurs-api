import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { DateTime, Duration } from 'luxon';
import { MonthTimesStatistics } from 'src/entities/time/statistics/month-times-statistics.entity';
import { WeekTimesStatistics } from 'src/entities/time/statistics/week-times-statistics.entity';
import { Time } from 'src/entities/time/time.entity';

@Injectable()
export class EmailService {
  constructor(private readonly mailerService: MailerService) {}

  // #region Times stats

  sendMonthlyTimesStatisticsEmail(
    to: string[],
    payload: {
      period: {
        start: string;
        end: string;
      };
      stats: MonthTimesStatistics;
      times: Time[];
    },
  ) {
    const period = DateTime.fromISO(payload.period.start)
      .setLocale('en')
      .toFormat('LLLL yyyy');

    const totalDuration = `${payload.stats.totalDuration >= 0 ? '+' : '-'}${Duration.fromObject(
      {
        minutes: Math.abs(payload.stats.totalDuration),
      },
    )
      .shiftTo('hours', 'minutes')
      .toFormat("h'h' mm'm'")}`;

    return this.mailerService.sendMail({
      to,
      subject: `⏱️ ${period} - Overtime report (${totalDuration})`,
      template: 'times-months-stats',
      context: {
        ...payload,

        stats: {
          ...payload.stats,

          overtimeTotalDuration: Duration.fromObject({
            minutes: payload.stats.overtimeTotalDuration,
          })
            .shiftTo('hours', 'minutes')
            .toFormat("h'h' mm'm'"),

          recoveryTotalDuration: Duration.fromObject({
            minutes: payload.stats.recoveryTotalDuration,
          })
            .shiftTo('hours', 'minutes')
            .toFormat("h'h' mm'm'"),

          totalDuration,
        },

        times: payload.times.map((t) => ({
          ...t,
          date: DateTime.fromISO(t.date).setLocale('en').toFormat('yyyy-MM-dd'),
          duration: Duration.fromObject({ minutes: t.duration })
            .shiftTo('hours', 'minutes')
            .toFormat("h'h' mm'm'"),
        })),
      },
    });
  }

  sendWeeklyTimesStatisticsEmail(
    to: string[],
    payload: {
      period: {
        start: string;
        end: string;
      };
      stats: WeekTimesStatistics;
      times: Time[];
    },
  ) {
    const period = DateTime.fromISO(payload.period.start)
      .setLocale('en')
      .toFormat('WW kkkk');

    const totalDuration = `${payload.stats.totalDuration >= 0 ? '+' : '-'}${Duration.fromObject(
      {
        minutes: Math.abs(payload.stats.totalDuration),
      },
    )
      .shiftTo('hours', 'minutes')
      .toFormat("h'h' mm'm'")}`;

    return this.mailerService.sendMail({
      to,
      subject: `⏱️ Week ${period} - Overtime report (${totalDuration})`,
      template: 'times-week-stats',
      context: {
        period: {
          week: DateTime.fromISO(payload.period.start)
            .setLocale('en')
            .weekNumber.toString()
            .padStart(2, '0'),
          year: DateTime.fromISO(payload.period.start).setLocale('en').weekYear,
        },

        stats: {
          ...payload.stats,

          overtimeTotalDuration: Duration.fromObject({
            minutes: payload.stats.overtimeTotalDuration,
          })
            .shiftTo('hours', 'minutes')
            .toFormat("h'h' mm'm'"),

          recoveryTotalDuration: Duration.fromObject({
            minutes: payload.stats.recoveryTotalDuration,
          })
            .shiftTo('hours', 'minutes')
            .toFormat("h'h' mm'm'"),

          totalDuration,
        },

        times: payload.times.map((t) => ({
          ...t,
          date: DateTime.fromISO(t.date).setLocale('en').toFormat('yyyy-MM-dd'),
          duration: Duration.fromObject({ minutes: t.duration })
            .shiftTo('hours', 'minutes')
            .toFormat("h'h' mm'm'"),
        })),
      },
    });
  }

  // #endregion Times stats
}
