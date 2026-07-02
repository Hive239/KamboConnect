
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Report, Practitioner } from "@/entities/all";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/ui/StatCard";
import { GradientMesh } from "@/components/ui/GradientMesh";
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
        {/* Command-center header */}
        <div className="grain relative mb-6 overflow-hidden rounded-3xl border border-border bg-card">
          <GradientMesh intensity="vivid" />
          <div className="relative z-10 flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 shadow-glow"><Shield className="h-7 w-7 text-primary" weight="duotone" /></span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">Command Center</p>
                <h1 className="font-display text-hero font-semibold tracking-tight">Admin Dashboard</h1>
                <p className="text-muted-foreground">Platform management &amp; oversight</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-2 self-start rounded-full border border-success/30 bg-success/10 px-3 py-1.5 text-sm font-medium text-success sm:self-auto">
              <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-success" /></span>
              All systems operational
            </span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard icon={Users} label="Total Users" value={stats.totalUsers} color="primary" sub="Registered accounts" />
          <StatCard icon={AlertTriangle} label="Pending Reports" value={stats.pendingReports} color="warning" sub={stats.pendingReports > 0 ? "Needs review" : "All clear"} />
          <StatCard icon={ShieldCheck} label="Pending Verifications" value={stats.pendingVerifications} color="info" sub={stats.pendingVerifications > 0 ? "Awaiting review" : "None pending"} />
          <StatCard icon={MessageSquare} label="Active Disputes" value={stats.activeDisputes} color="clay" sub={stats.activeDisputes > 0 ? "In progress" : "None active"} />
        </div>

        {/* Admin Tools */}
        <Tabs defaultValue="analytics" className="w-full">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 gap-1 h-auto bg-muted p-1 rounded-xl">
            <TabsTrigger value="analytics">
              <BarChart3 className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
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
