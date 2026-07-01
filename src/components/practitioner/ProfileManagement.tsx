import React, { useState } from "react";
import { Practitioner } from "@/entities/Practitioner";
import { UploadFile } from "@/integrations/Core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Upload, Save, User, 
  Camera, Trash2, Plus, Info, CheckCircle, UserCircle 
} from "@/lib/icons";

export default function ProfileManagement({ practitioner, user, onUpdate }) {
  const [profileData, setProfileData] = useState({
    full_name: practitioner.full_name || "",
    email: practitioner.email || "",
    phone: practitioner.phone || "",
    address: practitioner.address || { street: "", city: "", state_province: "", postal_code: "", country: "" },
    bio: practitioner.bio || "",
    years_experience: practitioner.years_experience || 0,
    pricing_range: practitioner.pricing_range || "$",
    website_url: practitioner.website_url || "",
    specializations: practitioner.specializations || [],
    languages: practitioner.languages || ["English"],
    safety_protocols: practitioner.safety_protocols || "",
    training_background: practitioner.training_background || "",
    why_practitioner: practitioner.why_practitioner || "",
    profile_image_url: practitioner.profile_image_url || "",
    image_urls: practitioner.image_urls || []
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newSpecialization, setNewSpecialization] = useState("");
  const [newLanguage, setNewLanguage] = useState("");

  const handleProfileImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log("Uploading profile image:", file.name);
    setIsUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      console.log("Upload successful, URL:", file_url);
      
      // Update local state
      setProfileData(prev => ({ ...prev, profile_image_url: file_url }));
      
      // Save to database immediately
      await Practitioner.update(practitioner.id, { profile_image_url: file_url });
      console.log("Profile image saved to database");
      
      // Refresh parent component
      onUpdate();
    } catch (error) {
      console.error("Failed to upload profile image:", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
      // Clear the file input
      event.target.value = '';
    }
  };

  const handleGalleryImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log("Uploading gallery image:", file.name);
    setIsUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      console.log("Upload successful, URL:", file_url);
      
      // Update local state
      const newImageUrls = [...profileData.image_urls, file_url];
      setProfileData(prev => ({ ...prev, image_urls: newImageUrls }));
      
      // Save to database immediately
      await Practitioner.update(practitioner.id, { image_urls: newImageUrls });
      console.log("Gallery image saved to database");
      
      // Refresh parent component
      onUpdate();
    } catch (error) {
      console.error("Failed to upload gallery image:", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
      // Clear the file input
      event.target.value = '';
    }
  };

  const handleRemoveImage = async (index) => {
    try {
      const updatedUrls = profileData.image_urls.filter((_, i) => i !== index);
      
      // Update local state
      setProfileData(prev => ({ ...prev, image_urls: updatedUrls }));
      
      // Save to database immediately
      await Practitioner.update(practitioner.id, { image_urls: updatedUrls });
      console.log("Gallery image removed from database");
      
      // Refresh parent component
      onUpdate();
    } catch (error) {
      console.error("Failed to remove image:", error);
      alert("Failed to remove image. Please try again.");
      // Revert state if save fails
      setProfileData(prev => ({ ...prev, image_urls: practitioner.image_urls || [] }));
    }
  };

  const addSpecialization = () => {
    if (newSpecialization.trim() && !profileData.specializations.includes(newSpecialization.trim())) {
      setProfileData(prev => ({
        ...prev,
        specializations: [...prev.specializations, newSpecialization.trim()]
      }));
      setNewSpecialization("");
    }
  };

  const removeSpecialization = (index) => {
    setProfileData(prev => ({
      ...prev,
      specializations: prev.specializations.filter((_, i) => i !== index)
    }));
  };

  const addLanguage = () => {
    if (newLanguage.trim() && !profileData.languages.includes(newLanguage.trim())) {
      setProfileData(prev => ({
        ...prev,
        languages: [...prev.languages, newLanguage.trim()]
      }));
      setNewLanguage("");
    }
  };

  const removeLanguage = (index) => {
    if (profileData.languages.length > 1) {
      setProfileData(prev => ({
        ...prev,
        languages: prev.languages.filter((_, i) => i !== index)
      }));
    }
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [name]: value
      }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await Practitioner.update(practitioner.id, profileData);
      onUpdate();
    } catch (error) {
      console.error("Failed to save profile:", error);
      alert("Failed to save profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Photos are saved instantly when uploaded. Other profile changes require clicking "Save Changes" at the bottom.
        </AlertDescription>
      </Alert>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile Image Section */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Profile Photo
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="w-32 h-32 rounded-full bg-muted overflow-hidden mx-auto">
                {profileData.profile_image_url ? (
                  <img 
                    src={profileData.profile_image_url} 
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <UserCircle className="w-24 h-24 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfileImageUpload}
                  className="hidden"
                  id="profile-upload"
                />
                <label htmlFor="profile-upload">
                  <Button disabled={isUploading} className="cursor-pointer" asChild>
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      {isUploading ? "Uploading..." : "Change Photo"}
                    </span>
                  </Button>
                </label>
              </div>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4 text-primary" />
                <span className="text-sm text-primary">Verified Practitioner</span>
              </div>
            </CardContent>
          </Card>

          {/* Gallery Images */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Gallery Images
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {profileData.image_urls.map((url, index) => (
                  <div key={index} className="relative">
                    <img 
                      src={url} 
                      alt={`Gallery ${index + 1}`}
                      className="w-full h-20 object-cover rounded-lg"
                    />
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute top-1 right-1 w-6 h-6"
                      onClick={() => handleRemoveImage(index)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleGalleryImageUpload}
                  className="hidden"
                  id="gallery-upload"
                />
                <label htmlFor="gallery-upload">
                  <Button variant="outline" disabled={isUploading} className="w-full cursor-pointer" asChild>
                    <span>
                      <Plus className="w-4 h-4 mr-2" />
                      {isUploading ? "Uploading..." : "Add Photo"}
                    </span>
                  </Button>
                </label>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profileData.full_name}
                    onChange={(e) => setProfileData(prev => ({...prev, full_name: e.target.value}))}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    value={profileData.email}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) => setProfileData(prev => ({...prev, phone: e.target.value}))}
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    name="country"
                    value={profileData.address.country || ""}
                    onChange={handleAddressChange}
                    placeholder="e.g., USA"
                  />
                </div>
              </div>
              
              <div>
                  <Label>Full Address</Label>
                  <div className="space-y-2">
                      <Input name="street" value={profileData.address.street || ""} onChange={handleAddressChange} placeholder="Street Address" />
                      <div className="grid md:grid-cols-2 gap-4">
                           <Input name="city" value={profileData.address.city || ""} onChange={handleAddressChange} placeholder="City" />
                           <Input name="state_province" value={profileData.address.state_province || ""} onChange={handleAddressChange} placeholder="State / Province" />
                      </div>
                      <Input name="postal_code" value={profileData.address.postal_code || ""} onChange={handleAddressChange} placeholder="Postal / ZIP Code" />
                  </div>
              </div>

              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={profileData.website_url}
                  onChange={(e) => setProfileData(prev => ({...prev, website_url: e.target.value}))}
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </CardContent>
          </Card>

          {/* Professional Details */}
          <Card>
            <CardHeader>
              <CardTitle>Professional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="bio">Professional Bio</Label>
                <Textarea
                  id="bio"
                  value={profileData.bio}
                  onChange={(e) => setProfileData(prev => ({...prev, bio: e.target.value}))}
                  rows={4}
                  placeholder="Tell clients about your approach and experience..."
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="experience">Years of Experience</Label>
                  <Input
                    id="experience"
                    type="number"
                    value={profileData.years_experience}
                    onChange={(e) => setProfileData(prev => ({...prev, years_experience: parseInt(e.target.value) || 0}))}
                  />
                </div>
                <div>
                  <Label htmlFor="pricing">Pricing Range</Label>
                  <Select 
                    value={profileData.pricing_range} 
                    onValueChange={(value) => setProfileData(prev => ({...prev, pricing_range: value}))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="$">$ (Under $100)</SelectItem>
                      <SelectItem value="$$">$$ ($100-200)</SelectItem>
                      <SelectItem value="$$$">$$$ ($200-350)</SelectItem>
                      <SelectItem value="$$$$">$$$$ ($350+)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Specializations */}
              <div>
                <Label>Specializations</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {profileData.specializations.map((spec, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {spec}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-auto p-0 w-4 h-4"
                        onClick={() => removeSpecialization(index)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newSpecialization}
                    onChange={(e) => setNewSpecialization(e.target.value)}
                    placeholder="Add specialization"
                    onKeyPress={(e) => e.key === 'Enter' && addSpecialization()}
                  />
                  <Button onClick={addSpecialization}>Add</Button>
                </div>
              </div>

              {/* Languages */}
              <div>
                <Label>Languages</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {profileData.languages.map((lang, index) => (
                    <Badge key={index} variant="outline" className="flex items-center gap-1">
                      {lang}
                      {profileData.languages.length > 1 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-auto p-0 w-4 h-4"
                          onClick={() => removeLanguage(index)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newLanguage}
                    onChange={(e) => setNewLanguage(e.target.value)}
                    placeholder="Add language"
                    onKeyPress={(e) => e.key === 'Enter' && addLanguage()}
                  />
                  <Button onClick={addLanguage}>Add</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Extended Details */}
          <Card>
            <CardHeader>
              <CardTitle>Extended Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="training">Training Background</Label>
                <Textarea
                  id="training"
                  value={profileData.training_background}
                  onChange={(e) => setProfileData(prev => ({...prev, training_background: e.target.value}))}
                  rows={3}
                  placeholder="Describe your training, certifications, and learning path..."
                />
              </div>

              <div>
                <Label htmlFor="why">Why You Practice</Label>
                <Textarea
                  id="why"
                  value={profileData.why_practitioner}
                  onChange={(e) => setProfileData(prev => ({...prev, why_practitioner: e.target.value}))}
                  rows={3}
                  placeholder="Share your personal journey and motivation..."
                />
              </div>

              <div>
                <Label htmlFor="safety">Safety Protocols</Label>
                <Textarea
                  id="safety"
                  value={profileData.safety_protocols}
                  onChange={(e) => setProfileData(prev => ({...prev, safety_protocols: e.target.value}))}
                  rows={3}
                  placeholder="Describe your safety measures and protocols..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button 
              onClick={handleSave}
              disabled={isSaving}
              className="bg-primary hover:bg-primary/90"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}