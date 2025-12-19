
export type UserRole = 'ADMIN' | 'AGENT';

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  state: string;
  role: UserRole;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  agreementSigned: boolean;
  agreementTimestamp?: string;
  agreementIp?: string;
  createdAt?: string;
}

export type SubmissionStatus = 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED';

export interface VerificationResult {
  score: number;
  verdict: 'AUTHENTIC' | 'SUSPICIOUS' | 'INCONCLUSIVE';
  findings: string;
  sources: { title: string; uri: string }[];
  manualNote?: string;
  verifiedBy?: string;
}

export interface DriveSubmission {
  id: string;
  agentId: string;
  agentName: string;
  submissionDate: string;
  status: SubmissionStatus;
  
  agentStatus: 'In-house' | 'Freelance';
  propertyName: string;
  propertyAddress: string;
  stateLocation: string;
  coordinates?: { lat: number; lng: number };
  propertyPhoto?: string;

  propertyCategory: 'Residential' | 'Commercial';
  propertyType: string;
  noOfUnits: number;
  occupancyRate: number;
  meteringType: string;

  landlordName: string;
  managementType: 'Individual' | 'Company';
  contactPhone: string;

  interestLevel: 'High' | 'Medium' | 'Low';
  featuresInterested: string[];
  subscriptionType: string;
  marketingChannels: string[];
  feedback: string;

  estimatedCommission: number;
  verification?: VerificationResult;
}
