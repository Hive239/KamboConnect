import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Shield, FileText } from "@/lib/icons";
import { PageHeader } from "@/components/ui/PageHeader";

export default function Disclaimer() {
  return (
    <div className="bg-card min-h-screen">
      <PageHeader icon={Shield} kicker="Legal" title="Legal Disclaimer" subtitle="Important legal information and limitations of liability." />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Main Warning */}
        <Alert className="mb-8 border-red-300 bg-red-50">
          <AlertTriangle className="h-5 w-5 text-red-700" />
          <AlertDescription className="text-red-800">
            <strong>Important:</strong> Please read this disclaimer carefully before using this platform. 
            By using the KamboGuide, you acknowledge that you have read, understood, and agree to these terms.
          </AlertDescription>
        </Alert>

        <Card className="bg-card shadow-lg border-border">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-3">
              <Shield className="w-7 h-7 text-red-700" />
              DISCLAIMER & LIMITATION OF LIABILITY
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-foreground leading-relaxed">
            <p>
              The information and services presented on the KamboGuide are intended solely for educational, cultural, and informational purposes. This platform facilitates connection between independent Kambo practitioners and clients but does not employ, endorse, supervise, or assume responsibility for any practitioner, their conduct, or the outcome of any session.
            </p>

            <p>
              Kambo is a traditional shamanic ritual originating from Indigenous Amazonian communities. It is not a medical treatment and is not intended to diagnose, treat, cure, or prevent any disease or medical condition. Statements regarding potential health benefits of Kambo have not been evaluated by the U.S. Food and Drug Administration (FDA).
            </p>

            <p>
              The KamboGuide does not provide medical or psychological advice, nor does it act as a healthcare provider or practitioner. No content or connection made through this platform shall be construed as medical, therapeutic, or clinical guidance. Users are strongly advised to consult a licensed physician or mental health professional regarding any health-related conditions or concerns prior to engaging in any practices discussed or facilitated through this platform.
            </p>

            <p>
              All practitioners listed on the app are independent entities, and any agreements or interactions with them are entered into at the user's own discretion and risk. Users are solely responsible for conducting their own due diligence. The KamboGuide makes no warranties, representations, or guarantees regarding practitioner competence, training, safety practices, or legal compliance.
            </p>

            <div className="bg-red-50 border-l-4 border-red-400 p-4 my-6">
              <p className="font-semibold text-red-800">
                USE OF THIS APP IS AT YOUR OWN RISK.
              </p>
              <p className="text-red-700 mt-2">
                In no event shall the KamboGuide, its creators, affiliates, licensors, or administrators be liable for any direct, indirect, incidental, consequential, or punitive damages arising out of or relating to your use of this platform or engagement with any practitioner listed herein.
              </p>
            </div>

            <p>
              By accessing and using this app, you acknowledge and agree to assume full responsibility for any personal decisions, risks, or outcomes arising from your participation in any ceremonies or interactions related to Kambo. You further agree to indemnify and hold harmless the KamboGuide and its affiliates from any claims, damages, or liabilities, including legal fees, arising from your use of the platform.
            </p>

            <p>
              Testimonials and user experiences shared on the app are individual and anecdotal in nature and should not be interpreted as typical, scientific, or universally applicable. No results are guaranteed or implied.
            </p>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 my-6">
              <p className="font-semibold text-blue-800 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Medical Advice Disclaimer
              </p>
              <p className="text-blue-700 mt-2">
                <strong>ALWAYS SEEK THE ADVICE OF A QUALIFIED PHYSICIAN OR HEALTHCARE PROVIDER</strong> with any questions you may have regarding a medical or psychological condition. Never disregard medical advice or delay seeking it because of information accessed through this app.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground italic">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}