import React, { useState, useEffect } from "react";
import { User, Practitioner, Booking, Post, Event } from "@/entities/all";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Calendar,
  MessageSquare,
  Star
} from "@/lib/icons";

export default function PlatformAnalytics() {
  const [analytics, setAnalytics] = useState({
    totalUsers: 0,
    totalPractitioners: 0,
    totalBookings: 0,
    totalPosts: 0,
    totalEvents: 0,
    verifiedPractitioners: 0,
    monthlyGrowth: {
      users: 0,
      bookings: 0
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const [users, practitioners, bookings, posts, events] = await Promise.all([
          User.list(),
          Practitioner.list(),
          Booking.list(),
          Post.list(),
          Event.list()
        ]);

        const verifiedCount = practitioners.filter(p => p.is_verified).length;
        
        // Calculate monthly growth (simplified)
        const thisMonth = new Date();
        thisMonth.setDate(1);
        
        const recentUsers = users.filter(u => new Date(u.created_date) >= thisMonth);
        const recentBookings = bookings.filter(b => new Date(b.created_date) >= thisMonth);

        setAnalytics({
          totalUsers: users.length,
          totalPractitioners: practitioners.length,
          totalBookings: bookings.length,
          totalPosts: posts.length,
          totalEvents: events.length,
          verifiedPractitioners: verifiedCount,
          monthlyGrowth: {
            users: recentUsers.length,
            bookings: recentBookings.length
          }
        });
      } catch (error) {
        console.error("Failed to load analytics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  const StatCard = ({ title, value, icon: Icon, color, trend }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {trend && (
              <p className="text-xs text-muted-foreground mt-1">
                +{trend} this month
              </p>
            )}
          </div>
          <Icon className={`w-8 h-8 ${color}`} />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            Platform Analytics
          </CardTitle>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Total Users"
          value={analytics.totalUsers}
          icon={Users}
          color="text-blue-600"
          trend={analytics.monthlyGrowth.users}
        />
        
        <StatCard
          title="Total Practitioners"
          value={analytics.totalPractitioners}
          icon={Star}
          color="text-primary"
        />
        
        <StatCard
          title="Verified Practitioners"
          value={analytics.verifiedPractitioners}
          icon={TrendingUp}
          color="text-purple-600"
        />
        
        <StatCard
          title="Total Bookings"
          value={analytics.totalBookings}
          icon={Calendar}
          color="text-orange-600"
          trend={analytics.monthlyGrowth.bookings}
        />
        
        <StatCard
          title="Community Posts"
          value={analytics.totalPosts}
          icon={MessageSquare}
          color="text-pink-600"
        />
        
        <StatCard
          title="Events Created"
          value={analytics.totalEvents}
          icon={Calendar}
          color="text-indigo-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Platform Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Verification Rate</span>
                <span className="font-medium">
                  {analytics.totalPractitioners > 0 
                    ? Math.round((analytics.verifiedPractitioners / analytics.totalPractitioners) * 100)
                    : 0}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Avg. Posts per User</span>
                <span className="font-medium">
                  {analytics.totalUsers > 0 
                    ? (analytics.totalPosts / analytics.totalUsers).toFixed(1)
                    : 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Avg. Bookings per Practitioner</span>
                <span className="font-medium">
                  {analytics.totalPractitioners > 0 
                    ? (analytics.totalBookings / analytics.totalPractitioners).toFixed(1)
                    : 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Growth Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">New Users This Month</span>
                <span className="font-medium text-primary">
                  +{analytics.monthlyGrowth.users}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">New Bookings This Month</span>
                <span className="font-medium text-primary">
                  +{analytics.monthlyGrowth.bookings}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Platform Status</span>
                <span className="font-medium text-primary">Healthy ✓</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}