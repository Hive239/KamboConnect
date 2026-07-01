
import React, { useState, useEffect } from "react";
import { Practitioner } from "@/entities/Practitioner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'basic': return 'bg-primary/10 text-primary';
      case 'advanced': return 'bg-blue-100 text-blue-800';
      case 'master': return 'bg-purple-100 text-purple-800';
      case 'rejected': return 'bg-red-100 text-red-800';
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

              <div>
                <h4 className="font-medium mb-2">Safety Protocols:</h4>
                <p className="text-sm bg-muted p-3 rounded">{application.safety_protocols}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Documents:</h4>
                  <div className="space-y-2">
                    {application.cpr_certification_url && (
                      <a 
                        href={application.cpr_certification_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        CPR Certification
                      </a>
                    )}
                    {application.kambo_certification_url && (
                      <a 
                        href={application.kambo_certification_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Kambo Training Certificate
                      </a>
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

export default function VerificationManagement() {
  const [pendingApps, setPendingApps] = useState([]);
  const [approvedApps, setApprovedApps] = useState([]);
  const [rejectedApps, setRejectedApps] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState("pending");

  const loadApplications = async (tab) => {
    setIsLoading(true);
    try {
      if (tab === "pending") {
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
        });
      } else if (action === 'reject') {
        const reason = prompt('Please provide a reason for rejection:');
        if (reason) {
          await Practitioner.update(applicationId, {
            verification_level: 'rejected',
            rejection_reason: reason
          });
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
            <ShieldCheck className="w-5 h-5 text-purple-600" />
            Practitioner Verification
          </CardTitle>
        </CardHeader>
      </Card>

      <Tabs defaultValue="pending" onValueChange={setCurrentTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">
            Pending ({pendingApps.length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({approvedApps.length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({rejectedApps.length})
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
      </Tabs>
    </div>
  );
}
