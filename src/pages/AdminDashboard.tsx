
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Report, Practitioner } from "@/entities/all";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Shield, 
  Users, 
  AlertTriangle, 
  MessageSquare, 
  ShieldCheck, 
  BarChart3,
  Loader2,
  Settings
} from "@/lib/icons";

import UserManagement from "../components/admin/UserManagement";
import DisputeResolution from "../components/admin/DisputeResolution";
import ContentModeration from "../components/admin/ContentModeration";
import VerificationManagement from "../components/admin/VerificationManagement";
import PlatformAnalytics from "../components/admin/PlatformAnalytics";
import AdminSettings from "../components/admin/AdminSettings";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingReports: 0,
    pendingVerifications: 0,
    activeDisputes: 0
  });

  const loadStats = async () => {
     try {
        const [users, reports, practitioners, allReports] = await Promise.all([
          User.list(),
          Report.filter({ status: 'pending' }),
          Practitioner.filter({ verification_level: 'pending' }),
          Report.filter({ status: 'investigating' }) // Use investigating for active disputes
        ]);

        setStats({
          totalUsers: users.length,
          pendingReports: reports.length,
          pendingVerifications: practitioners.length,
          activeDisputes: allReports.length
        });
      } catch (error) {
        console.error("Failed to load dashboard stats:", error);
      }
  }

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const currentUser = await User.me();
        if (!currentUser || currentUser.role !== 'admin') {
          navigate("/Directory");
          return;
        }
        setUser(currentUser);
        await loadStats();
      } catch (error)
      {
        navigate("/Directory");
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminAccess();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Shield className="w-8 h-8 text-primary" />
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">Platform management and oversight tools</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className={stats.pendingReports > 0 ? "border-orange-200 bg-orange-50" : ""}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Reports</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.pendingReports}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className={stats.pendingVerifications > 0 ? "border-purple-200 bg-purple-50" : ""}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Verifications</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.pendingVerifications}</p>
                </div>
                <ShieldCheck className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className={stats.activeDisputes > 0 ? "border-red-200 bg-red-50" : ""}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Disputes</p>
                  <p className="text-2xl font-bold text-red-600">{stats.activeDisputes}</p>
                </div>
                <MessageSquare className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Tools */}
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 gap-1 h-auto bg-muted p-1 rounded-xl">
            <TabsTrigger value="users">
              <Users className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="disputes">
              <AlertTriangle className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Disputes</span>
            </TabsTrigger>
            <TabsTrigger value="content">
              <MessageSquare className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Content</span>
            </TabsTrigger>
            <TabsTrigger value="verification">
              <ShieldCheck className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Verification</span>
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="py-6">
            <UserManagement />
          </TabsContent>

          <TabsContent value="disputes" className="py-6">
            <DisputeResolution />
          </TabsContent>

          <TabsContent value="content" className="py-6">
            <ContentModeration />
          </TabsContent>

          <TabsContent value="verification" className="py-6">
            <VerificationManagement />
          </TabsContent>

          <TabsContent value="analytics" className="py-6">
            <PlatformAnalytics />
          </TabsContent>

          <TabsContent value="settings" className="py-6">
            <AdminSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
