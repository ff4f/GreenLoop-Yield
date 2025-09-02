import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  Loader2,
  FileText,
  Coins,
  MessageSquare,
  ArrowUpRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Step status types
const StepStatus = {
  PENDING: 'pending',
  LOADING: 'loading', 
  SUCCESS: 'success',
  ERROR: 'error'
};

// Operation types for different on-chain actions
const OperationType = {
  CREATE_TOPIC: 'create_topic',
  SUBMIT_PROOF: 'submit_proof',
  MINT_TOKEN: 'mint_token',
  TRANSFER_TOKEN: 'transfer_token',
  CREATE_FILE: 'create_file',
  ESCROW_PAYMENT: 'escrow_payment'
};

// Default step configurations for different operations
const getStepsForOperation = (operationType) => {
  switch (operationType) {
    case OperationType.CREATE_TOPIC:
      return [
        {
          id: 'wallet_sign',
          title: 'Sign Transaction',
          description: 'Approve HCS topic creation in your wallet',
          icon: <MessageSquare className="w-5 h-5" />
        },
        {
          id: 'submit_network',
          title: 'Submit to Network',
          description: 'Broadcasting transaction to Hedera network',
          icon: <ArrowUpRight className="w-5 h-5" />
        },
        {
          id: 'confirm_consensus',
          title: 'Consensus Confirmation',
          description: 'Waiting for network consensus',
          icon: <CheckCircle className="w-5 h-5" />
        }
      ];
    
    case OperationType.SUBMIT_PROOF:
      return [
        {
          id: 'upload_file',
          title: 'Upload Evidence',
          description: 'Uploading proof files to HFS',
          icon: <FileText className="w-5 h-5" />
        },
        {
          id: 'wallet_sign',
          title: 'Sign Message',
          description: 'Sign proof submission with your wallet',
          icon: <MessageSquare className="w-5 h-5" />
        },
        {
          id: 'submit_topic',
          title: 'Submit to Topic',
          description: 'Broadcasting proof to HCS topic',
          icon: <ArrowUpRight className="w-5 h-5" />
        }
      ];
    
    case OperationType.MINT_TOKEN:
      return [
        {
          id: 'wallet_sign',
          title: 'Sign Mint Transaction',
          description: 'Approve token minting in your wallet',
          icon: <Coins className="w-5 h-5" />
        },
        {
          id: 'submit_network',
          title: 'Submit to Network',
          description: 'Broadcasting mint transaction',
          icon: <ArrowUpRight className="w-5 h-5" />
        },
        {
          id: 'confirm_mint',
          title: 'Confirm Mint',
          description: 'Verifying token creation',
          icon: <CheckCircle className="w-5 h-5" />
        }
      ];
    
    case OperationType.TRANSFER_TOKEN:
      return [
        {
          id: 'wallet_sign',
          title: 'Sign Transfer',
          description: 'Approve token transfer in your wallet',
          icon: <Coins className="w-5 h-5" />
        },
        {
          id: 'submit_network',
          title: 'Submit to Network',
          description: 'Broadcasting transfer transaction',
          icon: <ArrowUpRight className="w-5 h-5" />
        },
        {
          id: 'confirm_transfer',
          title: 'Confirm Transfer',
          description: 'Verifying token transfer completion',
          icon: <CheckCircle className="w-5 h-5" />
        }
      ];
    
    default:
      return [
        {
          id: 'wallet_sign',
          title: 'Sign Transaction',
          description: 'Approve transaction in your wallet',
          icon: <MessageSquare className="w-5 h-5" />
        },
        {
          id: 'submit_network',
          title: 'Submit to Network',
          description: 'Broadcasting to Hedera network',
          icon: <ArrowUpRight className="w-5 h-5" />
        },
        {
          id: 'confirm_consensus',
          title: 'Network Confirmation',
          description: 'Waiting for consensus confirmation',
          icon: <CheckCircle className="w-5 h-5" />
        }
      ];
  }
};

// Step component
const StepItem = ({ step, status, isActive, isCompleted, result }) => {
  const getStatusIcon = () => {
    if (status === StepStatus.SUCCESS || isCompleted) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    if (status === StepStatus.ERROR) {
      return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
    if (status === StepStatus.LOADING || isActive) {
      return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
    }
    return <Clock className="w-5 h-5 text-gray-400" />;
  };

  const getStatusColor = () => {
    if (status === StepStatus.SUCCESS || isCompleted) return 'border-green-500 bg-green-50';
    if (status === StepStatus.ERROR) return 'border-red-500 bg-red-50';
    if (status === StepStatus.LOADING || isActive) return 'border-blue-500 bg-blue-50';
    return 'border-gray-200 bg-gray-50';
  };

  return (
    <div className={cn(
      'flex items-start space-x-4 p-4 rounded-lg border-2 transition-all duration-200',
      getStatusColor()
    )}>
      <div className="flex-shrink-0 mt-1">
        {getStatusIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-900">{step.title}</h4>
          {status === StepStatus.SUCCESS && result?.transactionId && (
            <Badge variant="outline" className="text-xs">
              {result.transactionId.slice(0, 8)}...
            </Badge>
          )}
        </div>
        <p className="text-sm text-gray-600 mt-1">{step.description}</p>
        {status === StepStatus.ERROR && result?.error && (
          <p className="text-sm text-red-600 mt-2">{result.error}</p>
        )}
        {status === StepStatus.SUCCESS && result?.hashscanLink && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 p-0 h-auto text-blue-600 hover:text-blue-800"
            onClick={() => window.open(result.hashscanLink, '_blank')}
          >
            View on HashScan
            <ExternalLink className="w-3 h-3 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
};

// Main StepperModal component
export const StepperModal = ({
  isOpen,
  onClose,
  operationType,
  title,
  description,
  steps: customSteps,
  currentStep = 0,
  stepStatuses = {},
  stepResults = {},
  onRetry,
  onComplete,
  showProgress = true,
  allowClose = true
}) => {
  const steps = customSteps || getStepsForOperation(operationType);
  const [localCurrentStep, setLocalCurrentStep] = useState(currentStep);
  
  useEffect(() => {
    setLocalCurrentStep(currentStep);
  }, [currentStep]);

  const getOverallStatus = () => {
    const hasError = Object.values(stepStatuses).includes(StepStatus.ERROR);
    const allCompleted = steps.every((_, index) => 
      stepStatuses[index] === StepStatus.SUCCESS || index < localCurrentStep
    );
    const isProcessing = Object.values(stepStatuses).includes(StepStatus.LOADING);
    
    if (hasError) return 'error';
    if (allCompleted) return 'success';
    if (isProcessing) return 'processing';
    return 'pending';
  };

  const getProgressPercentage = () => {
    const completedSteps = steps.filter((_, index) => 
      stepStatuses[index] === StepStatus.SUCCESS || index < localCurrentStep
    ).length;
    return Math.round((completedSteps / steps.length) * 100);
  };

  const overallStatus = getOverallStatus();
  const progressPercentage = getProgressPercentage();

  const getModalTitle = () => {
    if (title) return title;
    
    switch (operationType) {
      case OperationType.CREATE_TOPIC:
        return 'Creating HCS Topic';
      case OperationType.SUBMIT_PROOF:
        return 'Submitting Proof';
      case OperationType.MINT_TOKEN:
        return 'Minting Carbon Tokens';
      case OperationType.TRANSFER_TOKEN:
        return 'Transferring Tokens';
      default:
        return 'Processing Transaction';
    }
  };

  const getModalDescription = () => {
    if (description) return description;
    
    switch (overallStatus) {
      case 'success':
        return 'Transaction completed successfully! All steps have been verified on the Hedera network.';
      case 'error':
        return 'Transaction failed. Please review the error details and try again.';
      case 'processing':
        return 'Please wait while we process your transaction on the Hedera network.';
      default:
        return 'Follow the steps below to complete your transaction.';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={allowClose ? onClose : undefined}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span>{getModalTitle()}</span>
            {overallStatus === 'success' && (
              <CheckCircle className="w-5 h-5 text-green-500" />
            )}
            {overallStatus === 'error' && (
              <AlertCircle className="w-5 h-5 text-red-500" />
            )}
            {overallStatus === 'processing' && (
              <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
            )}
          </DialogTitle>
          <DialogDescription>
            {getModalDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {showProgress && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Progress</span>
                <span>{progressPercentage}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          )}

          <div className="space-y-3">
            {steps.map((step, index) => (
              <StepItem
                key={step.id}
                step={step}
                status={stepStatuses[index]}
                isActive={index === localCurrentStep}
                isCompleted={index < localCurrentStep}
                result={stepResults[index]}
              />
            ))}
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            {overallStatus === 'error' && onRetry && (
              <Button
                variant="outline"
                onClick={onRetry}
              >
                Retry
              </Button>
            )}
            
            {overallStatus === 'success' && onComplete && (
              <Button
                onClick={onComplete}
                className="bg-green-600 hover:bg-green-700"
              >
                Complete
              </Button>
            )}
            
            {allowClose && (
              <Button
                variant={overallStatus === 'processing' ? 'outline' : 'default'}
                onClick={onClose}
                disabled={overallStatus === 'processing' && !allowClose}
              >
                {overallStatus === 'success' ? 'Done' : 'Close'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Hook for managing stepper state
export const useStepperModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepStatuses, setStepStatuses] = useState({});
  const [stepResults, setStepResults] = useState({});
  const [operationType, setOperationType] = useState(null);

  const openModal = (type, initialStep = 0) => {
    setOperationType(type);
    setCurrentStep(initialStep);
    setStepStatuses({});
    setStepResults({});
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setCurrentStep(0);
    setStepStatuses({});
    setStepResults({});
    setOperationType(null);
  };

  const updateStepStatus = (stepIndex, status, result = null) => {
    setStepStatuses(prev => ({ ...prev, [stepIndex]: status }));
    if (result) {
      setStepResults(prev => ({ ...prev, [stepIndex]: result }));
    }
  };

  const nextStep = () => {
    setCurrentStep(prev => prev + 1);
  };

  const resetStepper = () => {
    setCurrentStep(0);
    setStepStatuses({});
    setStepResults({});
  };

  return {
    isOpen,
    currentStep,
    stepStatuses,
    stepResults,
    operationType,
    openModal,
    closeModal,
    updateStepStatus,
    nextStep,
    resetStepper
  };
};

export { StepStatus, OperationType };
export default StepperModal;