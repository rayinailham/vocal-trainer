'use client';

/**
 * MicrophoneSelector Component
 *
 * Handles microphone device selection and permission management.
 *
 * In the simplified vocal range flow, this component:
 * - Auto-initializes audio when device is selected
 * - Provides immediate feedback on permission status
 * - Supports both full and compact display modes
 * - Handles device changes gracefully
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { MicrophonePermission } from '@/types/audio';

interface MediaDeviceInfoWithPermission {
  deviceId: string;
  label: string;
  groupId: string;
  kind: MediaDeviceKind;
  uniqueId: string;
  permissionGranted?: boolean;
}

interface MicrophoneSelectorProps {
  onDeviceSelected: (deviceId: string) => void;
  onPermissionChange?: (permission: MicrophonePermission) => void;
  selectedDeviceId?: string;
  className?: string;
  compact?: boolean;
}

export default function MicrophoneSelector({
  onDeviceSelected,
  onPermissionChange,
  selectedDeviceId,
  className = '',
  compact = false
}: MicrophoneSelectorProps) {
  const [devices, setDevices] = useState<MediaDeviceInfoWithPermission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingPermission, setIsCheckingPermission] = useState(false);
  const enumerationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const devicesRef = useRef<MediaDeviceInfoWithPermission[]>([]);
  const isEnumeratingRef = useRef(false);
  
  // Update ref when devices change
  useEffect(() => {
    devicesRef.current = devices;
  }, [devices]);

  /**
   * Enumerates available audio input devices
   *
   * This function handles the complex process of:
   * - Requesting microphone permissions
   - Getting device list
   - Creating unique identifiers for devices
   - Auto-selecting first available device
   */
  const enumerateDevices = useCallback(async () => {
    // Prevent multiple simultaneous enumerations
    if (isEnumeratingRef.current) {
      return;
    }
    
    // Clear any pending enumeration to prevent race conditions
    if (enumerationTimeoutRef.current) {
      clearTimeout(enumerationTimeoutRef.current);
    }
    
    isEnumeratingRef.current = true;
    setIsLoading(true);
    setError(null);
    
    try {
      // First, we need to get permission to access devices
      console.log('[MicrophoneSelector] Requesting temporary microphone access for device enumeration...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('[MicrophoneSelector] Temporary stream created, tracks:', stream.getTracks().length);
      
      // Then enumerate devices
      const deviceList = await navigator.mediaDevices.enumerateDevices();
      
      // Stop the stream to free up the microphone
      console.log('[MicrophoneSelector] Stopping temporary stream tracks...');
      stream.getTracks().forEach((track, index) => {
        console.log(`[MicrophoneSelector] Stopping temporary track ${index}:`, track.label);
        track.stop();
      });
      console.log('[MicrophoneSelector] Temporary stream stopped');
      
      
      const audioInputs = deviceList
        .filter(device => device.kind === 'audioinput')
        .map((device, index) => {
          // Create a completely new object to avoid reference issues
          const newDevice = {
            deviceId: device.deviceId,
            label: device.label,
            groupId: device.groupId,
            kind: device.kind,
            // Create a unique identifier even if deviceId is empty
            uniqueId: device.deviceId || `audioinput-${index}-${Date.now()}`,
            permissionGranted: true
          };
          
          return newDevice;
        });
      
      const devicesWithLabels = audioInputs.map((newDevice, index) => {
        const previousDevices = devicesRef.current;
        
        // Create a new object to avoid reference issues
        let finalDevice: MediaDeviceInfoWithPermission = {
          deviceId: newDevice.deviceId,
          label: newDevice.label,
          groupId: newDevice.groupId,
          kind: newDevice.kind,
          uniqueId: newDevice.uniqueId,
          permissionGranted: newDevice.permissionGranted
        };
        
        if (!newDevice.label && previousDevices.length > index && previousDevices[index].label) {
          finalDevice = {
            ...finalDevice,
            label: previousDevices[index].label
          };
        }
        
        return finalDevice;
      });
      
      setDevices(devicesWithLabels);
      
      // Auto-select first device if none selected
      if (audioInputs.length > 0 && !selectedDeviceId) {
        onDeviceSelected(audioInputs[0].deviceId || audioInputs[0].uniqueId);
      }
      
      // Notify about permission
      if (onPermissionChange && audioInputs.length > 0) {
        onPermissionChange({
          granted: true,
          deviceLabel: audioInputs[0].label || 'Microphone',
          deviceId: audioInputs[0].deviceId || audioInputs[0].uniqueId
        });
      }
    } catch (error) {
      console.error('Error enumerating devices:', error);
      setError('Failed to access microphone. Please check your browser permissions.');
      
      if (onPermissionChange) {
        onPermissionChange({ granted: false });
      }
    } finally {
      setIsLoading(false);
      setIsCheckingPermission(false);
      isEnumeratingRef.current = false;
    }
  }, [onDeviceSelected, onPermissionChange, selectedDeviceId]);

  // Check microphone permission without prompting
  const checkPermission = useCallback(async () => {
    setIsCheckingPermission(true);
    
    try {
      const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      
      if (permission.state === 'granted') {
        enumerateDevices();
      } else if (permission.state === 'denied') {
        setError('Microphone access denied. Please enable microphone access in your browser settings.');
        if (onPermissionChange) {
          onPermissionChange({ granted: false });
        }
        setIsCheckingPermission(false);
      } else {
        // Permission state is 'prompt' - we need to request it
        enumerateDevices();
      }
    } catch (error) {
      // Fallback for browsers that don't support permissions API
      console.error('Permission check failed:', error);
      enumerateDevices();
    }
  }, [enumerateDevices, onPermissionChange]);

  // Handle device selection change
  const handleDeviceChange = (deviceId: string) => {
    onDeviceSelected(deviceId);
  };

  // Initialize on component mount - ONLY once
  useEffect(() => {
    checkPermission();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for device changes
  useEffect(() => {
    const handleDeviceChange = () => {
      // Debounce device change events to prevent rapid successive calls
      if (enumerationTimeoutRef.current) {
        clearTimeout(enumerationTimeoutRef.current);
      }
      
      enumerationTimeoutRef.current = setTimeout(() => {
        enumerateDevices();
      }, 500); // 500ms debounce
    };

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    
    return () => {
      console.log('[MicrophoneSelector] Component unmounting, cleaning up...');
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      if (enumerationTimeoutRef.current) {
        clearTimeout(enumerationTimeoutRef.current);
      }
      console.log('[MicrophoneSelector] Cleanup completed');
    };
  }, [selectedDeviceId, enumerateDevices]);

  if (isCheckingPermission) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
        <span className="text-gray-600">Checking microphone permission...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center">
          <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-red-800 font-medium">Microphone Access Required</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
            <button
              onClick={enumerateDevices}
              className="mt-2 text-red-700 underline text-sm hover:text-red-800"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
        <span className="text-gray-600">Loading microphones...</span>
      </div>
    );
  }

  if (devices.length === 0) {
    return (
      <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center">
          <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <p className="text-yellow-800 font-medium">No Microphones Found</p>
            <p className="text-yellow-600 text-sm mt-1">
              Please connect a microphone and ensure it&apos;s properly configured.
            </p>
            <button
              onClick={enumerateDevices}
              className="mt-2 text-yellow-700 underline text-sm hover:text-yellow-800"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${compact ? 'space-y-1' : 'space-y-2'} ${className}`}>
      {!compact && (
        <label htmlFor="microphone-select" className="block text-sm font-medium text-gray-700">
          Select Microphone
        </label>
      )}
      
      <div className="relative">
        <select
          id="microphone-select"
          value={selectedDeviceId || ''}
          onChange={(e) => handleDeviceChange(e.target.value)}
          className={`block w-full pl-3 pr-10 ${compact ? 'py-1 text-xs' : 'py-2 text-base'} border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border`}
        >
          {devices.map((device, index) => {
            // Use the uniqueId for React key to ensure uniqueness
            const deviceKey = device.uniqueId;
            const displayLabel = device.label || `Microphone ${index + 1}`;
            
            return (
              <option key={deviceKey} value={device.deviceId || device.uniqueId}>
                {displayLabel}
              </option>
            );
          })}
        </select>
        
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <svg className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-gray-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      
      {!compact && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">
            {devices.length} microphone{devices.length !== 1 ? 's' : ''} available
          </p>
          
          <button
            onClick={enumerateDevices}
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      )}
    </div>
  );
}