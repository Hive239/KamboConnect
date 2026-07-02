import React, { useState } from "react";
import { User } from "@/entities/User";
import { UploadFile } from "@/integrations/Core";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, X, Check, Loader2 } from "@/lib/icons";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ProfilePictureUpload({ user, onUpdate }) {
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Reset previous errors
    setError(null);

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError("Please select an image file (JPEG, PNG, GIF, etc.)");
      return;
    }
    
    setSelectedFile(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target.result);
    reader.readAsDataURL(file);
    
    setShowUploadModal(true);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    setError(null);
    
    try {
      // Upload the file
      const uploadResult = await UploadFile({ file: selectedFile });
      
      // Update user profile with new image URL
      await User.updateMyUserData({ 
        profile_image_url: uploadResult.file_url 
      });
      
      // Notify parent component to refresh user data
      if (onUpdate) {
        onUpdate();
      }
      
      // Close modal and reset state
      setShowUploadModal(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      
    } catch (error) {
      console.error("Failed to upload profile picture:", error);
      setError("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setShowUploadModal(false);
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
  };

  const handleRemovePhoto = async () => {
    setIsUploading(true);
    setError(null);
    
    try {
      await User.updateMyUserData({ 
        profile_image_url: null 
      });
      
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error("Failed to remove profile picture:", error);
      setError("Failed to remove image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <div className="relative group">
        <Avatar className="w-24 h-24 border-4 border-white shadow-md">
          <AvatarImage src={user?.profile_image_url} alt={user?.full_name} />
          <AvatarFallback className="text-3xl bg-gradient-to-br from-primary/10 to-clay/20 text-primary">
            {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        
        {/* Hover overlay for upload */}
        <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full flex items-center justify-center">
          <Camera className="w-6 h-6 text-white" />
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
          />
        </label>
        
        {/* Loading spinner overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
        )}
      </div>

      {/* Error display */}
      {error && (
        <Alert className="mt-4 border-red-200 bg-red-50">
          <X className="h-4 w-4 text-red-700" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Upload Confirmation Modal */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Profile Picture</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {previewUrl && (
              <div className="flex justify-center">
                <Avatar className="w-32 h-32 border-4 border-border">
                  <AvatarImage src={previewUrl} alt="Preview" />
                </Avatar>
              </div>
            )}
            
            <p className="text-sm text-muted-foreground text-center">
              Are you happy with this new profile picture?
            </p>

            {error && (
              <Alert className="border-red-200 bg-red-50">
                <X className="h-4 w-4 text-red-700" />
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isUploading}
                className="flex-1"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={isUploading}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Update Picture
                  </>
                )}
              </Button>
            </div>

            {/* Option to remove existing photo */}
            {user?.profile_image_url && !isUploading && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-input" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-card px-2 text-muted-foreground">or</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  onClick={handleRemovePhoto}
                  className="w-full text-red-700 hover:text-red-700 hover:bg-red-50"
                >
                  Remove Current Photo
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}