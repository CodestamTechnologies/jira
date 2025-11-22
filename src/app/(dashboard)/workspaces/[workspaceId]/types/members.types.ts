export interface MemberDetailPageProps {
  params: {
    workspaceId: string;
    userId: string;
  };
}

export interface MemberDetailClientProps {
  workspaceId: string;
  userId: string;
}

export interface MemberAttendanceClientProps {
  workspaceId: string;
  userId: string;
}

export interface MemberAttendancePageProps {
  params: {
    workspaceId: string;
    userId: string;
  };
}

