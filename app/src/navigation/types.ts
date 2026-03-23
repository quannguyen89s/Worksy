export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  BrowseJobs: undefined;
  MyJobs: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
