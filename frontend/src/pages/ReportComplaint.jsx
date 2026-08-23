import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "../components/dashboard/DashboardLayout";
import UploadImage from "../components/report/UploadImage";
import LocationPicker from "../components/report/LocationPicker";
import IssueForm from "../components/report/IssueForm";
import AISummary from "../components/report/AISummary";

import { useAuth } from "../hooks/useAuth";
import { useNotifications } from "../contexts/NotificationContext";
import { checkDuplicateComplaint, saveComplaint, analyzeComplaintImage, uploadComplaintImage } from "../services/complaintService";
import { AlertTriangle } from "lucide-react";

export default function ReportComplaint() {
  const [image, setImage] = useState(null);
  const [location, setLocation] = useState({ latitude: "", longitude: "", address: "" });
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [ignoreDuplicate, setIgnoreDuplicate] = useState(false);
  const [evidenceWarning, setEvidenceWarning] = useState(null);
  const [ignoreEvidenceWarning, setIgnoreEvidenceWarning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiState, setAiState] = useState({ status: "idle", result: null });
  const SUPPORTED_AI_CATEGORIES = ["Garbage", "Pothole", "Road Damage"];

  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();

  // 1. Trigger actual AI analysis on image upload
  useEffect(() => {
    if (!image) {
      // eslint-disable-next-line
      setAiState({ status: "idle", result: null });
      setEvidenceWarning(null);
      setIgnoreEvidenceWarning(false);
      return;
    }

    const runAnalysis = async () => {
      setAiState({ status: "analyzing", result: null });
      setEvidenceWarning(null);
      setIgnoreEvidenceWarning(false);
      
      try {
        const analysis = await analyzeComplaintImage(image);
        
        let newStatus = "success";
        if (!analysis.available || !analysis.category || analysis.confidence <= 0) {
          newStatus = "no_detection";
        }
        
        setAiState({
          status: newStatus,
          result: analysis
        });
      } catch (err) {
        console.error("AI Analysis failed:", err);
        setAiState({
          status: "error",
          result: { message: err.message || "Unknown error" }
        });
      }
    };
    
    runAnalysis();
  }, [image]);

  // 2. Compute evidence mismatch locally when aiState or category changes
  useEffect(() => {
    if (aiState.status === "idle" || aiState.status === "analyzing" || aiState.status === "error" || !category) {
      // eslint-disable-next-line
      setEvidenceWarning(null);
      return;
    }
    
    // Check if the selected category is even supported by the model
    if (!SUPPORTED_AI_CATEGORIES.includes(category)) {
      setAiState(prev => ({ ...prev, status: "unsupported_category" }));
      setEvidenceWarning(null);
      setIgnoreEvidenceWarning(false);
      return;
    }
    
    // Once we establish category is supported, re-evaluate the actual model detection
    // If the image was originally no_detection, it stays no_detection.
    // We only throw mismatch if the model successfully detected a DIFFERENT supported category.
    if (aiState.status === "no_detection") {
      setEvidenceWarning({ 
        type: "NO_DETECTION",
        title: "AI could not confidently verify this image.",
        message: "The AI did not detect any supported objects.",
        aiCategory: "None",
        confidence: 0
      });
      return;
    }

    if (aiState.status === "success" && aiState.result?.category) {
      if (aiState.result.category.toLowerCase() !== category.toLowerCase()) {
        setEvidenceWarning({
          type: "MISMATCH",
          title: "Image Verification Warning",
          message: "The uploaded image may not match the selected complaint category.",
          aiCategory: aiState.result.category,
          confidence: Math.round(aiState.result.confidence * 100)
        });
      } else {
        setEvidenceWarning(null);
        setIgnoreEvidenceWarning(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiState.result, aiState.status, category]);

  // 3. Populate AISummary preview
  const aiData = useMemo(() => {
    if (aiState.status === "error") {
      return { error: true, message: "AI verification is temporarily unavailable. Please try again." };
    }
    if (aiState.status === "unsupported_category") {
      return { unsupported: true, message: `Automatic image verification is not currently available for ${category}. Your image will still be submitted for review.` };
    }
    if (aiState.result && aiState.status !== "analyzing") {
      return {
        detectedCategory: aiState.result.category || "None",
        confidence: aiState.result.confidence,
        priority: aiState.result.priority || "Unknown",
        estimatedResolution: aiState.result.priority === "High" ? "1-2 Days" : (aiState.result.priority === "Medium" ? "2-4 Days" : "4-7 Days")
      };
    }
    return null; // Fallback to "Waiting for Input" if no image
  }, [aiState, category]);

  const performSubmission = async (evidenceStatus = "NOT_ANALYZED") => {
    const newComplaint = {
      userId: user?.id || "guest",
      category,
      description,
      location: {
        address: location.address,
        latitude: parseFloat(location.latitude),
        longitude: parseFloat(location.longitude)
      },
      imageName: image ? image.name : null,
      aiPrediction: (aiState.result && aiState.status !== "error" && aiState.status !== "unsupported_category") 
        ? aiState.result 
        : (aiState.status === "unsupported_category" 
            ? { available: false, reason: "AI image verification is not currently available for this category" }
            : null),
      evidence_verification_status: evidenceStatus
    };
    
    try {
      const createdComplaint = await saveComplaint(newComplaint);
      
      if (image) {
        try {
          await uploadComplaintImage(createdComplaint.id, image);
          addNotification('success', "Complaint and evidence submitted successfully!");
        } catch (uploadErr) {
          console.error("Image upload error:", uploadErr);
          addNotification('warning', "Complaint submitted successfully, but the evidence image could not be uploaded.");
        }
      } else {
        addNotification('success', "Complaint submitted successfully!");
      }
      
      setCategory("");
      setDescription("");
      setLocation({ latitude: "", longitude: "", address: "" });
      setImage(null);
      
      navigate("/my-complaints");
    } catch (err) {
      addNotification('error', "Failed to submit complaint: " + err.message);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    console.log("SUBMIT DEBUG", {
        category,
        location,
        latitude: location?.latitude,
        longitude: location?.longitude,
        address: location?.address
    });

    const lat = Number.parseFloat(location?.latitude);
    const lng = Number.parseFloat(location?.longitude);

    console.log("SUBMIT DEBUG NUMBERS", {
      lat,
      lng,
      isFiniteLat: Number.isFinite(lat),
      isFiniteLng: Number.isFinite(lng)
    });

    const hasValidLocation =
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180;

    if (!image) {
      addNotification('warning', "Please upload an image.");
      return;
    }

    if (!category) {
      addNotification('warning', "Please select a category.");
      return;
    }

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      addNotification('warning', "Please provide missing coordinates.");
      return;
    }

    if (!hasValidLocation) {
      addNotification('warning', "Invalid coordinates (Latitude: -90 to 90, Longitude: -180 to 180).");
      return;
    }
    
    if (aiState.status === "error") {
       addNotification('warning', "AI analysis failed. Please re-upload the image or try again later.");
       return;
    }

    if (evidenceWarning && !ignoreEvidenceWarning) {
      return; // Stop submission if unresolved evidence warning
    }
    
    setIsSubmitting(true);
    
    try {
      // Check for duplicates before submitting
      if (!duplicateWarning && !ignoreDuplicate) {
        try {
          const checkResult = await checkDuplicateComplaint({
            category,
            latitude: lat,
            longitude: lng,
            description
          });
          if (checkResult.possible_duplicate && checkResult.matches?.length > 0) {
            setDuplicateWarning(checkResult.matches[0]);
            setIsSubmitting(false);
            return; // Stop submission and show warning
          }
        } catch (err) {
          console.error("Duplicate check failed:", err);
          // Proceed with submission if check fails
        }
      }

      const finalEvidenceStatus = evidenceWarning 
        ? evidenceWarning.type 
        : (aiState.status === "unsupported_category" || aiState.status === "no_detection"
            ? "UNVERIFIED" 
            : (aiState.result ? "VERIFIED" : "NOT_ANALYZED"));

      await performSubmission(finalEvidenceStatus);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col">
        <h1 className="text-[28px] md:text-[32px] font-bold text-slate-900 tracking-tight leading-tight">
          Report Civic Issue
        </h1>
        <p className="mt-1.5 text-[15px] font-medium text-slate-500 max-w-2xl">
          Report infrastructure and public service issues in your city.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        {/* Left Column */}
        <div className="flex flex-col gap-6">
          <UploadImage
            image={image}
            setImage={setImage}
          />
          {aiState.status === "analyzing" && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 flex items-center justify-center gap-3">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-blue-900 font-medium">Analyzing image...</span>
            </div>
          )}
          {evidenceWarning && !ignoreEvidenceWarning && (
            <div className="rounded-2xl border border-orange-200 bg-orange-50 p-6">
              <div className="flex items-start gap-4">
                <AlertTriangle className="text-orange-500 shrink-0" size={24} />
                <div className="flex-1">
                  <h3 className="text-orange-900 font-semibold mb-2 flex items-center gap-2">
                    ⚠ {evidenceWarning.title || "Image Verification Warning"}
                  </h3>
                  <p className="text-orange-800 text-[14px] mb-4">
                    {evidenceWarning.message}
                  </p>
                  <div className="bg-white/60 rounded-xl p-4 text-[14px] text-orange-900 mb-4 space-y-1.5">
                    <div><span className="font-medium text-orange-700">Selected Category:</span> {category}</div>
                    <div><span className="font-medium text-orange-700">AI Detected:</span> {evidenceWarning.aiCategory}</div>
                    <div><span className="font-medium text-orange-700">AI Confidence:</span> {evidenceWarning.confidence}%</div>
                  </div>
                  <p className="text-orange-800 text-[14px] mb-4">Please upload a relevant image or verify your complaint.</p>
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => {
                        setImage(null);
                        setEvidenceWarning(null);
                      }}
                      className="px-4 py-2.5 bg-orange-200 text-orange-900 font-semibold rounded-xl hover:bg-orange-300 transition text-[14px]"
                    >
                      Upload Correct Image
                    </button>
                    <button
                      onClick={async () => {
                        setIgnoreEvidenceWarning(true);
                        await performSubmission(evidenceWarning.status);
                      }}
                      className="px-4 py-2.5 bg-white text-orange-800 font-semibold rounded-xl border border-orange-300 hover:bg-orange-50 transition text-[14px]"
                    >
                      Submit Anyway
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {duplicateWarning && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
              <div className="flex items-start gap-4">
                <AlertTriangle className="text-amber-500 shrink-0" size={24} />
                <div className="flex-1">
                  <h3 className="text-amber-900 font-semibold mb-2 flex items-center gap-2">
                    ⚠ Possible Similar Complaint
                  </h3>
                  <p className="text-amber-800 text-[14px] mb-4">
                    A similar complaint was reported nearby.
                  </p>
                  <div className="bg-white/60 rounded-xl p-4 text-[14px] text-amber-900 mb-4 space-y-1.5">
                    <div><span className="font-medium text-amber-700">Complaint ID:</span> {duplicateWarning.complaint_id}</div>
                    <div><span className="font-medium text-amber-700">Category:</span> {duplicateWarning.category}</div>
                    <div><span className="font-medium text-amber-700">Distance:</span> {duplicateWarning.distance_meters} meters</div>
                    <div><span className="font-medium text-amber-700">Reported:</span> {duplicateWarning.reported_date}</div>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={async () => {
                        setIgnoreDuplicate(true);
                        setDuplicateWarning(null);
                        await performSubmission();
                      }}
                      className="px-4 py-2.5 bg-amber-200 text-amber-900 font-semibold rounded-xl hover:bg-amber-300 transition text-[14px]"
                    >
                      Submit Anyway
                    </button>
                    <button
                      onClick={() => {
                        window.open(`/complaints/${duplicateWarning.complaint_id}`, '_blank');
                      }}
                      className="px-4 py-2.5 bg-white text-amber-800 font-semibold rounded-xl border border-amber-300 hover:bg-amber-50 transition text-[14px]"
                    >
                      View Similar Complaint
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          <IssueForm 
            category={category}
            setCategory={setCategory}
            description={description}
            setDescription={setDescription}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          <LocationPicker 
            location={location}
            setLocation={setLocation}
          />
          <AISummary aiData={aiData} hasInput={!!category} />
        </div>
      </div>
    </DashboardLayout>
  );
}