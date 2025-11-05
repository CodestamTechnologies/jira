interface TeamAttendanceItem {
  member: {
    userId: string;
    name: string;
    email: string;
  };
  attendance: {
    status: string;
  } | null;
}

export interface TeamAttendanceStats {
  totalMembers: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  halfDayCount: number;
  checkedInCount: number;
}

export const calculateTeamAttendanceStats = (
  teamAttendance: TeamAttendanceItem[] | undefined
): TeamAttendanceStats => {
  if (!teamAttendance || teamAttendance.length === 0) {
    return {
      totalMembers: 0,
      presentCount: 0,
      lateCount: 0,
      absentCount: 0,
      halfDayCount: 0,
      checkedInCount: 0,
    };
  }

  const totalMembers = teamAttendance.length;
  const presentCount = teamAttendance.filter(
    (item) => item.attendance?.status === 'present'
  ).length;
  const lateCount = teamAttendance.filter(
    (item) => item.attendance?.status === 'late'
  ).length;
  const absentCount = teamAttendance.filter(
    (item) => !item.attendance
  ).length;
  const halfDayCount = teamAttendance.filter(
    (item) => item.attendance?.status === 'half-day'
  ).length;
  const checkedInCount = teamAttendance.filter(
    (item) => !!item.attendance
  ).length;

  return {
    totalMembers,
    presentCount,
    lateCount,
    absentCount,
    halfDayCount,
    checkedInCount,
  };
};
