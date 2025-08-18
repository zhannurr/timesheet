export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainDrawerParamList = {
  Projects: undefined;
  Timesheet: { projectId: string; projectName: string };
  NewEntry: { projectId: string; projectName: string };
  UserManagement: { projectId: string; projectName: string };
  UserHourlyRates: undefined;
  UserTimesheet: { userId: string; userEmail: string };
  Profile: undefined;
};
