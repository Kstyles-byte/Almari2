'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  RefreshCw, 
  Download,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react';
import { BarChartClient } from '@/components/charts/BarChartClient';
import { LineChartClient } from '@/components/charts/LineChartClient';
import { PieChartClient } from '@/components/charts/PieChartClient';

interface RefundAnalyticsData {
  summary: {
    total_refunds: number;
    total_refund_amount: number;
    approval_rate: number;
    average_processing_time: number;
    refund_trend: 'up' | 'down' | 'stable';
    period_comparison: {
      current_period: number;
      previous_period: number;
      change_percentage: number;
    };
  };
  refund_trends: {
    date: string;
    count: number;
    amount: number;
  }[];
  vendor_performance: {
    vendor_id: string;
    vendor_name: string;
    total_orders: number;
    refund_count: number;
    refund_rate: number;
    refund_amount: number;
    avg_response_time: number;
    risk_score: number;
  }[];
  refund_reasons: {
    reason: string;
    count: number;
    percentage: number;
  }[];
  status_distribution: {
    status: string;
    count: number;
    amount: number;
  }[];
  financial_impact: {
    gross_revenue: number;
    refunded_amount: number;
    net_revenue: number;
    refund_percentage: number;
    commission_impact: number;
  };
  processing_metrics: {
    avg_admin_response_time: number;
    avg_vendor_response_time: number;
    auto_approval_rate: number;
    dispute_rate: number;
  };
}

interface RefundAnalyticsDashboardProps {
  className?: string;
}

export function RefundAnalyticsDashboard({ className }: RefundAnalyticsDashboardProps) {
  const [analyticsData, setAnalyticsData] = useState<RefundAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7d');
  const [vendorFilter, setVendorFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalyticsData = async () => {
    setRefreshing(true);
    try {
      const params = new URLSearchParams({
        period: dateRange,
        ...(vendorFilter !== 'all' && { vendor_id: vendorFilter })
      });

      const response = await fetch(`/api/admin/analytics/refunds?${params}`);
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange, vendorFilter]);

  const exportAnalytics = () => {
    if (!analyticsData) return;

    const csvData = [
      ['Metric', 'Value'],
      ['Total Refunds', analyticsData.summary.total_refunds],
      ['Total Refund Amount', `₦${analyticsData.summary.total_refund_amount.toLocaleString()}`],
      ['Approval Rate', `${analyticsData.summary.approval_rate}%`],
      ['Average Processing Time', `${analyticsData.summary.average_processing_time} hours`],
      [''],
      ['Vendor Performance', ''],
      ...analyticsData.vendor_performance.map(vendor => [
        vendor.vendor_name,
        `${vendor.refund_rate}% refund rate (${vendor.refund_count} refunds)`
      ]),
      [''],
      ['Refund Reasons', ''],
      ...analyticsData.refund_reasons.map(reason => [
        reason.reason,
        `${reason.count} (${reason.percentage}%)`
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `refund-analytics-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-red-600'; // Increase in refunds is bad
    if (change < 0) return 'text-green-600'; // Decrease in refunds is good
    return 'text-gray-600';
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4" />;
    if (change < 0) return <TrendingDown className="h-4 w-4" />;
    return <div className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Unable to Load Analytics</h3>
          <p className="text-muted-foreground mb-4">Failed to fetch refund analytics data.</p>
          <Button onClick={fetchAnalyticsData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Refund Analytics</h2>
          <p className="text-muted-foreground">Comprehensive insights into refund performance and trends</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
              <SelectItem value="1y">Last Year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={exportAnalytics}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchAnalyticsData}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Refunds</p>
                <p className="text-2xl font-bold">{analyticsData.summary.total_refunds.toLocaleString()}</p>
                <div className={`flex items-center mt-1 text-sm ${getChangeColor(analyticsData.summary.period_comparison.change_percentage)}`}>
                  {getChangeIcon(analyticsData.summary.period_comparison.change_percentage)}
                  <span className="ml-1">{Math.abs(analyticsData.summary.period_comparison.change_percentage)}%</span>
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <RefreshCw className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Refund Amount</p>
                <p className="text-2xl font-bold">{formatCurrency(analyticsData.summary.total_refund_amount)}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {analyticsData.financial_impact.refund_percentage.toFixed(1)}% of revenue
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <DollarSign className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Approval Rate</p>
                <p className="text-2xl font-bold">{analyticsData.summary.approval_rate.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Avg: {analyticsData.summary.average_processing_time.toFixed(1)}h processing
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">High Risk Vendors</p>
                <p className="text-2xl font-bold">
                  {analyticsData.vendor_performance.filter(v => v.risk_score > 0.7).length}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  of {analyticsData.vendor_performance.length} total
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Refund Trends Over Time */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="h-5 w-5" />
              Refund Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LineChartClient
              data={analyticsData.refund_trends.map(trend => ({
                date: trend.date,
                refunds: trend.count,
                amount: trend.amount
              }))}
              xKey="date"
              lines={[
                { key: 'refunds', color: '#3b82f6', name: 'Refund Count' },
                { key: 'amount', color: '#ef4444', name: 'Amount (₦)' }
              ]}
            />
          </CardContent>
        </Card>

        {/* Refund Reasons Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Refund Reasons
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PieChartClient
              data={analyticsData.refund_reasons.map(reason => ({
                name: reason.reason,
                value: reason.count,
                percentage: reason.percentage
              }))}
            />
          </CardContent>
        </Card>
      </div>

      {/* Vendor Performance Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Vendor Performance Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Refund Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Refunds
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Refund Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Response Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Risk Level
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analyticsData.vendor_performance
                  .sort((a, b) => b.refund_rate - a.refund_rate)
                  .slice(0, 10)
                  .map((vendor) => (
                    <tr key={vendor.vendor_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {vendor.vendor_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {vendor.total_orders} total orders
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {vendor.refund_rate.toFixed(2)}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {vendor.refund_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(vendor.refund_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {vendor.avg_response_time.toFixed(1)}h
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={
                          vendor.risk_score > 0.7 ? 'destructive' : 
                          vendor.risk_score > 0.4 ? 'secondary' : 'default'
                        }>
                          {vendor.risk_score > 0.7 ? 'HIGH' : 
                           vendor.risk_score > 0.4 ? 'MEDIUM' : 'LOW'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Financial Impact & Processing Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Financial Impact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Gross Revenue</span>
              <span className="font-medium">{formatCurrency(analyticsData.financial_impact.gross_revenue)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Refunded Amount</span>
              <span className="font-medium text-red-600">-{formatCurrency(analyticsData.financial_impact.refunded_amount)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Net Revenue</span>
              <span className="font-medium text-green-600">{formatCurrency(analyticsData.financial_impact.net_revenue)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-sm text-muted-foreground">Commission Impact</span>
              <span className="font-medium text-orange-600">-{formatCurrency(analyticsData.financial_impact.commission_impact)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Processing Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Avg Admin Response</span>
              <span className="font-medium">{analyticsData.processing_metrics.avg_admin_response_time.toFixed(1)}h</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Avg Vendor Response</span>
              <span className="font-medium">{analyticsData.processing_metrics.avg_vendor_response_time.toFixed(1)}h</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Auto-Approval Rate</span>
              <span className="font-medium">{analyticsData.processing_metrics.auto_approval_rate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-sm text-muted-foreground">Dispute Rate</span>
              <span className="font-medium text-red-600">{analyticsData.processing_metrics.dispute_rate.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}