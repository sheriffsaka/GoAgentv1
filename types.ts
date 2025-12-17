export type UserRole = 'ADMIN' | 'AGENT';

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
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
  lastActive?: string;
}

export type SubmissionStatus = 'PENDING' | 'APPROVED' | 'PAID';

export interface DriveSubmission {
  id: string;
  agentId: string;
  agentName: string;
  submissionDate: string;
  status: SubmissionStatus;
  
  // Step 1: Agent & Location
  agentStatus: 'In-house' | 'Freelance';
  propertyName: string;
  propertyAddress: string;
  stateLocation: string;

  // Step 2: Property Metrics
  propertyCategory: 'Residential' | 'Commercial';
  propertyType: string;
  noOfUnits: number;
  occupancyRate: number;
  meteringType: string;

  // Step 3: Contact Info
  landlordName: string;
  managementType: 'Individual' | 'Company';
  contactPhone: string;

  // Step 4: Sales Intel
  interestLevel: 'High' | 'Medium' | 'Low';
  featuresInterested: string[];
  subscriptionType: string;
  marketingChannels: string[];
  feedback: string;

  // Calculated
  estimatedCommission: number;
}
