import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid, 
  Cell 
} from 'recharts';
import { BarChart3, TrendingUp, Calendar, IndianRupee, Package, ArrowUpRight } from 'lucide-react';
import { WholesaleOrder } from '../types';

interface WholesaleOrderVolumeChartProps {
  orders: WholesaleOrder[];
}

interface DayData {
  dateKey: string;      // YYYY-MM-DD
  displayDate: string;  // e.g. "15 Sep" or "Mon 15"
  dayOfWeek: string;    // e.g. "Mon"
  volume: number;       // total ₹ amount
  count: number;        // total orders
  isToday: boolean;
}

export const WholesaleOrderVolumeChart: React.FC<WholesaleOrderVolumeChartProps> = ({ orders }) => {
  const [metric, setMetric] = useState<'volume' | 'count'>('volume');

  // Compute last 7 days window (ending today)
  const { chartData, total7DayVolume, total7DayCount, peakDay, avgOrderValue } = useMemo(() => {
    // Determine the reference date: current date (or latest order date if newer)
    const now = new Date();
    
    // Generate array of the last 7 days [now - 6 days ... now]
    const days: DayData[] = [];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;
      
      const dayOfWeek = d.toLocaleDateString('en-US', { weekday: 'short' });
      const displayDate = `${dayOfWeek} ${d.getDate()}`;
      const isToday = i === 0;

      days.push({
        dateKey,
        displayDate,
        dayOfWeek,
        volume: 0,
        count: 0,
        isToday
      });
    }

    // Map wholesale orders into the 7-day buckets
    orders.forEach(order => {
      if (!order.orderDate) return;
      // Extract YYYY-MM-DD from ISO string or date
      const orderDateKey = order.orderDate.split('T')[0];
      const matchDay = days.find(d => d.dateKey === orderDateKey);
      if (matchDay) {
        matchDay.volume += order.grandTotal || 0;
        matchDay.count += 1;
      }
    });

    // Check if all 7 days have zero data (e.g. if sample orders were recorded earlier)
    const hasAnyInCurrentWindow = days.some(d => d.count > 0);
    let finalDays = days;

    if (!hasAnyInCurrentWindow && orders.length > 0) {
      // Use the latest order date as reference point to show last 7 days of historical activity
      const timestamps = orders
        .map(o => new Date(o.orderDate).getTime())
        .filter(t => !isNaN(t));
      
      if (timestamps.length > 0) {
        const latestTime = Math.max(...timestamps);
        const refDate = new Date(latestTime);
        const altDays: DayData[] = [];
        
        for (let i = 6; i >= 0; i--) {
          const d = new Date(refDate);
          d.setDate(d.getDate() - i);
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          const dateKey = `${year}-${month}-${day}`;
          
          const dayOfWeek = d.toLocaleDateString('en-US', { weekday: 'short' });
          const displayDate = `${dayOfWeek} ${d.getDate()}`;

          altDays.push({
            dateKey,
            displayDate,
            dayOfWeek,
            volume: 0,
            count: 0,
            isToday: i === 0
          });
        }

        orders.forEach(order => {
          if (!order.orderDate) return;
          const orderDateKey = order.orderDate.split('T')[0];
          const matchDay = altDays.find(d => d.dateKey === orderDateKey);
          if (matchDay) {
            matchDay.volume += order.grandTotal || 0;
            matchDay.count += 1;
          }
        });

        finalDays = altDays;
      }
    }

    const totalVol = finalDays.reduce((sum, d) => sum + d.volume, 0);
    const totalCnt = finalDays.reduce((sum, d) => sum + d.count, 0);
    const avgAov = totalCnt > 0 ? Math.round(totalVol / totalCnt) : 0;

    // Peak day
    let peak = finalDays[0];
    finalDays.forEach(d => {
      if (d.volume > (peak?.volume || 0)) {
        peak = d;
      }
    });

    return {
      chartData: finalDays,
      total7DayVolume: totalVol,
      total7DayCount: totalCnt,
      peakDay: peak,
      avgOrderValue: avgAov
    };
  }, [orders]);

  return (
    <div 
      id="wholesale-order-volume-chart-card"
      className="rounded-2xl bg-white p-4 border border-slate-200/90 shadow-xs space-y-3"
    >
      {/* Header with Title & Metric Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-200/70">
            <BarChart3 className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <span>Order Volumes (Last 7 Days)</span>
              <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded-full border border-blue-200">
                7 Days
              </span>
            </h4>
            <p className="text-[11px] text-slate-500">
              दैनिक थोक ऑर्डर वॉल्यूम (7 दिनों का बार चार्ट)
            </p>
          </div>
        </div>

        {/* Toggle between Volume (₹) & Order Count */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-xs">
          <button
            type="button"
            id="toggle-metric-volume"
            onClick={() => setMetric('volume')}
            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
              metric === 'volume'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Volume (₹)
          </button>
          <button
            type="button"
            id="toggle-metric-count"
            onClick={() => setMetric('count')}
            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
              metric === 'count'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Orders Count (संख्या)
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100 text-xs">
          <span className="text-[10px] font-semibold text-blue-800 block">7-Day Booked Volume</span>
          <span className="text-sm sm:text-base font-black font-mono text-blue-950">
            ₹{total7DayVolume.toLocaleString()}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
          <span className="text-[10px] font-semibold text-slate-600 block">7-Day Total Orders</span>
          <span className="text-sm sm:text-base font-black font-mono text-slate-900">
            {total7DayCount} {total7DayCount === 1 ? 'Order' : 'Orders'}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
          <span className="text-[10px] font-semibold text-slate-600 block">Avg Order Value</span>
          <span className="text-sm sm:text-base font-black font-mono text-slate-900">
            ₹{avgOrderValue.toLocaleString()}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs">
          <span className="text-[10px] font-semibold text-amber-800 block">Peak Day Volume</span>
          <span className="text-sm sm:text-base font-black font-mono text-amber-950 truncate block">
            {peakDay ? `${peakDay.dayOfWeek} (₹${peakDay.volume.toLocaleString()})` : '—'}
          </span>
        </div>
      </div>

      {/* Bar Chart Visualization */}
      <div className="pt-1">
        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 12, right: 8, left: -22, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="displayDate" 
                tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 9, fill: '#64748b', fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val: number) => {
                  if (metric === 'volume') {
                    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
                    if (val >= 1000) return `₹${(val / 1000).toFixed(0)}k`;
                    return `₹${val}`;
                  }
                  return String(val);
                }}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as DayData;
                    return (
                      <div className="rounded-xl bg-slate-900 text-white p-2.5 shadow-xl text-xs space-y-1 border border-slate-700">
                        <p className="font-bold text-slate-200 border-b border-slate-700 pb-1 flex items-center justify-between gap-3">
                          <span>{data.displayDate} ({data.dateKey})</span>
                          {data.isToday && (
                            <span className="text-[9px] bg-blue-500 text-white px-1.5 rounded-full font-bold">
                              Today
                            </span>
                          )}
                        </p>
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-400">Order Volume:</span>
                          <span className="font-mono font-bold text-amber-300">
                            ₹{data.volume.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-400">Orders Booked:</span>
                          <span className="font-mono font-bold text-white">
                            {data.count} {data.count === 1 ? 'order' : 'orders'}
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar 
                dataKey={metric === 'volume' ? 'volume' : 'count'} 
                radius={[6, 6, 0, 0]}
                maxBarSize={44}
              >
                {chartData.map((entry, index) => {
                  const isPeak = peakDay && entry.dateKey === peakDay.dateKey && entry.volume > 0;
                  return (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={
                        isPeak 
                          ? '#1d4ed8' 
                          : entry.isToday 
                          ? '#2563eb' 
                          : entry.volume > 0 
                          ? '#60a5fa' 
                          : '#cbd5e1'
                      } 
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart Legend / Hint */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-blue-700 inline-block" />
            <span>Peak Day</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-blue-500 inline-block" />
            <span>Active / Today</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-slate-300 inline-block" />
            <span>No Orders</span>
          </span>
        </div>
        <span className="text-slate-400 text-[10px]">
          Hover or tap bars for daily breakdown
        </span>
      </div>
    </div>
  );
};
