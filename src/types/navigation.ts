import { NavigatorScreenParams } from "@react-navigation/native";

export type MainTabParamList = {
  NearbyRunners: undefined;
  Connections: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  OnboardingPhone: undefined;
  OnboardingName: undefined;
  OnboardingNeighborhood: undefined;
  OnboardingPaceAndDistance: undefined;
  OnboardingDaysAndTimes: undefined;
  OnboardingGoals: undefined;
  StravaConnect: undefined;
  RunnerDetail: { runnerId: string };
  EditProfile: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList>;
};
