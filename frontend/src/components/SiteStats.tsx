import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getSiteStats, type SiteStats as SiteStatsType } from "../services/api";
import MailIcon from "./icons/MailIcon";
import UserCircleIcon from "./icons/UserCircleIcon";
import ApiIcon from "./icons/ApiIcon";
import ServerIcon from "./icons/ServerIcon";

// vmail.dev 域名的历史数据基础值
const VMAIL_DEV_BASE_STATS = {
  totalAddressesCreated: 56023,
  totalEmailsReceived: 342678,
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

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  return (
    <div className="flex flex-col items-center p-4 rounded-lg bg-zinc-800/50 border border-zinc-700/50 hover:border-zinc-600 transition-colors">
      <div className={`p-2 rounded-full mb-2 ${color}`}>{icon}</div>
      <span className="text-2xl font-bold text-white mb-1">
        {formatNumber(value)}
      </span>
      <span className="text-xs text-zinc-400 text-center">{label}</span>
    </div>
  );
}

export function SiteStats() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<SiteStatsType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getSiteStats();
        // 如果是 vmail.dev 域名，加上历史基础值
        if (isVmailDev()) {
          setStats({
            totalAddressesCreated:
              data.totalAddressesCreated +
              VMAIL_DEV_BASE_STATS.totalAddressesCreated,
            totalEmailsReceived:
              data.totalEmailsReceived +
              VMAIL_DEV_BASE_STATS.totalEmailsReceived,
            totalApiKeysCreated:
              data.totalApiKeysCreated +
              VMAIL_DEV_BASE_STATS.totalApiKeysCreated,
            totalApiCalls:
              data.totalApiCalls + VMAIL_DEV_BASE_STATS.totalApiCalls,
          });
        } else {
          setStats(data);
        }
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

  return (
    <div className="w-full flex flex-col items-center py-4 px-2">
      {/* <h3 className="text-zinc-400 text-sm mb-4 font-medium">
        {t("Site Statistics")}
      </h3> */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
        <StatCard
          icon={<UserCircleIcon className="w-5 h-5 text-cyan-400" />}
          label={t("Addresses Created")}
          value={stats.totalAddressesCreated}
          color="bg-cyan-500/10"
        />
        <StatCard
          icon={<MailIcon className="w-5 h-5 text-green-400" />}
          label={t("Emails Received")}
          value={stats.totalEmailsReceived}
          color="bg-green-500/10"
        />
        <StatCard
          icon={<ApiIcon className="w-5 h-5 text-purple-400" />}
          label={t("API Keys Created")}
          value={stats.totalApiKeysCreated}
          color="bg-purple-500/10"
        />
        <StatCard
          icon={<ServerIcon className="w-5 h-5 text-orange-400" />}
          label={t("API Calls")}
          value={stats.totalApiCalls}
          color="bg-orange-500/10"
        />
      </div>
      <p className="text-zinc-500 text-xs mt-4 text-center">
        {t("Please create a temporary email address first")}
      </p>
    </div>
  );
}
