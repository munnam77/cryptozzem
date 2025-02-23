import { useEffect, useState } from 'react';
import { formatInTimeZone } from 'date-fns-tz';
import { Clock } from 'lucide-react';

export function TimeDisplay() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [nextUpdate, setNextUpdate] = useState<string>('');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      
      // Calculate time until next 9 AM JST
      const jstDate = new Date(formatInTimeZone(now, 'Asia/Tokyo', 'yyyy-MM-dd HH:mm:ss'));
      const jstHours = jstDate.getHours();
      const jstMinutes = jstDate.getMinutes();
      
      let hoursUntil9am = jstHours >= 9 ? (24 - jstHours + 9) : (9 - jstHours);
      let minutesRemaining = 60 - jstMinutes;
      
      if (minutesRemaining === 60) {
        minutesRemaining = 0;
        hoursUntil9am = hoursUntil9am === 0 ? 24 : hoursUntil9am;
      }
      
      setNextUpdate(`${hoursUntil9am}h ${minutesRemaining}m`);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const jstTime = formatInTimeZone(currentTime, 'Asia/Tokyo', 'HH:mm:ss');

  return (
    <div className="flex items-center space-x-4 text-sm">
      <div className="flex items-center bg-gray-50 px-3 py-1 rounded-md">
        <Clock className="w-4 h-4 mr-2 text-blue-600" />
        <span className="font-medium">JST: {jstTime}</span>
      </div>
      <div className="text-gray-500 bg-gray-50 px-3 py-1 rounded-md">
        Next update in: <span className="font-medium">{nextUpdate}</span>
      </div>
    </div>
  );
}