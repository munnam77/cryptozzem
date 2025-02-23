import { useEffect, useState } from 'react';
import { format } from 'date-fns-tz';

export function JSTClock() {
  const [time, setTime] = useState(new Date());
  const [nextUpdate, setNextUpdate] = useState<Date | null>(null);

  useEffect(() => {
    // Get next 9 AM JST update time
    const getNextUpdateTime = () => {
      const now = new Date();
      const jstDate = new Date(format(now, 'yyyy-MM-dd HH:mm:ss', { timeZone: 'Asia/Tokyo' }));
      const next9AM = new Date(jstDate);
      next9AM.setHours(9, 0, 0, 0);
      
      if (jstDate.getHours() >= 9) {
        next9AM.setDate(next9AM.getDate() + 1);
      }
      
      setNextUpdate(next9AM);
    };

    // Update current time every second
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    // Calculate next update time
    getNextUpdateTime();

    return () => clearInterval(timer);
  }, []);

  const formatTimeRemaining = () => {
    if (!nextUpdate) return '--:--:--';
    
    const diff = nextUpdate.getTime() - time.getTime();
    if (diff <= 0) return '00:00:00';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center space-y-2 p-4 rounded-lg bg-surface-light dark:bg-surface-dark">
      <div className="text-2xl font-bold text-text-light dark:text-text-dark">
        {format(time, 'HH:mm:ss', { timeZone: 'Asia/Tokyo' })} JST
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Next Update In: {formatTimeRemaining()}
      </div>
    </div>
  );
}