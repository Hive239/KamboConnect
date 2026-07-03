
import React, { useState, useEffect } from "react";
import { Practitioner, User, Notification } from "@/entities/all";
import { UploadPrivateFile, SendEmail } from "@/integrations/Core";
import { geocodeAddress } from "@/lib/geocode";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Save, User as UserIcon, Info, CheckCircle, Loader2, FileText, AlertTriangle } from "@/lib/icons";

export default function PractitionerApplicationForm({ onSuccess }) {
  const [user, setUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    address: { street: "", city: "", state_province: "", postal_code: "", country: "" },
    bio: "",
    years_experience: 0,
    pricing_range: "$$",
    website_url: "",
    specializations: [],
    languages: ["English"],
    safety_protocols: "",
    training_background: "",
    why_practitioner: "",
    cpr_certification_url: "",
    cpr_expiration_date: "",
    kambo_certification_url: "",
    // Vetting standard
    certified_by: "",
    ceremonies_count: "",
    condition_experience: "",
    client_references: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const [isUploading, setIsUploading] = useState({ cpr: false, kambo: false });

  const [networkStatus, setNetworkStatus] = useState('online');
  const [retryAttempt, setRetryAttempt] = useState(0);

  useEffect(() => {
    const fetchUser = async () => {
      setIsLoadingUser(true);
      try {
        const currentUser = await User.me();
        setUser(currentUser);
        setFormData(prev => ({
          ...prev,
          full_name: currentUser.full_name || "",
          email: currentUser.email || ""
        }));
      } catch (e) {
        setUser(null);
      } finally {
        setIsLoadingUser(false);
      }
    };
    fetchUser();
  }, []);

  const validateForm = () => {
    const errors = {};
    
    if (!formData.full_name.trim()) errors.full_name = "Full name is required";
    if (!formData.email.trim()) errors.email = "Email is required";
    if (!formData.training_background.trim()) errors.training_background = "Training background is required";
    if (!formData.safety_protocols.trim()) errors.safety_protocols = "Safety protocols are required";
    if (!formData.why_practitioner.trim()) errors.why_practitioner = "Please explain why you practice Kambo";
    if (!formData.cpr_certification_url) errors.cpr_certification_url = "CPR certification upload is required";
    if (!formData.kambo_certification_url) errors.kambo_certification_url = "Kambo certification upload is required";
    if (!formData.cpr_expiration_date) errors.cpr_expiration_date = "CPR expiration date is required";

    // Vetting standard — all required for review
    if (!formData.certified_by.trim()) errors.certified_by = "Please name who certified you (and their contact)";
    if (!String(formData.ceremonies_count).trim() || Number(formData.ceremonies_count) < 0)
      errors.ceremonies_count = "Approximate number of ceremonies is required";
    if (!formData.condition_experience.trim()) errors.condition_experience = "Please describe your experience with medical conditions";
    if (!formData.client_references.trim()) errors.client_references = "At least 2 client references are required";

    // Address validation
    if (!formData.address.street.trim()) errors.address_street = "Street address is required";
    if (!formData.address.city.trim()) errors.address_city = "City is required";
    if (!formData.address.country.trim()) errors.address_country = "Country is required";
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFileUpload = async (file, type) => {
    if (!file) return;
    setIsUploading(prev => ({ ...prev, [type]: true }));
    setError("");
    
    try {
      const { file_uri } = await UploadPrivateFile({ file });
      setFormData(prev => ({ ...prev, [`${type}_certification_url`]: file_uri }));
      
      // Clear validation error if file was uploaded successfully
      setValidationErrors(prev => ({ ...prev, [`${type}_certification_url`]: null }));
    } catch (err) {
      console.error(`Failed to upload ${type} file:`, err);
      setError(`Failed to upload ${type} document. Please try again.`);
    } finally {
      setIsUploading(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleAddressResolved = (addr) => {
    setFormData(prev => ({
      ...prev,
      address: {
        street: addr.street || prev.address.street,
        city: addr.city || "",
        state_province: addr.state_province || "",
        postal_code: addr.postal_code || "",
        country: addr.country || "",
      },
      latitude: addr.latitude ?? null,
      longitude: addr.longitude ?? null,
    }));
    setValidationErrors(prev => ({ ...prev, address_street: null, address_city: null, address_country: null }));
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, address: { ...prev.address, [name]: value } }));
    
    // Clear validation error
    setValidationErrors(prev => ({ ...prev, [`address_${name}`]: null }));
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error
    setValidationErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setNetworkStatus('online');


    if (!validateForm()) {
      setError("Please fill in all required fields marked with *");
      return;
    }

    setIsSubmitting(true);
    const maxRetries = 3;
    let attempt = 0;

    const attemptSubmission = async () => {
      try {
        attempt++;
        setRetryAttempt(attempt);

        // Check network connectivity first
        if (!navigator.onLine) {
          setNetworkStatus('offline');
          throw new Error('You appear to be offline. Please check your internet connection.');
        }

        // Prefer coords the user picked from autocomplete; else geocode the typed address.
        const location = (formData.latitude && formData.longitude)
          ? { lat: formData.latitude, lng: formData.longitude }
          : await geocodeAddress(formData.address);

        // Unified identity: the practitioner listing id === the owner's user id.
        const owner = await User.me().catch(() => null);
        // Tier chosen at signup (carried via ?desired_tier=). Applied on admin approval.
        const desiredTier = new URLSearchParams(window.location.search).get("desired_tier");
        const applicationData = {
          ...formData,
          ...(owner ? { id: owner.id, user_id: owner.id } : {}),
          is_verified: false,
          verification_level: 'pending',
          desired_tier: desiredTier && ["basic", "preferred", "featured"].includes(desiredTier) ? desiredTier : "basic",
          latitude: location?.lat || null,
          longitude: location?.lng || null,
          // Coerce screening fields to their column types.
          ceremonies_count: formData.ceremonies_count ? Number(formData.ceremonies_count) : null,
          client_references: formData.client_references ? [formData.client_references] : null,
        };

        const newPractitioner = await Practitioner.create(applicationData);

        // Try notifications and email, but don't fail if they don't work
        try {
          const admins = await User.filter({ role: 'admin' });
          for (const admin of admins) {
            await Notification.create({
              user_id: admin.id,
              title: "New Practitioner Application",
              message: `${formData.full_name} has submitted an application for review.`,
              type: "system",
              priority: "high",
              action_url: `/Verification`
            });
          }
        } catch (notifError) {
          console.warn("⚠️ Notifications failed (non-critical):", notifError.message);
        }
        
        try {
          await SendEmail({
            to: formData.email,
            subject: "We've Received Your KamboGuide Application",
            body: `<h1>Thank You, ${formData.full_name}!</h1><p>We have successfully received your practitioner application. Our team will review it within the next 5-7 business days. We'll notify you via email once your application has been processed.</p><p>The KamboGuide Team</p>`
          });
        } catch (emailError) {
          console.warn("⚠️ Email failed (non-critical):", emailError.message);
        }

        onSuccess();
        return true; // Indicate success
      } catch (err) {
        console.error(`❌ Attempt ${attempt} failed:`, err.message);
        
        // Determine if this is a network error that should be retried
        const isNetworkError = err.message.includes('Network Error') || 
                              err.message.includes('ERR_NETWORK') ||
                              err.message.includes('ERR_INTERNET_DISCONNECTED') ||
                              err.message.includes('Failed to fetch') ||
                              err.message.includes('offline') ||
                              err.name === 'NetworkError';

        if (isNetworkError) {
          setNetworkStatus('unstable');
          
          if (attempt < maxRetries) {
            setTimeout(() => attemptSubmission(), attempt * 2000); // Exponential backoff
            return false; // Indicate failure but might retry
          } else {
            setError(`Network connectivity issues prevented submission after ${maxRetries} attempts. Please check your internet connection and try again.`);
            return false; // Indicate final failure
          }
        } else {
          // Non-network error - don't retry
          setError(`Submission failed: ${err.message}. Please check your information and try again.`);
          return false; // Indicate final failure
        }
      }
    };

    await attemptSubmission();
    // These will be executed once all attempts (including retries) are complete or a final error occurs
    setIsSubmitting(false);
    setRetryAttempt(0);
  };

  if (isLoadingUser) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-center">Become a Kambo Practitioner</CardTitle>
        <CardDescription className="text-center text-muted-foreground">Join our community of trusted practitioners. Complete the form below to begin.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-4 p-6 border rounded-lg">
            <h3 className="text-xl font-semibold flex items-center gap-2"><UserIcon/>Personal Information</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="full_name">Full Name *</Label>
                <Input 
                  id="full_name" 
                  value={formData.full_name} 
                  onChange={(e) => handleInputChange('full_name', e.target.value)} 
                  required 
                  className={validationErrors.full_name ? "border-red-500" : ""}
                />
                {validationErrors.full_name && <p className="text-red-500 text-sm mt-1">{validationErrors.full_name}</p>}
              </div>
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                  disabled={!!user}
                  placeholder="your.email@example.com"
                  className={`${!!user ? "bg-muted cursor-not-allowed" : ""} ${validationErrors.email ? "border-red-500" : ""}`}
                />
                {user && <p className="text-xs text-muted-foreground mt-1">Email is pre-filled from your logged-in account.</p>}
                {validationErrors.email && <p className="text-red-500 text-sm mt-1">{validationErrors.email}</p>}
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" value={formData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="website_url">Website or Social Media URL</Label>
                <Input id="website_url" value={formData.website_url} onChange={(e) => handleInputChange('website_url', e.target.value)} placeholder="https://"/>
              </div>
            </div>
            
            <div>
              <Label>Primary Location Address *</Label>
              <div className="space-y-2 p-3 bg-muted rounded-md border">
                <AddressAutocomplete
                  value={formData.address.street ? `${formData.address.street}, ${formData.address.city || ""}` : ""}
                  onSelect={handleAddressResolved}
                  placeholder="Search your address…"
                />
                <p className="text-xs text-muted-foreground">Search to auto-fill and pin your real location, or enter it manually below.</p>
                <Input
                  name="street"
                  value={formData.address.street}
                  onChange={handleAddressChange}
                  placeholder="Street Address"
                  required
                  className={validationErrors.address_street ? "border-red-500" : ""}
                />
                {validationErrors.address_street && <p className="text-red-500 text-sm">{validationErrors.address_street}</p>}
                
                <div className="grid md:grid-cols-3 gap-2">
                  <div>
                    <Input 
                      name="city" 
                      value={formData.address.city} 
                      onChange={handleAddressChange} 
                      placeholder="City" 
                      required
                      className={validationErrors.address_city ? "border-red-500" : ""}
                    />
                    {validationErrors.address_city && <p className="text-red-500 text-sm">{validationErrors.address_city}</p>}
                  </div>
                  <Input name="state_province" value={formData.address.state_province} onChange={handleAddressChange} placeholder="State / Province"/>
                  <Input name="postal_code" value={formData.address.postal_code} onChange={handleAddressChange} placeholder="Postal / ZIP Code"/>
                </div>
                
                <Input 
                  name="country" 
                  value={formData.address.country} 
                  onChange={handleAddressChange} 
                  placeholder="Country" 
                  required
                  className={validationErrors.address_country ? "border-red-500" : ""}
                />
                {validationErrors.address_country && <p className="text-red-500 text-sm">{validationErrors.address_country}</p>}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Your exact address will not be public. This is used for location-based searches.</p>
            </div>
          </div>
          
          <div className="space-y-4 p-6 border rounded-lg">
            <h3 className="text-xl font-semibold flex items-center gap-2"><Info/>Professional Background</h3>
            
            <div>
              <Label htmlFor="training_background">Training & Lineage *</Label>
              <Textarea 
                id="training_background" 
                value={formData.training_background} 
                onChange={(e) => handleInputChange('training_background', e.target.value)} 
                rows={4} 
                placeholder="Describe where you trained, who you learned from, and your lineage..." 
                required 
                className={validationErrors.training_background ? "border-red-500" : ""}
              />
              {validationErrors.training_background && <p className="text-red-500 text-sm mt-1">{validationErrors.training_background}</p>}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="certified_by">Who certified you? (name & contact) *</Label>
                <Input
                  id="certified_by"
                  value={formData.certified_by}
                  onChange={(e) => handleInputChange('certified_by', e.target.value)}
                  placeholder="Trainer / certifying body + how to reach them"
                  className={validationErrors.certified_by ? "border-red-500" : ""}
                />
                {validationErrors.certified_by && <p className="text-red-500 text-sm mt-1">{validationErrors.certified_by}</p>}
              </div>
              <div>
                <Label htmlFor="ceremonies_count">Approx. ceremonies performed *</Label>
                <Input
                  id="ceremonies_count"
                  type="number"
                  min="0"
                  value={formData.ceremonies_count}
                  onChange={(e) => handleInputChange('ceremonies_count', e.target.value)}
                  placeholder="e.g. 250"
                  className={validationErrors.ceremonies_count ? "border-red-500" : ""}
                />
                {validationErrors.ceremonies_count && <p className="text-red-500 text-sm mt-1">{validationErrors.ceremonies_count}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="condition_experience">Experience with clients who have medical conditions *</Label>
              <Textarea
                id="condition_experience"
                value={formData.condition_experience}
                onChange={(e) => handleInputChange('condition_experience', e.target.value)}
                rows={3}
                placeholder="Briefly describe any experience working with clients who have/had cancer, autoimmune, or other diagnosed conditions."
                className={validationErrors.condition_experience ? "border-red-500" : ""}
              />
              {validationErrors.condition_experience && <p className="text-red-500 text-sm mt-1">{validationErrors.condition_experience}</p>}
            </div>

            <div>
              <Label htmlFor="client_references">Client references (at least 2) *</Label>
              <Textarea
                id="client_references"
                value={formData.client_references}
                onChange={(e) => handleInputChange('client_references', e.target.value)}
                rows={3}
                placeholder="Name + contact for 2 clients you've worked with (for verification only, kept private)."
                className={validationErrors.client_references ? "border-red-500" : ""}
              />
              {validationErrors.client_references && <p className="text-red-500 text-sm mt-1">{validationErrors.client_references}</p>}
            </div>

            <div>
              <Label htmlFor="why_practitioner">Your "Why" *</Label>
              <Textarea 
                id="why_practitioner" 
                value={formData.why_practitioner} 
                onChange={(e) => handleInputChange('why_practitioner', e.target.value)} 
                rows={4} 
                placeholder="What called you to serve Kambo? Share your story." 
                required 
                className={validationErrors.why_practitioner ? "border-red-500" : ""}
              />
              {validationErrors.why_practitioner && <p className="text-red-500 text-sm mt-1">{validationErrors.why_practitioner}</p>}
            </div>
            
            <div>
              <Label htmlFor="safety_protocols">Safety Protocols & Screening Process *</Label>
              <Textarea 
                id="safety_protocols" 
                value={formData.safety_protocols} 
                onChange={(e) => handleInputChange('safety_protocols', e.target.value)} 
                rows={4} 
                placeholder="Detail your process for screening clients for contraindications, and the safety measures you take during a ceremony." 
                required 
                className={validationErrors.safety_protocols ? "border-red-500" : ""}
              />
              {validationErrors.safety_protocols && <p className="text-red-500 text-sm mt-1">{validationErrors.safety_protocols}</p>}
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="years_experience">Years of Experience *</Label>
                <Input 
                  id="years_experience" 
                  type="number" 
                  value={formData.years_experience} 
                  onChange={(e) => handleInputChange('years_experience', parseInt(e.target.value) || 0)} 
                  required 
                />
              </div>
              <div>
                <Label htmlFor="pricing_range">Typical Pricing Range *</Label>
                <Select value={formData.pricing_range} onValueChange={(value) => handleInputChange('pricing_range', value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="$">$ (Under $100)</SelectItem>
                    <SelectItem value="$$">$$ ($100-200)</SelectItem>
                    <SelectItem value="$$$">$$$ ($200-350)</SelectItem>
                    <SelectItem value="$$$$">$$$$ ($350+)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-4 p-6 border rounded-lg">
            <h3 className="text-xl font-semibold flex items-center gap-2"><FileText/>Document Upload</h3>
            <p className="text-sm text-muted-foreground">Your documents are stored securely and are only visible to platform administrators for verification purposes.</p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="cpr_certification_url">CPR/First-Aid Certification *</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    id="cpr_upload" 
                    type="file" 
                    accept=".pdf,.jpg,.jpeg,.png" 
                    onChange={(e) => handleFileUpload(e.target.files[0], 'cpr')} 
                    className={`flex-1 ${validationErrors.cpr_certification_url ? "border-red-500" : ""}`}
                  />
                  {isUploading.cpr && <Loader2 className="w-4 h-4 animate-spin"/>}
                </div>
                {formData.cpr_certification_url && <p className="text-sm text-primary flex items-center gap-1"><CheckCircle className="w-4 h-4"/> Document Uploaded</p>}
                {validationErrors.cpr_certification_url && <p className="text-red-500 text-sm">{validationErrors.cpr_certification_url}</p>}
                
                <Label htmlFor="cpr_expiration_date" className="mt-2 block">CPR Expiration Date *</Label>
                <Input 
                  id="cpr_expiration_date" 
                  type="date" 
                  value={formData.cpr_expiration_date} 
                  onChange={(e) => handleInputChange('cpr_expiration_date', e.target.value)} 
                  required 
                  className={validationErrors.cpr_expiration_date ? "border-red-500" : ""}
                />
                {validationErrors.cpr_expiration_date && <p className="text-red-500 text-sm">{validationErrors.cpr_expiration_date}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="kambo_certification_url">Kambo Training Certification *</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    id="kambo_upload" 
                    type="file" 
                    accept=".pdf,.jpg,.jpeg,.png" 
                    onChange={(e) => handleFileUpload(e.target.files[0], 'kambo')} 
                    className={`flex-1 ${validationErrors.kambo_certification_url ? "border-red-500" : ""}`}
                  />
                  {isUploading.kambo && <Loader2 className="w-4 h-4 animate-spin"/>}
                </div>
                {formData.kambo_certification_url && <p className="text-sm text-primary flex items-center gap-1"><CheckCircle className="w-4 h-4"/> Document Uploaded</p>}
                {validationErrors.kambo_certification_url && <p className="text-red-500 text-sm">{validationErrors.kambo_certification_url}</p>}
              </div>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {error}
                {networkStatus === 'offline' && (
                  <div className="mt-2">
                    <p className="text-sm">📶 Network Status: Offline</p>
                    <p className="text-xs">Please check your internet connection and try again.</p>
                  </div>
                )}
                {networkStatus === 'unstable' && retryAttempt > 0 && retryAttempt <= 3 && (
                  <div className="mt-2">
                    <p className="text-sm">📶 Network Status: Unstable</p>
                    <p className="text-xs">Connection issues detected. The form is automatically retrying.</p>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end pt-6 border-t">
            <Button 
              type="submit" 
              size="lg" 
              disabled={isSubmitting || Object.values(isUploading).some(v => v)} 
              className="bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin"/>
                  {retryAttempt > 0 ? `Retrying... (Attempt ${retryAttempt}/3)` : 'Submitting Application...'}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2"/>
                  Submit Application
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
