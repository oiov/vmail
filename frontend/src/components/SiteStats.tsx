import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  getSiteStats,
  type SiteStats as SiteStatsType,
  type StatsSnapshot,
} from "../services/api";
import MailIcon from "./icons/MailIcon";
import UserCircleIcon from "./icons/UserCircleIcon";
import ApiIcon from "./icons/ApiIcon";
import ServerIcon from "./icons/ServerIcon";

// vmail.dev 域名的历史数据基础值
const VMAIL_DEV_BASE_STATS: StatsSnapshot = {
  totalAddressesCreated: 56023,
  totalEmailsReceived: 1342678,
  totalApiKeysCreated: 1840,
  totalApiCalls: 15734,
};

// 检查是否是 vmail.dev 域名
function isVmailDev(): boolean {
  return (
    typeof window !== "undefined" && window.location.hostname === "vmail.dev"
  );
}

// 格式化数字，添加千分位分隔符
function formatNumber(num: number): string {
  return num.toLocaleString();
}

function formatGrowthRate(today: number, yesterday: number): string {
  if (yesterday === 0 && today > 0) {
    return "+100%";
  }
  if (yesterday === 0 && today === 0) {
    return "0%";
  }

  const rate = ((today - yesterday) / yesterday) * 100;
  const sign = rate > 0 ? "+" : "";
  return `${sign}${rate.toFixed(1)}%`;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  growthRate: string;
  color: string;
}

function StatCard({ icon, label, value, growthRate, color }: StatCardProps) {
  return (
    <div className="flex flex-col items-center p-4 rounded-lg bg-zinc-800/50 border border-zinc-700/50 hover:border-zinc-600 transition-colors">
      <div className={`p-2 rounded-full mb-2 ${color}`}>{icon}</div>
      <span className="text-2xl font-bold text-white mb-1">
        {formatNumber(value)}
      </span>
      <span className="text-xs text-zinc-400 text-center">{label}</span>
      <span className="text-[11px] text-cyan-400 mt-1">{growthRate}</span>
    </div>
  );
}

function mergeWithBase(stats: SiteStatsType): SiteStatsType {
  if (!isVmailDev()) {
    return stats;
  }

  return {
    totals: {
      totalAddressesCreated:
        stats.totals.totalAddressesCreated + VMAIL_DEV_BASE_STATS.totalAddressesCreated,
      totalEmailsReceived:
        stats.totals.totalEmailsReceived + VMAIL_DEV_BASE_STATS.totalEmailsReceived,
      totalApiKeysCreated:
        stats.totals.totalApiKeysCreated + VMAIL_DEV_BASE_STATS.totalApiKeysCreated,
      totalApiCalls: stats.totals.totalApiCalls + VMAIL_DEV_BASE_STATS.totalApiCalls,
    },
    today: stats.today,
    yesterday: stats.yesterday,
  };
}

export function SiteStats() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<SiteStatsType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getSiteStats();
        setStats(mergeWithBase(data));
      } catch (error) {
        console.error("Failed to fetch site stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-8">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-4 w-32 bg-zinc-700 rounded mb-4"></div>
          <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-zinc-700/50 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  // 计算昨天的总量（今天总量 - 今天增量）
  const yesterdayTotals = {
    totalAddressesCreated: stats.totals.totalAddressesCreated - stats.today.totalAddressesCreated,
    totalEmailsReceived: stats.totals.totalEmailsReceived - stats.today.totalEmailsReceived,
    totalApiKeysCreated: stats.totals.totalApiKeysCreated - stats.today.totalApiKeysCreated,
    totalApiCalls: stats.totals.totalApiCalls - stats.today.totalApiCalls,
  };

  return (
    <div className="w-full flex flex-col items-center py-4 px-2">
      <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
        <StatCard
          icon={<UserCircleIcon className="w-5 h-5 text-cyan-400" />}
          label={t("Addresses Created")}
          value={stats.totals.totalAddressesCreated}
          growthRate={formatGrowthRate(
            stats.totals.totalAddressesCreated,
            yesterdayTotals.totalAddressesCreated,
          )}
          color="bg-cyan-500/10"
        />
        <StatCard
          icon={<MailIcon className="w-5 h-5 text-green-400" />}
          label={t("Emails Received")}
          value={stats.totals.totalEmailsReceived}
          growthRate={formatGrowthRate(
            stats.totals.totalEmailsReceived,
            yesterdayTotals.totalEmailsReceived,
          )}
          color="bg-green-500/10"
        />
        <StatCard
          icon={<ApiIcon className="w-5 h-5 text-purple-400" />}
          label={t("API Keys Created")}
          value={stats.totals.totalApiKeysCreated}
          growthRate={formatGrowthRate(
            stats.totals.totalApiKeysCreated,
            yesterdayTotals.totalApiKeysCreated,
          )}
          color="bg-purple-500/10"
        />
        <StatCard
          icon={<ServerIcon className="w-5 h-5 text-orange-400" />}
          label={t("API Calls")}
          value={stats.totals.totalApiCalls}
          growthRate={formatGrowthRate(
            stats.totals.totalApiCalls,
            yesterdayTotals.totalApiCalls,
          )}
          color="bg-orange-500/10"
        />
      </div>
      <p className="text-zinc-500 text-xs mt-4 text-center">
        {t("Please create a temporary email address first")}
      </p>
    </div>
  );
}
