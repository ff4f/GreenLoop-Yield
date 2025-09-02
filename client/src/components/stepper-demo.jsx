import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  StepperModal, 
  useStepperModal, 
  StepStatus, 
  OperationType 
} from '@/components/ui/stepper-modal';
import {
  MessageSquare,
  FileText,
  Coins,
  ArrowUpRight,
  Zap
} from 'lucide-react';
import { useWallet } from '@/hooks/use-wallet';
import { toast } from 'sonner';

// API base URL
const API_BASE = '/api';

// API helper functions
const callHederaAPI = async (endpoint, action, data = {}) => {
  const response = await fetch(`${API_BASE}/${endpoint}?action=${action}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'API request failed');
  }
  
  return response.json();
};

const getHederaAPI = async (endpoint, action, params = {}) => {
  const queryParams = new URLSearchParams({ action, ...params });
  const response = await fetch(`${API_BASE}/${endpoint}?${queryParams}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'API request failed');
  }
  
  return response.json();
};

export const StepperDemo = () => {
  const { isConnected, connect } = useWallet();
  const {
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
  } = useStepperModal();

  // Demo operation handlers
  const handleCreateTopic = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      await connect();
      return;
    }

    openModal(OperationType.CREATE_TOPIC);
    
    try {
      // Step 1: Wallet Sign
      updateStepStatus(0, StepStatus.LOADING);
      
      // Step 2: Submit to Network
      updateStepStatus(1, StepStatus.LOADING);
      
      // Step 3: Create Topic via API
      updateStepStatus(2, StepStatus.LOADING);
      
      const response = await callHederaAPI('hedera-consensus', 'create-topic', {
        userId: 'demo-user',
        topicMemo: 'GreenLoop Carbon Credit Proofs',
        submitKey: null
      });
      
      // Update all steps as successful
      updateStepStatus(0, StepStatus.SUCCESS, {
        transactionId: response.data.transactionId || response.proofOutputs.transactionId,
        hashscanLink: response.proofLinks.transaction
      });
      nextStep();
      
      updateStepStatus(1, StepStatus.SUCCESS, {
        transactionId: response.data.transactionId || response.proofOutputs.transactionId,
        hashscanLink: response.proofLinks.transaction
      });
      nextStep();
      
      updateStepStatus(2, StepStatus.SUCCESS, {
        transactionId: response.proofOutputs.transactionId,
        hashscanLink: response.proofLinks.transaction,
        topicId: response.data.topicId
      });
      
      if (response.toast) {
        toast.success(response.toast.message);
      } else {
        toast.success('HCS Topic created successfully!');
      }
    } catch (error) {
      updateStepStatus(currentStep, StepStatus.ERROR, { error: error.message });
      toast.error('Failed to create topic: ' + error.message);
    }
  };

  const handleSubmitProof = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      await connect();
      return;
    }

    openModal(OperationType.SUBMIT_PROOF);
    
    try {
      // Step 1: Upload File
      updateStepStatus(0, StepStatus.LOADING);
      
      const proofData = {
        type: 'carbon_verification',
        project: 'Demo Forest Conservation',
        location: 'Indonesia',
        carbonReduced: '1000 tons CO2',
        verificationDate: new Date().toISOString(),
        methodology: 'REDD+'
      };
      
      const uploadResponse = await callHederaAPI('hedera-file', 'upload-proof', {
        userId: 'demo-user',
        proofData,
        proofType: 'carbon_verification',
        projectId: 'demo-project-001',
        lotId: 'demo-lot-001'
      });
      
      updateStepStatus(0, StepStatus.SUCCESS, {
        fileId: uploadResponse.data.fileId,
        hashscanLink: uploadResponse.proofLinks.transaction
      });
      nextStep();
      
      // Step 2: Wallet Sign
      updateStepStatus(1, StepStatus.LOADING);
      
      // Step 3: Submit to Topic
      updateStepStatus(2, StepStatus.LOADING);
      
      const topicMessage = {
        type: 'proof_submission',
        fileId: uploadResponse.data.fileId,
        proofType: uploadResponse.data.proofType,
        projectId: uploadResponse.data.projectId,
        lotId: uploadResponse.data.lotId,
        timestamp: new Date().toISOString()
      };
      
      const topicResponse = await callHederaAPI('hedera-consensus', 'submit-message', {
        userId: 'demo-user',
        topicId: '0.0.123456', // Demo topic ID
        message: topicMessage
      });
      
      updateStepStatus(1, StepStatus.SUCCESS, {
        transactionId: topicResponse.proofOutputs.transactionId,
        hashscanLink: topicResponse.proofLinks.transaction
      });
      nextStep();
      
      updateStepStatus(2, StepStatus.SUCCESS, {
        transactionId: topicResponse.proofOutputs.transactionId,
        hashscanLink: topicResponse.proofLinks.transaction,
        sequenceNumber: topicResponse.data.sequenceNumber
      });
      
      if (topicResponse.toast) {
        toast.success(topicResponse.toast.message);
      } else {
        toast.success('Proof submitted successfully!');
      }
    } catch (error) {
      updateStepStatus(currentStep, StepStatus.ERROR, { error: error.message });
      toast.error('Failed to submit proof: ' + error.message);
    }
  };

  const handleMintToken = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      await connect();
      return;
    }

    openModal(OperationType.MINT_TOKEN);
    
    try {
      // Step 1: Wallet Sign
      updateStepStatus(0, StepStatus.LOADING);
      
      // Step 2: Submit to Network
      updateStepStatus(1, StepStatus.LOADING);
      
      // Step 3: Mint Token via API
      updateStepStatus(2, StepStatus.LOADING);
      
      const response = await callHederaAPI('hedera-token', 'mint-token', {
        userId: 'demo-user',
        tokenId: '0.0.789012', // Demo token ID
        amount: 1000,
        recipientAccountId: '0.0.123456' // Demo recipient
      });
      
      // Update all steps as successful
      updateStepStatus(0, StepStatus.SUCCESS, {
        transactionId: response.proofOutputs.transactionId,
        hashscanLink: response.proofLinks.transaction
      });
      nextStep();
      
      updateStepStatus(1, StepStatus.SUCCESS, {
        transactionId: response.proofOutputs.transactionId,
        hashscanLink: response.proofLinks.transaction
      });
      nextStep();
      
      updateStepStatus(2, StepStatus.SUCCESS, {
        transactionId: response.proofOutputs.transactionId,
        hashscanLink: response.proofLinks.transaction,
        tokenId: response.data.tokenId,
        amount: response.data.amount.toString()
      });
      
      if (response.toast) {
        toast.success(response.toast.message);
      } else {
        toast.success('Carbon tokens minted successfully!');
      }
    } catch (error) {
      updateStepStatus(currentStep, StepStatus.ERROR, { error: error.message });
      toast.error('Failed to mint tokens: ' + error.message);
    }
  };

  const handleTransferToken = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      await connect();
      return;
    }

    openModal(OperationType.TRANSFER_TOKEN);
    
    try {
      // Step 1: Wallet Sign
      updateStepStatus(0, StepStatus.LOADING);
      
      // Step 2: Submit to Network
      updateStepStatus(1, StepStatus.LOADING);
      
      // Step 3: Transfer Token via API
      updateStepStatus(2, StepStatus.LOADING);
      
      const response = await callHederaAPI('hedera-token', 'transfer-token', {
        userId: 'demo-user',
        tokenId: '0.0.789012', // Demo token ID
        fromAccountId: '0.0.123456',
        toAccountId: '0.0.654321',
        amount: 500
      });
      
      // Update all steps as successful
      updateStepStatus(0, StepStatus.SUCCESS, {
        transactionId: response.proofOutputs.transactionId,
        hashscanLink: response.proofLinks.transaction
      });
      nextStep();
      
      updateStepStatus(1, StepStatus.SUCCESS, {
        transactionId: response.proofOutputs.transactionId,
        hashscanLink: response.proofLinks.transaction
      });
      nextStep();
      
      updateStepStatus(2, StepStatus.SUCCESS, {
        transactionId: response.proofOutputs.transactionId,
        hashscanLink: response.proofLinks.transaction,
        fromAccount: response.data.fromAccountId,
        toAccount: response.data.toAccountId,
        amount: response.data.amount.toString()
      });
      
      if (response.toast) {
        toast.success(response.toast.message);
      } else {
        toast.success('Carbon tokens transferred successfully!');
      }
    } catch (error) {
      updateStepStatus(currentStep, StepStatus.ERROR, { error: error.message });
      toast.error('Failed to transfer tokens: ' + error.message);
    }
  };

  const handleRetry = () => {
    resetStepper();
    // Re-run the current operation based on operationType
    switch (operationType) {
      case OperationType.CREATE_TOPIC:
        handleCreateTopic();
        break;
      case OperationType.SUBMIT_PROOF:
        handleSubmitProof();
        break;
      case OperationType.MINT_TOKEN:
        handleMintToken();
        break;
      case OperationType.TRANSFER_TOKEN:
        handleTransferToken();
        break;
      default:
        break;
    }
  };

  const handleComplete = () => {
    closeModal();
    toast.success('Operation completed successfully!');
  };

  return (
    <>
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="w-6 h-6 text-primary" />
            <span>On-Chain Operations Demo</span>
            <Badge variant="testnet">Testnet</Badge>
          </CardTitle>
          <p className="text-muted-foreground">
            Experience the stepper modal for Hedera blockchain operations. Each action shows real-time progress with HashScan links.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-2 border-dashed border-gray-200 hover:border-primary transition-colors">
              <CardContent className="p-6 text-center">
                <MessageSquare className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Create HCS Topic</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create a new Hedera Consensus Service topic for proof submissions
                </p>
                <Button 
                  onClick={handleCreateTopic}
                  className="w-full"
                  disabled={!isConnected}
                >
                  {!isConnected ? 'Connect Wallet First' : 'Create Topic'}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-dashed border-gray-200 hover:border-primary transition-colors">
              <CardContent className="p-6 text-center">
                <FileText className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Submit Proof</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload evidence files and submit proof to HCS topic
                </p>
                <Button 
                  onClick={handleSubmitProof}
                  className="w-full"
                  disabled={!isConnected}
                >
                  {!isConnected ? 'Connect Wallet First' : 'Submit Proof'}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-dashed border-gray-200 hover:border-primary transition-colors">
              <CardContent className="p-6 text-center">
                <Coins className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Mint Carbon Tokens</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create new carbon credit tokens using Hedera Token Service
                </p>
                <Button 
                  onClick={handleMintToken}
                  className="w-full"
                  disabled={!isConnected}
                >
                  {!isConnected ? 'Connect Wallet First' : 'Mint Tokens'}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-dashed border-gray-200 hover:border-primary transition-colors">
              <CardContent className="p-6 text-center">
                <ArrowUpRight className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Transfer Tokens</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Transfer carbon credit tokens to another account
                </p>
                <Button 
                  onClick={handleTransferToken}
                  className="w-full"
                  disabled={!isConnected}
                >
                  {!isConnected ? 'Connect Wallet First' : 'Transfer Tokens'}
                </Button>
              </CardContent>
            </Card>
          </div>

          {!isConnected && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Connect your wallet to try the on-chain operations demo. 
                This will show you how the stepper modal guides users through complex blockchain transactions.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <StepperModal
        isOpen={isOpen}
        onClose={closeModal}
        operationType={operationType}
        currentStep={currentStep}
        stepStatuses={stepStatuses}
        stepResults={stepResults}
        onRetry={handleRetry}
        onComplete={handleComplete}
        allowClose={true}
      />
    </>
  );
};

export default StepperDemo;