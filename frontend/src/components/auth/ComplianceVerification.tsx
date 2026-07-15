import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Camera, CameraOff, CheckCircle, AlertCircle } from 'lucide-react';
import { useFacialAuth } from '../../contexts/FacialAuthContext';

interface ComplianceVerificationProps {
  verificationId: string;
  onVerificationComplete: (verificationId: string) => void;
  onCancel: () => void;
}

const ComplianceVerification: React.FC<ComplianceVerificationProps> = ({
  verificationId,
  onVerificationComplete,
  onCancel,
}) => {
  const { uploadVideo, checkStatus } = useFacialAuth();

  const [audioEnabled, setAudioEnabled] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [verificationComplete, setVerificationComplete] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const userVideoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunks = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Check audio permissions and capabilities
  const checkAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioEnabled(true);
      setError('');
      stream.getTracks().forEach(track => track.stop());
      setCurrentStep(2);
    } catch (err) {
      setError('Please enable audio access to continue');
      setAudioEnabled(false);
    }
  };

  // Enable camera and start preview
  const enableCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: true
      });

      streamRef.current = stream;
      if (userVideoRef.current) {
        userVideoRef.current.srcObject = stream;
      }

      setCameraEnabled(true);
      setError('');
      setCurrentStep(3);
    } catch (err) {
      setError('Please enable camera access to continue');
      setCameraEnabled(false);
    }
  };

  // Start recording user
  const startRecording = () => {
    if (!streamRef.current) return;

    recordedChunks.current = [];

    try {
      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: 'video/webm;codecs=vp9',
      });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(recordedChunks.current, { type: 'video/webm' });
        await uploadVerificationVideo(blob);
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
    } catch (err) {
      setError('Failed to start recording');
      console.error('Recording error:', err);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Upload recorded video via the facial auth context (Supabase Storage + RPC)
  const uploadVerificationVideo = async (blob: Blob) => {
    setUploading(true);
    try {
      const file = new File([blob], `verification-${verificationId}.webm`, { type: 'video/webm' });
      await uploadVideo(verificationId, file);

      setVerificationComplete(true);

      // Poll for verification status
      pollVerificationStatus();
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload verification video');
    } finally {
      setUploading(false);
    }
  };

  // Poll verification status
  const pollVerificationStatus = async () => {
    const maxAttempts = 30; // 30 seconds max
    let attempts = 0;

    const poll = async () => {
      try {
        const status = await checkStatus(verificationId);

        if (status === 'VERIFIED') {
          onVerificationComplete(verificationId);
          return;
        } else if (status === 'FAILED' || status === 'EXPIRED') {
          setError('Verification failed. Please try again.');
          return;
        }

        // Continue polling if still processing
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 1000);
        } else {
          setError('Verification timeout. Please try again.');
        }
      } catch (err) {
        console.error('Status check error:', err);
        setError('Failed to check verification status');
      }
    };

    poll();
  };

  // Play compliance video
  const playComplianceVideo = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setVideoPlaying(true);
      startRecording();
    }
  };

  // Pause compliance video
  const pauseComplianceVideo = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      setVideoPlaying(false);
    }
  };

  // Handle video end
  const handleVideoEnd = () => {
    setVideoPlaying(false);
    stopRecording();
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Facial Recognition Verification
        </h2>
        <p className="text-gray-600">
          Please complete the following steps to verify your identity using facial recognition.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
          }`}>
            {audioEnabled ? <CheckCircle className="w-5 h-5" /> : '1'}
          </div>
          <span className="ml-2 text-sm font-medium">Audio Check</span>
        </div>
        <div className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
          }`}>
            {cameraEnabled ? <CheckCircle className="w-5 h-5" /> : '2'}
          </div>
          <span className="ml-2 text-sm font-medium">Camera Setup</span>
        </div>
        <div className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
          }`}>
            {verificationComplete ? <CheckCircle className="w-5 h-5" /> : '3'}
          </div>
          <span className="ml-2 text-sm font-medium">Verification</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-300 rounded-md flex items-center">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compliance Video Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Verification Instructions</h3>
          <div className="relative bg-gray-900 rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              className="w-full h-64 object-cover"
              onEnded={handleVideoEnd}
              controls={false}
            >
              <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>

            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
              <button
                onClick={videoPlaying ? pauseComplianceVideo : playComplianceVideo}
                disabled={!audioEnabled || !cameraEnabled || uploading}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-gray-400 hover:bg-blue-700 transition-colors"
              >
                {videoPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                {videoPlaying ? 'Pause' : 'Start Verification'}
              </button>

              <div className="flex items-center text-white">
                {audioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                {isRecording && (
                  <div className="ml-2 flex items-center">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-1"></div>
                    <span className="text-sm">Recording</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* User Camera Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Your Camera Feed</h3>
          <div className="relative bg-gray-200 rounded-lg overflow-hidden">
            <video
              ref={userVideoRef}
              className="w-full h-64 object-cover"
              autoPlay
              muted
              playsInline
            />

            <div className="absolute top-4 right-4">
              {cameraEnabled ? (
                <Camera className="w-6 h-6 text-green-500" />
              ) : (
                <CameraOff className="w-6 h-6 text-red-500" />
              )}
            </div>

            {!cameraEnabled && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-300">
                <div className="text-center">
                  <CameraOff className="w-12 h-12 text-gray-500 mx-auto mb-2" />
                  <p className="text-gray-600">Camera Disabled</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="mt-8 flex flex-col space-y-4">
        {currentStep === 1 && (
          <button
            onClick={checkAudio}
            className="w-full py-3 px-6 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center transition-colors"
          >
            <Volume2 className="w-5 h-5 mr-2" />
            Enable Audio
          </button>
        )}

        {currentStep === 2 && (
          <button
            onClick={enableCamera}
            className="w-full py-3 px-6 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center transition-colors"
          >
            <Camera className="w-5 h-5 mr-2" />
            Enable Camera
          </button>
        )}

        {uploading && (
          <div className="p-4 bg-blue-100 border border-blue-300 rounded-md flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-blue-700 font-medium">
              Uploading verification video...
            </span>
          </div>
        )}

        {verificationComplete && !uploading && (
          <div className="p-4 bg-green-100 border border-green-300 rounded-md flex items-center">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
            <span className="text-green-700 font-medium">
              Verification completed! Processing your identity...
            </span>
          </div>
        )}

        <button
          onClick={onCancel}
          className="w-full py-2 px-6 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
        >
          Cancel
        </button>
      </div>

      <div className="mt-6 text-sm text-gray-500">
        <p>
          <strong>Privacy Notice:</strong> This recording is used solely for identity verification
          and will be stored securely according to our data protection policies. Your facial data
          is encrypted and will never be shared with third parties.
        </p>
      </div>
    </div>
  );
};

export default ComplianceVerification;
