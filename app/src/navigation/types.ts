


export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  BrowseJobs: undefined;
  MyJobs: undefined;
  WorkerApplies: undefined;
  Notifications: undefined;
  Messages: undefined;
  Chat: { conversationId: string; recipientName: string; recipientId: string };
  AdminDashboard: undefined;
  AdminUsers: undefined;
  AdminJobs: undefined;
  AdminSettings: undefined;
  AdminAlerts: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList { }
  }
}
