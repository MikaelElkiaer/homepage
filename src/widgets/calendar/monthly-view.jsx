import { useContext, useEffect, useMemo } from "react";
import { DateTime, Info } from "luxon";
import classNames from "classnames";
import { useTranslation } from "next-i18next";

import { EventContext, ShowDateContext } from "../../utils/contexts/calendar";

const colorVariants = {
  // https://tailwindcss.com/docs/content-configuration#dynamic-class-names
  amber: "bg-amber-500",      blue: "bg-blue-500",        cyan: "bg-cyan-500",
  emerald: "bg-emerald-500",  fuchsia: "bg-fuchsia-500",  gray: "bg-gray-500",
  green: "bg-green-500",      indigo: "bg-indigo-500",    lime: "bg-lime-500",
  neutral: "bg-neutral-500",  orange: "bg-orange-500",    pink: "bg-pink-500",
  purple: "bg-purple-500",    red: "bg-red-500",          rose: "bg-rose-500",
  sky: "bg-sky-500",          slate: "bg-slate-500",      stone: "bg-stone-500",
  teal: "bg-teal-500",        violet: "bg-violet-500",    white: "bg-white-500",
  yellow: "bg-yellow-500",    zinc: "bg-zinc-500",
}

const cellStyle = "relative w-10 flex items-center justify-center flex-col";
const monthButton = "pl-6 pr-6 ml-2 mr-2 hover:bg-theme-100/20 dark:hover:bg-white/5 rounded-md cursor-pointer"

export function Day({ weekNumber, weekday, events }) {
  const currentDate = DateTime.now();
  const { showDate, setShowDate } = useContext(ShowDateContext);

  const cellDate = showDate.set({ weekday, weekNumber }).startOf("day");
  const filteredEvents = events?.filter(event => event.date?.startOf("day").toUnixInteger() === cellDate.toUnixInteger());

  const dayStyles = (displayDate) => {
    let style = "h-9 ";

    if ([6,7].includes(displayDate.weekday)) {
      // weekend style
      style += "text-red-500 ";
      // different month style
      style += displayDate.month !== showDate.month ? "text-red-500/40 " : "";
    } else if (displayDate.month !== showDate.month) {
      // different month style
      style += "text-gray-500 ";
    }

    // selected same day style
    style += displayDate.toFormat("MM-dd-yyyy") === showDate.toFormat("MM-dd-yyyy") ? "text-black-500 bg-theme-100/20 dark:bg-white/10 rounded-md " : "";

    if (displayDate.toFormat("MM-dd-yyyy") === currentDate.toFormat("MM-dd-yyyy")) {
      // today style
      style += "text-black-500 bg-theme-100/20 dark:bg-black/20 rounded-md ";
    } else {
      style += "hover:bg-theme-100/20 dark:hover:bg-white/5 rounded-md cursor-pointer ";
    }

    return style;
  }

  return <button
    key={`day${weekday}${weekNumber}}`} type="button" className={classNames(dayStyles(cellDate), cellStyle)}
    style={{ width: "14%" }} onClick={() => setShowDate(cellDate)}
  >
    {cellDate.day}
    <span className="flex justify-center items-center absolute w-full -mb-6">
      {filteredEvents && filteredEvents.slice(0, 4).map(event => <span
        key={event.date.toLocaleString() + event.color + event.title}
        className={classNames(
          "inline-flex h-1 w-1 m-0.5 rounded",
          colorVariants[event.color] ?? "gray"
        )}
      />)}
    </span>
  </button>
}

export function Event({ event }) {
  return <div
    key={event.title}
    className="text-theme-700 dark:text-theme-200 text-xs relative h-5 w-full rounded-md bg-theme-200/50 dark:bg-theme-900/20 mt-1"
  ><span className="absolute left-2 text-left text-xs mt-[2px] truncate text-ellipsis" style={{width: '96%'}}>{event.title}</span>
  </div>
}

const dayInWeekId = {
  monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 7
};


export default function MonthlyView({ service }) {
  const { widget } = service;
  const { i18n } = useTranslation();
  const { showDate, setShowDate } = useContext(ShowDateContext);
  const { events } = useContext(EventContext);
  const currentDate = DateTime.now().setLocale(i18n.language).startOf("day");

  useEffect(() => {
    if (!showDate) {
      setShowDate(currentDate);
    }
  })

  const dayNames = Info.weekdays("short", { locale: i18n.language });

  const firstDayInWeekCalendar = widget?.firstDayInWeek ? widget?.firstDayInWeek?.toLowerCase() : "monday";
  for (let i = 1; i < dayInWeekId[firstDayInWeekCalendar]; i+=1) {
    dayNames.push(dayNames.shift());
  }

  const daysInWeek = useMemo(() => [ ...Array(7).keys() ].map( i => i + dayInWeekId[firstDayInWeekCalendar]
  ), [firstDayInWeekCalendar]);

  if (!showDate) {
    return <div className="w-full text-center" />;
  }

  const firstWeek = DateTime.local(showDate.year, showDate.month, 1).setLocale(i18n.language);

  const weekIncrementChange = dayInWeekId[firstDayInWeekCalendar] > firstWeek.weekday ? -1 : 0;
  let weekNumbers = [ ...Array(Math.ceil(5) + 1).keys() ]
    .map(i => firstWeek.weekNumber + weekIncrementChange + i);

  if (weekNumbers.includes(55)) {
    // if we went too far with the weeks, it's the beginning of the year
    weekNumbers = weekNumbers.map(weekNum => weekNum-52 );
  }

  const eventsArray = Object.keys(events).map(eventKey => events[eventKey]);

  return <div className="w-full text-center">
    <div className="flex-col">
      <span><button type="button" onClick={ () => setShowDate(showDate.minus({ months: 1 }).startOf("day")) } className={classNames(monthButton)}>&lt;</button></span>
      <span>{ showDate.setLocale(i18n.language).toFormat("MMMM y") }</span>
      <span><button type="button" onClick={ () => setShowDate(showDate.plus({ months: 1 }).startOf("day")) } className={classNames(monthButton)}>&gt;</button></span>
    </div>

    <div className="p-2 w-full">
      <div className="flex justify-between flex-wrap">
        { dayNames.map(name => <span key={name} className={classNames(cellStyle)} style={{ width: "14%" }}>{name}</span>) }
      </div>

      <div className={classNames(
        "flex justify-between flex-wrap",
        !eventsArray.length && widget?.integrations?.length && "animate-pulse"
      )}>{weekNumbers.map(weekNumber =>
        daysInWeek.map(dayInWeek =>
          <Day key={`week${weekNumber}day${dayInWeek}}`} weekNumber={weekNumber} weekday={dayInWeek} events={eventsArray} />
        )
      )}
      </div>

      <div className="flex flex-col pt-1 pb-1">
        {eventsArray?.filter(event => showDate.startOf("day").toUnixInteger() === event.date?.startOf("day").toUnixInteger())
          .map(event => <Event key={`event${event.title}`} event={event} />)}
      </div>
    </div>
  </div>
}
