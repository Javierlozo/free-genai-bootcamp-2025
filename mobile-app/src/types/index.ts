export type User = {
  id: string;
  email: string;
  created_at: string;
};

export type AuthStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
};

export type MainStackParamList = {
  Home: undefined;
  Profile: undefined;
};

export type NavigationProps = {
  navigation: any;
};
