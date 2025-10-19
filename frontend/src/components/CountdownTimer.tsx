import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ClockIcon from './icons/Clock'; // 导入时钟图标

// 定义组件的 props 类型
interface CountdownTimerProps {
  expiryTimestamp: number; // 过期时间戳 (毫秒)
}

// 格式化时间单位，确保总是显示两位数
const formatTimeUnit = (unit: number): string => {
  return unit < 10 ? `0${unit}` : `${unit}`;
};

export function CountdownTimer({ expiryTimestamp }: CountdownTimerProps) {
  const { t } = useTranslation(); // 用于国际化

  // 计算剩余时间的函数
  const calculateTimeLeft = () => {
    const difference = expiryTimestamp - Date.now();
    let timeLeft = {
      hours: '00',
      minutes: '00',
      seconds: '00',
      expired: difference <= 0,
    };

    if (difference > 0) {
      timeLeft = {
        hours: formatTimeUnit(Math.floor((difference / (1000 * 60 * 60)) % 24)),
        minutes: formatTimeUnit(Math.floor((difference / 1000 / 60) % 60)),
        seconds: formatTimeUnit(Math.floor((difference / 1000) % 60)),
        expired: false,
      };
    }

    return timeLeft;
  };

  // 使用 useState 来存储剩余时间
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  // 使用 useEffect 来设置定时器，每秒更新剩余时间
  useEffect(() => {
    // 如果已经过期，则不设置定时器
    if (timeLeft.expired) {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    // 组件卸载时清除定时器
    return () => clearInterval(timer);
  }, [expiryTimestamp, timeLeft.expired]); // 依赖项包含过期时间戳和是否过期状态

  return (
    <div className="flex items-center justify-center gap-2 text-sm text-cyan-400 my-4 p-3 bg-white/5 rounded-md border border-cyan-50/20 shadow-inner">
      <ClockIcon className="w-5 h-5" />
      {timeLeft.expired ? (
        <span>{t('Email expired')}</span> // 邮箱已过期提示
      ) : (
        <span>
          {t('Expires in')}: {timeLeft.hours}:{timeLeft.minutes}:{timeLeft.seconds}
        </span> // 显示剩余时间 时:分:秒
      )}
    </div>
  );
}