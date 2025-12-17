import { User, DriveSubmission, SubmissionStatus } from '../types';

const STORAGE_KEYS = {
  USER: 'goagent_user',
  SUBMISSIONS: 'goagent_submissions',
};

// Initial Mock Data
const MOCK_ADMIN: User = {
  id: 'admin-1',
  fullName: 'EstateGO Admin',
  email: 'admin@estatego.app',
  phone: '0000000000',
  role: 'ADMIN',
  agreementSigned: true,
};

export const MockService = {
  getUser: (): User | null => {
    const data = localStorage.getItem(STORAGE_KEYS.USER);
    return data ? JSON.parse(data) : null;
  },

  login: async (email: string): Promise<User> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    if (email.includes('admin')) {
      const user = MOCK_ADMIN;
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      return user;
    }

    // Return existing user or create a temporary one if checking auth
    const stored = localStorage.getItem(STORAGE_KEYS.USER);
    if(stored) return JSON.parse(stored);

    throw new Error("User not found");
  },

  register: async (userData: Partial<User>): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      role: 'AGENT',
      agreementSigned: false,
      fullName: userData.fullName || '',
      email: userData.email || '',
      phone: userData.phone || '',
      bankDetails: userData.bankDetails,
    };
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
      agreementIp: '192.168.1.1' // Mock IP
    };
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
    return updatedUser;
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.USER);
  },

  getSubmissions: (): DriveSubmission[] => {
    const data = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
    return data ? JSON.parse(data) : [];
  },

  submitDrive: async (data: Omit<DriveSubmission, 'id' | 'submissionDate' | 'status' | 'estimatedCommission'>): Promise<DriveSubmission> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const submissions = MockService.getSubmissions();
    const newSubmission: DriveSubmission = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      submissionDate: new Date().toISOString(),
      status: 'PENDING',
      estimatedCommission: data.noOfUnits * 450, // N450 per resident/unit
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