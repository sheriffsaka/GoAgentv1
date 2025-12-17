import { User, DriveSubmission, SubmissionStatus } from '../types';

const STORAGE_KEYS = {
  USER: 'goagent_user',
  SUBMISSIONS: 'goagent_submissions',
  ALL_AGENTS: 'goagent_all_agents',
};

// Initial Mock Data
const MOCK_ADMIN: User = {
  id: 'admin-1',
  fullName: 'EstateGO Admin',
  email: 'admin@estatego.app',
  phone: '08012345678',
  role: 'ADMIN',
  agreementSigned: true,
  createdAt: new Date('2024-01-01').toISOString(),
};

const SEED_AGENTS: User[] = [
  {
    id: 'agent-101',
    fullName: 'John Doe',
    email: 'john@example.com',
    phone: '08122334455',
    role: 'AGENT',
    agreementSigned: true,
    createdAt: new Date('2024-02-15').toISOString(),
    bankDetails: { bankName: 'GTBank', accountNumber: '0123456789', accountName: 'John Doe' }
  },
  {
    id: 'agent-102',
    fullName: 'Sarah Williams',
    email: 'sarah@example.com',
    phone: '09055667788',
    role: 'AGENT',
    agreementSigned: false,
    createdAt: new Date('2024-03-01').toISOString(),
  }
];

const SEED_SUBMISSIONS: DriveSubmission[] = [
  {
    id: 'sub-1',
    agentId: 'agent-101',
    agentName: 'John Doe',
    propertyName: 'Palm Groove Estate',
    propertyAddress: '12 Lekki Phase 1',
    stateLocation: 'Lagos',
    status: 'PAID',
    noOfUnits: 120,
    estimatedCommission: 54000,
    submissionDate: new Date('2024-03-10').toISOString(),
    agentStatus: 'Freelance',
    propertyCategory: 'Residential',
    propertyType: 'Large Estate',
    occupancyRate: 85,
    meteringType: 'Prepaid',
    landlordName: 'Chief Okoro',
    managementType: 'Company',
    contactPhone: '08011122233',
    interestLevel: 'High',
    featuresInterested: ['Resident App', 'Utility Billing'],
    subscriptionType: 'Residential',
    marketingChannels: ['Facebook'],
    feedback: 'Very interested in the automated billing feature.'
  },
  {
    id: 'sub-2',
    agentId: 'agent-101',
    agentName: 'John Doe',
    propertyName: 'Sunset Court',
    propertyAddress: 'Plot 45, Wuse 2',
    stateLocation: 'FCT - Abuja',
    status: 'APPROVED',
    noOfUnits: 45,
    estimatedCommission: 20250,
    submissionDate: new Date('2024-03-12').toISOString(),
    agentStatus: 'Freelance',
    propertyCategory: 'Residential',
    propertyType: 'High-rise Building',
    occupancyRate: 60,
    meteringType: 'Prepaid',
    landlordName: 'Engr. Bello',
    managementType: 'Individual',
    contactPhone: '08099887766',
    interestLevel: 'Medium',
    featuresInterested: ['Visitor Control'],
    subscriptionType: 'Residential',
    marketingChannels: ['Referral'],
    feedback: 'Requested a physical demo for the FM team.'
  },
  {
    id: 'sub-3',
    agentId: 'agent-102',
    agentName: 'Sarah Williams',
    propertyName: 'Green View Apartments',
    propertyAddress: 'Avenue 4, GRA',
    stateLocation: 'Rivers',
    status: 'PENDING',
    noOfUnits: 30,
    estimatedCommission: 13500,
    submissionDate: new Date('2024-03-14').toISOString(),
    agentStatus: 'In-house',
    propertyCategory: 'Residential',
    propertyType: 'Small Estate',
    occupancyRate: 40,
    meteringType: 'Postpaid',
    landlordName: 'Mrs. Adewale',
    managementType: 'Company',
    contactPhone: '07033445566',
    interestLevel: 'High',
    featuresInterested: ['Security Mgt'],
    subscriptionType: 'Residential',
    marketingChannels: ['Instagram'],
    feedback: 'Concerns about initial onboarding time.'
  }
];

export const MockService = {
  getUser: (): User | null => {
    const data = localStorage.getItem(STORAGE_KEYS.USER);
    return data ? JSON.parse(data) : null;
  },

  getAllAgents: (): User[] => {
    const data = localStorage.getItem(STORAGE_KEYS.ALL_AGENTS);
    let agents = data ? JSON.parse(data) : [];
    
    // Seed data if empty
    if (agents.length === 0) {
      agents = [MOCK_ADMIN, ...SEED_AGENTS];
      localStorage.setItem(STORAGE_KEYS.ALL_AGENTS, JSON.stringify(agents));
    }
    
    // Ensure admin is always in the list
    if (!agents.find((a: User) => a.email === MOCK_ADMIN.email)) {
      agents.push(MOCK_ADMIN);
      localStorage.setItem(STORAGE_KEYS.ALL_AGENTS, JSON.stringify(agents));
    }
    
    return agents;
  },

  login: async (email: string): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    const allAgents = MockService.getAllAgents();
    
    const user = allAgents.find(a => a.email.toLowerCase() === email.toLowerCase());
    if (user) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      return user;
    }

    throw new Error("User not found");
  },

  register: async (userData: Partial<User>): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    const allAgents = MockService.getAllAgents();
    
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      role: 'AGENT',
      agreementSigned: false,
      fullName: userData.fullName || '',
      email: userData.email || '',
      phone: userData.phone || '',
      bankDetails: userData.bankDetails,
      createdAt: new Date().toISOString(),
    };

    allAgents.push(newUser);
    localStorage.setItem(STORAGE_KEYS.ALL_AGENTS, JSON.stringify(allAgents));
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser));
    return newUser;
  },

  signAgreement: async (): Promise<User> => {
    const user = MockService.getUser();
    if (!user) throw new Error("No user");
    
    const updatedUser = {
      ...user,
      agreementSigned: true,
      agreementTimestamp: new Date().toISOString(),
      agreementIp: '102.89.43.12' 
    };

    const allAgents = MockService.getAllAgents().map(a => a.id === updatedUser.id ? updatedUser : a);
    localStorage.setItem(STORAGE_KEYS.ALL_AGENTS, JSON.stringify(allAgents));
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
    return updatedUser;
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.USER);
  },

  getSubmissions: (): DriveSubmission[] => {
    const data = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
    let submissions = data ? JSON.parse(data) : [];
    
    if (submissions.length === 0) {
      submissions = SEED_SUBMISSIONS;
      localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(submissions));
    }
    
    return submissions;
  },

  submitDrive: async (data: Omit<DriveSubmission, 'id' | 'submissionDate' | 'status' | 'estimatedCommission'>): Promise<DriveSubmission> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const submissions = MockService.getSubmissions();
    const newSubmission: DriveSubmission = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      submissionDate: new Date().toISOString(),
      status: 'PENDING',
      estimatedCommission: data.noOfUnits * 450,
    };
    
    submissions.unshift(newSubmission);
    localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(submissions));
    return newSubmission;
  },

  updateStatus: async (id: string, status: SubmissionStatus): Promise<void> => {
    const submissions = MockService.getSubmissions();
    const index = submissions.findIndex(s => s.id === id);
    if (index !== -1) {
      submissions[index].status = status;
      localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(submissions));
    }
  }
};