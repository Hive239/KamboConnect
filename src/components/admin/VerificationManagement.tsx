
import React, { useState, useEffect } from "react";
import { Practitioner } from "@/entities/Practitioner";
import { Credential, User } from "@/entities/all";
import { makeEntity } from "@/data/store";
import { openDoc } from "@/lib/storage";
import { notify } from "@/lib/notify";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ShieldCheck, 
  CheckCircle, 
  XCircle, 
  Clock,
  ExternalLink,
  Loader2
} from "@/lib/icons";
import { format } from "date-fns";

const ApplicationCard = ({ application, onAction, onUpgrade }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Approval gate: reviewer must confirm each item AND the underlying data must exist.
  const CHECKLIST = [
    { key: "cpr", label: "CPR / First-Aid certification on file & valid", ok: !!application.cpr_certification_url },
    { key: "cert", label: "Kambo training certificate verified", ok: !!application.kambo_certification_url },
    { key: "certifier", label: "Certifier confirmed (contacted / credible)", ok: !!application.certified_by },
    { key: "refs", label: "Client references reviewed", ok: Array.isArray(application.client_references) ? application.client_references.length > 0 : !!application.client_references },
    { key: "screening", label: "Condition-experience & safety answers reviewed", ok: !!application.condition_experience && !!application.safety_protocols },
  ];
  const [checked, setChecked] = useState({});
  const allChecked = CHECKLIST.every((c) => checked[c.key]);
  const dataComplete = CHECKLIST.every((c) => c.ok);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-warning/10 text-warning';
      case 'basic': return 'bg-primary/10 text-primary';
      case 'advanced': return 'bg-info/10 text-info';
      case 'master': return 'bg-clay/10 text-clay';
      case 'rejected': return 'bg-destructive/10 text-destructive';
      default: return 'bg-muted text-foreground';
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{application.full_name}</CardTitle>
            <p className="text-sm text-muted-foreground">{application.email}</p>
            <p className="text-sm text-muted-foreground">
              Applied {format(new Date(application.created_date), 'MMM d, yyyy')}
            </p>
          </div>
          <Badge className={getStatusColor(application.verification_level)}>
            {application.verification_level}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium">Experience:</span> {application.years_experience} years
            </div>
            <div>
              <span className="font-medium">Pricing:</span> {application.pricing_range || 'Not specified'}
            </div>
            <div>
              <span className="font-medium">Languages:</span> {application.languages?.join(', ') || 'Not specified'}
            </div>
          </div>

          {isExpanded && (
            <div className="space-y-4 border-t pt-4">
              <div>
                <h4 className="font-medium mb-2">Bio:</h4>
                <p className="text-sm bg-muted p-3 rounded">{application.bio}</p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Training Background:</h4>
                <p className="text-sm bg-muted p-3 rounded">{application.training_background}</p>
              </div>

              {/* Vetting standard — certifier, volume, condition experience, references */}
              <div className="rounded border border-warning/40 bg-warning/10 p-3 space-y-3">
                <h4 className="font-medium text-warning">Screening & Vetting</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-medium">Certified by:</span>{" "}
                    {application.certified_by || <span className="text-muted-foreground italic">Not provided</span>}
                  </div>
                  <div>
                    <span className="font-medium">Ceremonies performed:</span>{" "}
                    {application.ceremonies_count ?? <span className="text-muted-foreground italic">Not provided</span>}
                  </div>
                </div>
                <div className="text-sm">
                  <span className="font-medium">Experience with medical conditions:</span>
                  <p className="mt-1">{application.condition_experience || <span className="text-muted-foreground italic">Not provided</span>}</p>
                </div>
                <div className="text-sm">
                  <span className="font-medium">Client references:</span>
                  <p className="mt-1 whitespace-pre-line">
                    {Array.isArray(application.client_references)
                      ? application.client_references.join("\n")
                      : (application.client_references || <span className="text-muted-foreground italic">Not provided</span>)}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Safety Protocols:</h4>
                <p className="text-sm bg-muted p-3 rounded">{application.safety_protocols}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Documents:</h4>
                  <div className="space-y-2">
                    {application.cpr_certification_url && (
                      <button
                        type="button"
                        onClick={() => openDoc(application.cpr_certification_url)}
                        className="flex items-center gap-2 text-sm text-info hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        CPR Certification
                      </button>
                    )}
                    {application.kambo_certification_url && (
                      <button
                        type="button"
                        onClick={() => openDoc(application.kambo_certification_url)}
                        className="flex items-center gap-2 text-sm text-info hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Kambo Training Certificate
                      </button>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Specializations:</h4>
                  <div className="flex flex-wrap gap-1">
                    {application.specializations?.map(spec => (
                      <Badge key={spec} variant="outline" className="text-xs">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {application.verification_level === 'pending' && (
            <div className="rounded-lg border border-border bg-muted/40 p-3">
              <p className="text-sm font-medium mb-2">Approval checklist</p>
              <div className="space-y-1.5">
                {CHECKLIST.map((c) => (
                  <label key={c.key} className={`flex items-start gap-2 text-sm ${c.ok ? "" : "opacity-60"}`}>
                    <Checkbox
                      checked={!!checked[c.key]}
                      disabled={!c.ok}
                      onCheckedChange={(v) => setChecked((s) => ({ ...s, [c.key]: !!v }))}
                      className="mt-0.5"
                    />
                    <span>
                      {c.label}
                      {!c.ok && <span className="ml-1 text-xs text-red-600">(missing from application)</span>}
                    </span>
                  </label>
                ))}
              </div>
              {!dataComplete && (
                <p className="mt-2 text-xs text-red-600">This application is missing required items and cannot be approved until the applicant provides them.</p>
              )}
            </div>
          )}

          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Hide Details' : 'View Full Application'}
            </Button>

            <div className="flex gap-2 items-center">
              {application.verification_level === 'pending' && (
                <>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onAction(application.id, 'reject')}
                  >
                    <XCircle className="w-3 h-3 mr-1" />
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    disabled={!allChecked}
                    title={!allChecked ? "Complete the approval checklist first" : undefined}
                    onClick={() => onAction(application.id, 'approve')}
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Approve
                  </Button>
                </>
              )}
              {application.verification_level === 'basic' && (
                  <Button size="sm" onClick={() => onUpgrade(application.id, 'advanced')}>Upgrade to Advanced</Button>
              )}
              {application.verification_level === 'advanced' && (
                  <Button size="sm" onClick={() => onUpgrade(application.id, 'master')}>Upgrade to Master</Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const CredentialCard = ({ credential, onReview }) => (
  <Card className="mb-3">
    <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
      <div className="min-w-0">
        <p className="font-medium">{credential.title} <span className="text-xs capitalize text-muted-foreground">· {credential.type}</span></p>
        <p className="text-sm text-muted-foreground">{[credential.issuer, credential.expiry_date ? `expires ${credential.expiry_date}` : null].filter(Boolean).join(' · ') || 'No issuer listed'}</p>
        <p className="text-xs text-muted-foreground">Practitioner: {credential.practitioner_id}</p>
      </div>
      <div className="flex items-center gap-2">
        {credential.file_uri && (
          <Button variant="outline" size="sm" onClick={() => openDoc(credential.file_uri)}>
            <ExternalLink className="w-3 h-3 mr-1" /> Document
          </Button>
        )}
        <Button variant="destructive" size="sm" onClick={() => onReview(credential.id, 'rejected')}><XCircle className="w-3 h-3 mr-1" /> Reject</Button>
        <Button size="sm" onClick={() => onReview(credential.id, 'verified')}><CheckCircle className="w-3 h-3 mr-1" /> Verify</Button>
      </div>
    </CardContent>
  </Card>
);

export default function VerificationManagement() {
  const [pendingApps, setPendingApps] = useState([]);
  const [approvedApps, setApprovedApps] = useState([]);
  const [rejectedApps, setRejectedApps] = useState([]);
  const [pendingCreds, setPendingCreds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState("pending");

  const loadApplications = async (tab) => {
    setIsLoading(true);
    try {
      if (tab === "credentials") {
        const creds = await Credential.filter({ status: "pending" }, '-created_date');
        setPendingCreds(creds);
      } else if (tab === "pending") {
        const applications = await Practitioner.filter({ verification_level: "pending" }, '-created_date');
        setPendingApps(applications);
      } else if (tab === "approved") {
        // Fetch all verified levels
        const basic = await Practitioner.filter({ verification_level: "basic" }, '-created_date');
        const advanced = await Practitioner.filter({ verification_level: "advanced" }, '-created_date');
        const master = await Practitioner.filter({ verification_level: "master" }, '-created_date');
        setApprovedApps([...basic, ...advanced, ...master]);
      } else if (tab === "rejected") {
        const applications = await Practitioner.filter({ verification_level: "rejected" }, '-created_date');
        setRejectedApps(applications);
      }
    } catch (error) {
      console.error("Failed to load applications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadApplications(currentTab);
  }, [currentTab]);

  const refreshData = () => {
    loadApplications(currentTab);
  };
  
  const handleAction = async (applicationId, action) => {
    try {
      if (action === 'approve') {
        await Practitioner.update(applicationId, {
          is_verified: true,
          verification_level: 'basic'
          // listing_tier stays 'basic' — the chosen desired_tier is charged in Billing
          // after approval (no free Preferred/Featured placement).
        });
        // Grant the practitioner role AND approve the account (unified id = applicationId).
        try { await makeEntity('User').update(applicationId, { role: 'practitioner', status: 'active' }); } catch { /* legacy rows may not map 1:1 */ }
        try {
          await notify({ userId: applicationId, type: 'system', title: "You're approved as a practitioner 🎉",
            body: "Your application was approved. Head to Billing & Growth to activate your chosen plan and go live.",
            link: '/Billing', email: true });
        } catch { /* non-blocking */ }
      } else if (action === 'reject') {
        const reason = prompt('Please provide a reason for rejection:');
        if (reason) {
          await Practitioner.update(applicationId, {
            verification_level: 'rejected',
            rejection_reason: reason
          });
          // Mark the account rejected so they see the honest status (not stuck pending).
          try { await makeEntity('User').update(applicationId, { status: 'rejected' }); } catch { /* non-blocking */ }
          try {
            await notify({ userId: applicationId, type: 'system', title: "Your practitioner application wasn't approved",
              body: `Reason: ${reason}. You are welcome to address the feedback and re-apply.`, email: true });
          } catch { /* non-blocking */ }
        }
      }
      refreshData(); // Refresh current tab
    } catch (error) {
      console.error(`Failed to ${action} application:`, error);
    }
  };
  
  const handleUpgrade = async (id, level) => {
    try {
        await Practitioner.update(id, { verification_level: level });
        refreshData();
    } catch(e) {
        console.error("Failed to upgrade practitioner:", e);
    }
  };

  const reviewCredential = async (id, status) => {
    try {
      const me = await User.me().catch(() => null);
      const cred = pendingCreds.find((c) => c.id === id);
      await Credential.update(id, { status, reviewer_id: me?.id });
      if (cred) {
        const prac = await Practitioner.get(cred.practitioner_id).catch(() => null);
        await notify({
          userId: cred.practitioner_id,
          userEmail: prac?.email,
          type: 'system',
          title: status === 'verified' ? 'Credential verified' : 'Credential not approved',
          body: status === 'verified'
            ? `Your credential "${cred.title}" was verified and now appears on your public profile.`
            : `Your credential "${cred.title}" wasn't approved. Please review and resubmit if needed.`,
          priority: 'normal',
          link: createPageUrl('PractitionerDashboard'),
        });
      }
      loadApplications('credentials');
    } catch (e) {
      console.error("Failed to review credential:", e);
    }
  };


  const renderContent = (applications) => {
    if (isLoading) {
      return (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin" />
            <p>Loading applications...</p>
          </CardContent>
        </Card>
      );
    }

    if (applications.length === 0) {
       return (
         <Card>
           <CardContent className="p-8 text-center text-muted-foreground">
             <Clock className="w-12 h-12 mx-auto mb-4" />
             <p>No applications in this category.</p>
           </CardContent>
         </Card>
       );
    }

    return applications.map(app => (
      <ApplicationCard key={app.id} application={app} onAction={handleAction} onUpgrade={handleUpgrade} />
    ));
  }


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-clay" />
            Practitioner Verification
          </CardTitle>
        </CardHeader>
      </Card>

      <Tabs defaultValue="pending" onValueChange={setCurrentTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending">
            Pending ({pendingApps.length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({approvedApps.length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({rejectedApps.length})
          </TabsTrigger>
          <TabsTrigger value="credentials">
            Credentials ({pendingCreds.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {renderContent(pendingApps)}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {renderContent(approvedApps)}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {renderContent(rejectedApps)}
        </TabsContent>

        <TabsContent value="credentials" className="space-y-4">
          {isLoading ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground"><Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin" /><p>Loading credentials...</p></CardContent></Card>
          ) : pendingCreds.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground"><ShieldCheck className="w-12 h-12 mx-auto mb-4" /><p>No credentials awaiting review.</p></CardContent></Card>
          ) : (
            pendingCreds.map((c) => <CredentialCard key={c.id} credential={c} onReview={reviewCredential} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
