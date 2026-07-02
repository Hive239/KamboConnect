import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Clock, Mail, FileText, Users, Shield } from "@/lib/icons";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

export default function ApplicationSuccess({ practitioner }) {
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-4">Application Submitted Successfully!</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Thank you for applying to become a verified practitioner on KamboGuide. 
          Your application is now under review.
        </p>
      </div>

      <Alert className="border-primary/20 bg-primary/5">
        <Mail className="h-4 w-4 text-primary" />
        <AlertDescription className="text-primary">
          <strong>Confirmation Email Sent:</strong> We've sent a confirmation email to {practitioner.email} with your application details and next steps.
        </AlertDescription>
      </Alert>

      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-info" />
            What Happens Next?
          </h2>
          
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-info/10 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold text-info">1</span>
              </div>
              <div>
                <h3 className="font-medium text-foreground">Initial Review (1-2 days)</h3>
                <p className="text-sm text-muted-foreground">Our team reviews your application and basic credentials.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 bg-info/10 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold text-info">2</span>
              </div>
              <div>
                <h3 className="font-medium text-foreground">Verification Process (2-3 days)</h3>
                <p className="text-sm text-muted-foreground">Background check, training verification, and safety protocol review.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 bg-info/10 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold text-info">3</span>
              </div>
              <div>
                <h3 className="font-medium text-foreground">Final Approval & Activation</h3>
                <p className="text-sm text-muted-foreground">Profile activation and access to practitioner dashboard.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Once Approved, You'll Get Access To:
          </h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-primary mt-1" />
              <div>
                <h3 className="font-medium text-foreground">Full Practitioner Dashboard</h3>
                <p className="text-sm text-muted-foreground">Manage bookings, messages, and profile</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-primary mt-1" />
              <div>
                <h3 className="font-medium text-foreground">Event Creation</h3>
                <p className="text-sm text-muted-foreground">Host circles, workshops, and retreats</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-primary mt-1" />
              <div>
                <h3 className="font-medium text-foreground">Verified Badge</h3>
                <p className="text-sm text-muted-foreground">Show clients you're verified and trusted</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-primary mt-1" />
              <div>
                <h3 className="font-medium text-foreground">Client Communication</h3>
                <p className="text-sm text-muted-foreground">Direct messaging and booking management</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center space-y-4">
        <p className="text-muted-foreground">
          Have questions about your application? We're here to help.
        </p>
        <div className="flex justify-center gap-4">
          <Link to={createPageUrl("Community")}>
            <Button variant="outline">
              Visit Community
            </Button>
          </Link>
          <Link to={createPageUrl("Directory")}>
            <Button className="bg-primary hover:bg-primary/90">
              Browse Practitioners
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}