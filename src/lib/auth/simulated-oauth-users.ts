export interface SimulatedOAuthUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'staff' | 'vaad';
  avatarUrl: string;
  googleToken: {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    expiresIn: number;
    scopes: string[];
    idTokenClaims: {
      iss: string;
      sub: string;
      email: string;
      email_verified: boolean;
      name: string;
      picture: string;
      hd: string; // hosted domain (oorah.org)
    };
  };
  permissions: {
    canAccessAdmin: boolean;
    canVoteVaad: boolean;
    canContributeVaad: boolean;
    canExportData: boolean;
    canManageUsers: boolean;
  };
}

export const SIMULATED_OAUTH_USERS: Record<string, SimulatedOAuthUser> = {
  admin: {
    id: 'usr-sim-admin-01',
    email: 'mock_admin@oorah.org',
    name: 'Rabbi David Levin (Admin)',
    role: 'admin',
    avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=DL',
    googleToken: {
      accessToken: 'ya29.simulated_oauth_access_token_admin_super_user',
      refreshToken: '1//simulated_refresh_token_admin_drive_offline',
      tokenType: 'Bearer',
      expiresIn: 3600,
      scopes: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/drive.file',
      ],
      idTokenClaims: {
        iss: 'https://accounts.google.com',
        sub: 'google-uid-100000000000000001',
        email: 'mock_admin@oorah.org',
        email_verified: true,
        name: 'Rabbi David Levin',
        picture: 'https://api.dicebear.com/7.x/initials/svg?seed=DL',
        hd: 'oorah.org',
      },
    },
    permissions: {
      canAccessAdmin: true,
      canVoteVaad: true,
      canContributeVaad: true,
      canExportData: true,
      canManageUsers: true,
    },
  },
  staff: {
    id: 'usr-sim-staff-02',
    email: 'mock_staff@oorah.org',
    name: 'Sarah Klein (Staff)',
    role: 'staff',
    avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=SK',
    googleToken: {
      accessToken: 'ya29.simulated_oauth_access_token_staff_reviewer',
      refreshToken: '1//simulated_refresh_token_staff_standard',
      tokenType: 'Bearer',
      expiresIn: 3600,
      scopes: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
      ],
      idTokenClaims: {
        iss: 'https://accounts.google.com',
        sub: 'google-uid-100000000000000002',
        email: 'mock_staff@oorah.org',
        email_verified: true,
        name: 'Sarah Klein',
        picture: 'https://api.dicebear.com/7.x/initials/svg?seed=SK',
        hd: 'oorah.org',
      },
    },
    permissions: {
      canAccessAdmin: false,
      canVoteVaad: false,
      canContributeVaad: false,
      canExportData: true,
      canManageUsers: false,
    },
  },
  vaad: {
    id: 'usr-sim-vaad-03',
    email: 'mock_vaad@oorah.org',
    name: 'Rabbi Moshe Shapiro (VAAD)',
    role: 'vaad',
    avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=MS',
    googleToken: {
      accessToken: 'ya29.simulated_oauth_access_token_vaad_rabbi',
      refreshToken: '1//simulated_refresh_token_vaad_committee',
      tokenType: 'Bearer',
      expiresIn: 3600,
      scopes: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
      ],
      idTokenClaims: {
        iss: 'https://accounts.google.com',
        sub: 'google-uid-100000000000000003',
        email: 'mock_vaad@oorah.org',
        email_verified: true,
        name: 'Rabbi Moshe Shapiro',
        picture: 'https://api.dicebear.com/7.x/initials/svg?seed=MS',
        hd: 'oorah.org',
      },
    },
    permissions: {
      canAccessAdmin: false,
      canVoteVaad: true,
      canContributeVaad: true,
      canExportData: false,
      canManageUsers: false,
    },
  },
};
