import React from 'react';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  currentLabel?: string;
  showPercentage?: boolean;
  showStepNumbers?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'linear' | 'circular' | 'steps';
  className?: string;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentStep,
  totalSteps,
  currentLabel,
  showPercentage = true,
  showStepNumbers = true,
  size = 'medium',
  variant = 'linear',
  className = ''
}) => {
  const percentage = Math.round((currentStep / totalSteps) * 100);
  
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'h-1 text-xs';
      case 'large':
        return 'h-4 text-lg';
      default:
        return 'h-2 text-sm';
    }
  };

  const renderLinearProgress = () => (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        {showStepNumbers && (
          <span className="text-sm font-medium text-gray-700">
            Step {currentStep} of {totalSteps}
          </span>
        )}
        {showPercentage && (
          <span className="text-sm font-medium text-gray-700">
            {percentage}%
          </span>
        )}
      </div>
      <div className={`w-full bg-gray-200 rounded-full ${getSizeClasses().split(' ')[0]}`}>
        <div 
          className="bg-blue-600 h-full rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {currentLabel && (
        <div className="mt-2 text-sm text-gray-600 text-center">
          {currentLabel}
        </div>
      )}
    </div>
  );

  const renderCircularProgress = () => {
    const radius = size === 'small' ? 20 : size === 'large' ? 40 : 30;
    const strokeWidth = size === 'small' ? 3 : size === 'large' ? 5 : 4;
    const normalizedRadius = radius - strokeWidth * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="flex flex-col items-center">
        <div className="relative">
          <svg
            height={radius * 2}
            width={radius * 2}
            className="transform -rotate-90"
          >
            <circle
              stroke="#e5e7eb"
              fill="transparent"
              strokeWidth={strokeWidth}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
            />
            <circle
              stroke="#2563eb"
              fill="transparent"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference + ' ' + circumference}
              style={{ strokeDashoffset }}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
              className="transition-all duration-300 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`font-semibold ${getSizeClasses().split(' ')[1]}`}>
              {showPercentage ? `${percentage}%` : `${currentStep}/${totalSteps}`}
            </span>
          </div>
        </div>
        {currentLabel && (
          <div className="mt-2 text-sm text-gray-600 text-center">
            {currentLabel}
          </div>
        )}
      </div>
    );
  };

  const renderStepsProgress = () => {
    return (
      <div className="w-full">
        <div className="flex justify-between items-center mb-4">
          {showStepNumbers && (
            <span className="text-sm font-medium text-gray-700">
              Step {currentStep} of {totalSteps}
            </span>
          )}
          {showPercentage && (
            <span className="text-sm font-medium text-gray-700">
              {percentage}%
            </span>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          {Array.from({ length: totalSteps }, (_, index) => {
            const stepNumber = index + 1;
            const isCompleted = stepNumber < currentStep;
            const isCurrent = stepNumber === currentStep;
            const isUpcoming = stepNumber > currentStep;
            
            return (
              <React.Fragment key={stepNumber}>
                <div className="flex flex-col items-center">
                  <div
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200
                      ${isCompleted ? 'bg-green-500 text-white' : ''}
                      ${isCurrent ? 'bg-blue-500 text-white ring-4 ring-blue-200' : ''}
                      ${isUpcoming ? 'bg-gray-200 text-gray-500' : ''}
                    `}
                  >
                    {isCompleted ? (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      stepNumber
                    )}
                  </div>
                  {size !== 'small' && (
                    <div className="mt-1 text-xs text-gray-600 text-center max-w-16 truncate">
                      {stepNumber === 1 && 'Start'}
                      {stepNumber === totalSteps && 'Complete'}
                      {stepNumber > 1 && stepNumber < totalSteps && `Step ${stepNumber}`}
                    </div>
                  )}
                </div>
                
                {stepNumber < totalSteps && (
                  <div
                    className={`
                      flex-1 h-1 mx-2 transition-all duration-200
                      ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}
                    `}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
        
        {currentLabel && (
          <div className="mt-4 text-sm text-gray-600 text-center">
            {currentLabel}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`progress-indicator ${className}`}>
      {variant === 'linear' && renderLinearProgress()}
      {variant === 'circular' && renderCircularProgress()}
      {variant === 'steps' && renderStepsProgress()}
    </div>
  );
};

export default ProgressIndicator;