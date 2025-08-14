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
  Profile: undefined;
};
