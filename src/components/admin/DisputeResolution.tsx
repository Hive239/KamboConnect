import React, { useState, useEffect } from "react";
import { Report } from "@/entities/all";
import { triageReport } from "@/integrations/Moderation";
import { SendEmail } from "@/integrations/Core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AlertTriangle, 
  CheckCircle,
  Clock
} from "@/lib/icons";
import { format } from "date-fns";

const DisputeCard = ({ report, onUpdate }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [resolution, setResolution] = useState("");
  const [isResolving, setIsResolving] = useState(false);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'investigating': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-primary/10 text-primary';
      default: return 'bg-muted text-foreground';
    }
  };

  const handleResolve = async (action) => {
    setIsResolving(true);
    try {
      // Update report status
      await Report.update(report.id, {
        status: 'resolved',
        resolution_action: action,
        admin_notes: resolution,
        resolved_date: new Date().toISOString()
      });

      // Send email notification to reporter
      if (report.reporter_email) {
        await SendEmail({
          to: report.reporter_email,
          subject: `Update on your KamboConnect report #${report.id}`,
          body: `
            <h2>Report Update</h2>
            <p>Your report has been reviewed and resolved.</p>
            <p><strong>Resolution:</strong> ${action}</p>
            <p><strong>Admin Notes:</strong> ${resolution}</p>
            <p>Thank you for helping keep our community safe.</p>
          `
        });
      }

      onUpdate();
    } catch (error) {
      console.error("Failed to resolve dispute:", error);
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">Report #{report.id?.slice(-8) || 'Unknown'}</CardTitle>
            <p className="text-sm text-muted-foreground">{report.reported_item_type} • {format(new Date(report.created_date), 'MMM d, yyyy h:mm a')}</p>
          </div>
          <div className="flex gap-2">
            <Badge className={getPriorityColor(report.priority)}>
              {report.priority || 'low'} priority
            </Badge>
            <Badge className={getStatusColor(report.status)}>
              {report.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {report.ai_rationale && (
            <div className="flex items-start gap-2 rounded-lg bg-primary/5 p-2 text-xs text-muted-foreground">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 text-primary" />
              <span><span className="font-medium text-primary">AI triage:</span> {report.ai_rationale}</span>
            </div>
          )}
          <div>
            <h4 className="font-medium text-sm text-foreground">Reason:</h4>
            <p className="text-sm">{report.reason}</p>
          </div>
          
          {report.description && (
            <div>
              <h4 className="font-medium text-sm text-foreground">Details:</h4>
              <p className="text-sm bg-muted p-3 rounded">{report.description}</p>
            </div>
          )}

          <div className="flex justify-between">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Hide' : 'Show'} Resolution Tools
            </Button>
            <div className="text-xs text-muted-foreground">
              Reporter: {report.reporter_email || 'Anonymous'}
            </div>
          </div>

          {isExpanded && report.status !== 'resolved' && (
            <div className="border-t pt-4 space-y-3">
              <div>
                <label className="text-sm font-medium">Resolution Notes:</label>
                <Textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="Describe how this issue was resolved..."
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={() => handleResolve('warning_issued')}
                  disabled={isResolving || !resolution.trim()}
                >
                  Issue Warning
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => handleResolve('content_removed')}
                  disabled={isResolving || !resolution.trim()}
                >
                  Remove Content
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleResolve('no_action')}
                  disabled={isResolving || !resolution.trim()}
                >
                  No Action Required
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default function DisputeResolution() {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadReports = async () => {
    try {
      const allReports = await Report.list('-created_date');
      // AI triage: suggest a priority + rationale for each report.
      const enriched = await Promise.all(allReports.map(async (r) => {
        const t = await triageReport(r);
        return { ...r, priority: r.priority || t.priority, ai_rationale: t.rationale };
      }));
      setReports(enriched);
    } catch (error) {
      console.error("Failed to load reports:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const pendingReports = reports.filter(r => r.status === 'pending');
  const activeReports = reports.filter(r => r.status === 'investigating');
  const resolvedReports = reports.filter(r => r.status === 'resolved');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            Dispute Resolution Center
          </CardTitle>
        </CardHeader>
      </Card>

      <Tabs defaultValue="pending">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">
            Pending ({pendingReports.length})
          </TabsTrigger>
          <TabsTrigger value="active">
            Investigating ({activeReports.length})
          </TabsTrigger>
          <TabsTrigger value="resolved">
            Resolved ({resolvedReports.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingReports.length > 0 ? (
            pendingReports.map(report => (
              <DisputeCard key={report.id} report={report} onUpdate={loadReports} />
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-4" />
                <p>No pending reports! ✨</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          {activeReports.length > 0 ? (
            activeReports.map(report => (
              <DisputeCard key={report.id} report={report} onUpdate={loadReports} />
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-4" />
                <p>No active investigations.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="resolved" className="space-y-4">
          {resolvedReports.slice(0, 10).map(report => (
            <DisputeCard key={report.id} report={report} onUpdate={loadReports} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}