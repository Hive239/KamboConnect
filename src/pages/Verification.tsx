
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { User, Practitioner, Notification } from "@/entities/all";
import { SendEmail } from "@/integrations/Core";
import { openDoc } from "@/lib/storage";
import { createPageUrl } from "@/utils";
import {
  ShieldCheck, AlertCircle, Loader2, User as UserIcon, Check, X, ExternalLink, ArrowLeft
} from "@/lib/icons";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const DetailSection = ({ title, children }) => (
  <div>
    <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider mb-2">{title}</h3>
    <div className="p-4 bg-muted rounded-lg text-foreground leading-relaxed text-sm">
      {children || <span className="italic text-muted-foreground">Not provided</span>}
    </div>
  </div>
);

const ApplicationDetails = ({ application, onApprove, onReject, onBack }) => {
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert("Please provide a reason for rejection.");
      return;
    }
    setIsProcessing(true);
    await onReject(application.id, rejectionReason);
    setIsProcessing(false);
  };

  const handleApprove = async () => {
    setIsProcessing(true);
    await onApprove(application.id);
    setIsProcessing(false);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <Button variant="ghost" onClick={onBack} className="mb-4 text-muted-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to List
            </Button>
            <CardTitle className="text-2xl">{application.full_name}</CardTitle>
            <CardDescription>{application.email}</CardDescription>
          </div>
          <div className="text-right">
            <Badge variant="secondary">Pending Verification</Badge>
            <p className="text-sm text-muted-foreground mt-1">Applied: {new Date(application.created_date).toLocaleDateString()}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <DetailSection title="Professional Bio">{application.bio}</DetailSection>
          <DetailSection title="Why They Practice Kambo">{application.why_practitioner}</DetailSection>
        </div>
        <DetailSection title="Training Background">{application.training_background}</DetailSection>
        <DetailSection title="Safety Protocols & Procedures">{application.safety_protocols}</DetailSection>
        
        <Separator />
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <DetailSection title="Years of Experience">{application.years_experience} years</DetailSection>
          <DetailSection title="Pricing Range">{application.pricing_range}</DetailSection>
          <DetailSection title="Website">
            {application.website_url ? <a href={application.website_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{application.website_url}</a> : "Not provided"}
          </DetailSection>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
            <DetailSection title="Specializations">
                <div className="flex flex-wrap gap-2">{application.specializations?.map(s => <Badge key={s}>{s}</Badge>)}</div>
            </DetailSection>
            <DetailSection title="Languages">
                <div className="flex flex-wrap gap-2">{application.languages?.map(l => <Badge key={l} variant="outline">{l}</Badge>)}</div>
            </DetailSection>
        </div>

        <Separator />

        <h3 className="font-semibold text-lg mb-4">Documents</h3>
        <div className="grid md:grid-cols-2 gap-4">
            <Button variant="outline" className="w-full justify-between" onClick={() => openDoc(application.cpr_certification_url)}>
                View CPR Certification <ExternalLink className="w-4 h-4"/>
            </Button>
            <Button variant="outline" className="w-full justify-between" onClick={() => openDoc(application.kambo_certification_url)}>
                View Kambo Certification <ExternalLink className="w-4 h-4"/>
            </Button>
        </div>
        <p className="text-sm text-muted-foreground">CPR Expiration: {application.cpr_expiration_date}</p>

        <Separator />
        
        <div className="space-y-4 pt-4">
          <h3 className="font-semibold text-lg">Admin Actions</h3>
          <div>
            <Label htmlFor="rejectionReason">Rejection Reason (Required if rejecting)</Label>
            <Textarea 
              id="rejectionReason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Provide clear feedback for the applicant..."
              className="mt-1"
            />
          </div>
          <div className="flex justify-end gap-4">
            <Button variant="destructive" onClick={handleReject} disabled={isProcessing || !rejectionReason.trim()}>
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <X className="w-4 h-4 mr-2"/>} Reject Application
            </Button>
            <Button onClick={handleApprove} disabled={isProcessing} className="bg-primary hover:bg-primary/90">
               {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <Check className="w-4 h-4 mr-2"/>} Approve Application
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function VerificationPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pending, setPending] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const currentUser = await User.me();
      if (currentUser.role !== 'admin') {
        setUser(null);
        navigate(createPageUrl("Directory"));
        return;
      }
      setUser(currentUser);
      // A data-fetch failure here must NOT bounce the admin to Directory (was
      // treating a transient error as an auth failure).
      try {
        const pendingApps = await Practitioner.filter({ verification_level: "pending" });
        setPending(pendingApps);
      } catch (dataErr) {
        console.error("Failed to load pending applications:", dataErr);
        setPending([]);
      }
    } catch (e) {
      setUser(null);
      navigate(createPageUrl("Directory"));
    } finally {
      setIsLoading(false);
    }
  }, [navigate]); // navigate is stable and won't cause infinite re-renders

  useEffect(() => {
    loadData();
  }, [loadData]); // loadData is now memoized by useCallback

  const handleApprove = async (id) => {
    const application = pending.find(p => p.id === id);
    if (!application) return;

    await Practitioner.update(id, { is_verified: true, verification_level: "basic" });
    
    await SendEmail({
        to: application.email,
        subject: "Your KamboGuide Application has been Approved!",
        body: `<h1>Congratulations, ${application.full_name}!</h1><p>We are pleased to inform you that your application to become a practitioner on KamboGuide has been approved. Your profile is now live and visible in our directory.</p><p>Welcome to the community!</p><p>The KamboGuide Team</p>`
    });
    
    await Notification.create({
        user_id: application.id, // Assuming practitioner user id is the same as the record id for now
        title: "Application Approved!",
        message: "Congratulations! Your practitioner profile is now live.",
        type: "system",
        priority: "high",
        action_url: createPageUrl("PractitionerDashboard")
    });

    setSelectedApplication(null);
    loadData(); // Refresh list
  };

  const handleReject = async (id, reason) => {
    const application = pending.find(p => p.id === id);
    if (!application) return;

    await Practitioner.update(id, { verification_level: "rejected", rejection_reason: reason });
    
    await SendEmail({
        to: application.email,
        subject: "Update on your KamboGuide Application",
        body: `<h1>Update on Your KamboGuide Application</h1><p>Hello ${application.full_name},</p><p>Thank you for your interest in becoming a practitioner on KamboGuide. After reviewing your application, we are unable to approve it at this time.</p><p><strong>Reason:</strong> ${reason}</p><p>We invite you to address these points and re-apply in the future if you wish.</p><p>Sincerely,<br/>The KamboGuide Team</p>`
    });

    setSelectedApplication(null);
    loadData(); // Refresh list
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen"><Loader2 className="w-10 h-10 text-muted-foreground animate-spin" /></div>;
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center p-6 bg-destructive/10 text-destructive">
        <AlertCircle className="w-16 h-16 mb-4" />
        <h1 className="text-3xl font-bold">Access Denied</h1>
        <p>You must be an administrator to view this page.</p>
      </div>
    );
  }

  if (selectedApplication) {
    return (
      <div className="p-4 sm:p-6">
        <ApplicationDetails 
          application={selectedApplication} 
          onApprove={handleApprove} 
          onReject={handleReject}
          onBack={() => setSelectedApplication(null)}
        />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <PageHeader icon={ShieldCheck} kicker="Admin" title="Practitioner Verification" subtitle="Review and approve pending practitioner applications." className="-mx-4 -mt-4 mb-6 sm:-mx-6 sm:-mt-6" />
      <Card>
        <CardContent>
          {pending.length > 0 ? (
            <div className="space-y-4">
              {pending.map(app => (
                <div 
                  key={app.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => setSelectedApplication(app)}
                >
                  <div className="flex items-center gap-4">
                    <UserIcon className="w-6 h-6 text-muted-foreground" />
                    <div>
                      <p className="font-semibold text-foreground">{app.full_name}</p>
                      <p className="text-sm text-muted-foreground">{app.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Applied on</p>
                    <p className="font-medium">{new Date(app.created_date).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <ShieldCheck className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="font-semibold">No pending applications.</p>
              <p>All applications have been reviewed.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
