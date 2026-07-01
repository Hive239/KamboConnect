import React, { useState } from 'react';
import PractitionerApplicationForm from '../components/practitioner/PractitionerApplication';
import ApplicationSuccess from '../components/practitioner/ApplicationSuccess';

export default function PractitionerApplicationPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);

  // This function will be called by the form component upon successful submission
  const handleSuccess = () => {
    setIsSubmitted(true);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-muted min-h-screen">
      <div className="max-w-4xl mx-auto">
        {!isSubmitted ? (
          // The form is displayed until it's successfully submitted
          <PractitionerApplicationForm onSuccess={handleSuccess} />
        ) : (
          // After submission, the success message is shown
          <ApplicationSuccess />
        )}
      </div>
    </div>
  );
}