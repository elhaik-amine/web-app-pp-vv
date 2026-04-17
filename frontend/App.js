import React, { useContext } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { AuthProvider, AuthContext } from './src/context/AuthContext';

// Auth
import OnboardingScreen from './src/pages/auth/Onboarding';
import LoginScreen from './src/pages/auth/Login';
import RegisterScreen from './src/pages/auth/Register';
import ForgotPasswordScreen from './src/pages/auth/ForgotPassword';

// Client
import HomeClientScreen from './src/pages/client/HomeClient';
import ProviderListScreen from './src/pages/client/ProviderList';
import ProviderProfileScreen from './src/pages/client/ProviderProfile';
import MesReservationsScreen from './src/pages/client/MesReservations';
import BookingDetailScreen from './src/pages/client/BookingDetail';
import Step1Screen from './src/pages/client/Booking/Step1_Photos';
import Step2Screen from './src/pages/client/Booking/Step2_Prix';
import Step3Screen from './src/pages/client/Booking/Step3_Date';
import Step4Screen from './src/pages/client/Booking/Step4_Confirmation';
import NegociationScreen from './src/pages/client/Negociation';
import QRCodeDisplayScreen from './src/pages/client/QRCodeDisplay';
import AvisScreen from './src/pages/client/Avis';
import ProfilScreen from './src/pages/client/Profil';

// Provider
import ProviderDashboardScreen from './src/pages/provider/ProviderDashboard';
import QRScannerScreen from './src/pages/provider/QRScanner';
import UploadPhotosScreen from './src/pages/provider/UploadPhotosApres';
import WalletTokensScreen from './src/pages/provider/WalletTokens';

// Shared
import NotificationsScreen from './src/pages/shared/Notifications';

// Admin
import AdminDashboardScreen from './src/pages/admin/AdminDashboard';
import AdminReportsScreen from './src/pages/admin/AdminReports';

const RootStack = createStackNavigator();
const AuthStack = createStackNavigator();
const ClientStack = createStackNavigator();
const ProviderStack = createStackNavigator();
const AdminStack = createStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICON_MAP = {
  HomeClient: ['home-outline', 'home'],
  ProviderList: ['search-outline', 'search'],
  MesReservations: ['calendar-outline', 'calendar'],
  Profil: ['person-outline', 'person'],
  ProviderDashboard: ['home-outline', 'home'],
  QRScanner: ['qr-code-outline', 'qr-code'],
};

const screenOptions = ({ route }) => ({
  headerShown: false,
  tabBarActiveTintColor: '#1A73E8',
  tabBarInactiveTintColor: '#64748B',
  tabBarStyle: { height: 64, paddingBottom: 8, paddingTop: 8 },
  tabBarIcon: ({ color, focused, size }) => {
    const [inactiveIcon, activeIcon] = TAB_ICON_MAP[route.name] || ['ellipse-outline', 'ellipse'];
    return <Ionicons name={focused ? activeIcon : inactiveIcon} color={color} size={size} />;
  },
});

function ClientTabs() {
  return (
    <Tab.Navigator screenOptions={screenOptions}>
      <Tab.Screen name="HomeClient" component={HomeClientScreen} options={{ tabBarLabel: 'Accueil' }} />
      <Tab.Screen name="ProviderList" component={ProviderListScreen} options={{ tabBarLabel: 'Recherche' }} />
      <Tab.Screen name="MesReservations" component={MesReservationsScreen} options={{ tabBarLabel: 'Réservations' }} />
      <Tab.Screen name="Profil" component={ProfilScreen} options={{ tabBarLabel: 'Profil' }} />
    </Tab.Navigator>
  );
}

function ProviderTabs() {
  return (
    <Tab.Navigator screenOptions={screenOptions}>
      <Tab.Screen name="ProviderDashboard" component={ProviderDashboardScreen} options={{ tabBarLabel: 'Accueil' }} />
      <Tab.Screen name="MesReservations" component={MesReservationsScreen} options={{ tabBarLabel: 'Missions' }} />
      <Tab.Screen name="QRScanner" component={QRScannerScreen} options={{ tabBarLabel: 'Scanner' }} />
      <Tab.Screen name="Profil" component={ProfilScreen} options={{ tabBarLabel: 'Profil' }} />
    </Tab.Navigator>
  );
}

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Login">
      <AuthStack.Screen name="Onboarding" component={OnboardingScreen} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  );
}

function ClientNavigator() {
  return (
    <ClientStack.Navigator screenOptions={{ headerShown: false }}>
      <ClientStack.Screen name="ClientTabs" component={ClientTabs} />
      <ClientStack.Screen name="HomeClient" component={HomeClientScreen} />
      <ClientStack.Screen name="ProviderList" component={ProviderListScreen} />
      <ClientStack.Screen name="MesReservations" component={MesReservationsScreen} />
      <ClientStack.Screen name="Profil" component={ProfilScreen} />
      <ClientStack.Screen name="ProviderDashboard" component={ProviderDashboardScreen} />
      <ClientStack.Screen name="ProviderProfile" component={ProviderProfileScreen} />
      <ClientStack.Screen name="BookingDetail" component={BookingDetailScreen} />
      <ClientStack.Screen name="Step1" component={Step1Screen} />
      <ClientStack.Screen name="Step2" component={Step2Screen} />
      <ClientStack.Screen name="Step3" component={Step3Screen} />
      <ClientStack.Screen name="Step4" component={Step4Screen} />
      <ClientStack.Screen name="Negociation" component={NegociationScreen} />
      <ClientStack.Screen name="QRCodeDisplay" component={QRCodeDisplayScreen} />
      <ClientStack.Screen name="Avis" component={AvisScreen} />
      <ClientStack.Screen name="Notifications" component={NotificationsScreen} />
      <ClientStack.Screen name="QRScanner" component={QRScannerScreen} />
      <ClientStack.Screen name="UploadPhotos" component={UploadPhotosScreen} />
      <ClientStack.Screen name="WalletTokens" component={WalletTokensScreen} />
    </ClientStack.Navigator>
  );
}

function ProviderNavigator() {
  return (
    <ProviderStack.Navigator screenOptions={{ headerShown: false }}>
      <ProviderStack.Screen name="ProviderTabs" component={ProviderTabs} />
      <ProviderStack.Screen name="ProviderDashboard" component={ProviderDashboardScreen} />
      <ProviderStack.Screen name="MesReservations" component={MesReservationsScreen} />
      <ProviderStack.Screen name="QRScanner" component={QRScannerScreen} />
      <ProviderStack.Screen name="Profil" component={ProfilScreen} />
      <ProviderStack.Screen name="BookingDetail" component={BookingDetailScreen} />
      <ProviderStack.Screen name="Negociation" component={NegociationScreen} />
      <ProviderStack.Screen name="UploadPhotos" component={UploadPhotosScreen} />
      <ProviderStack.Screen name="Notifications" component={NotificationsScreen} />
      <ProviderStack.Screen name="WalletTokens" component={WalletTokensScreen} />
      <ProviderStack.Screen name="Avis" component={AvisScreen} />
    </ProviderStack.Navigator>
  );
}

function AdminNavigator() {
  return (
    <AdminStack.Navigator screenOptions={{ headerShown: false }}>
      <AdminStack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <AdminStack.Screen name="AdminReports" component={AdminReportsScreen} />
      <AdminStack.Screen name="BookingDetail" component={BookingDetailScreen} />
      <AdminStack.Screen name="MesReservations" component={MesReservationsScreen} />
      <AdminStack.Screen name="Profil" component={ProfilScreen} />
    </AdminStack.Navigator>
  );
}

function AppNavigator() {
  const { userRole, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1A73E8" />
      </View>
    );
  }

  const initialRouteName = userRole === 'CLIENT'
    ? 'ClientApp'
    : userRole === 'PROVIDER'
      ? 'ProviderApp'
      : userRole === 'ADMIN'
        ? 'AdminApp'
        : 'Auth';

  return (
    <RootStack.Navigator key={userRole || 'guest'} initialRouteName={initialRouteName} screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="Auth" component={AuthNavigator} />
      <RootStack.Screen name="ClientApp" component={ClientNavigator} />
      <RootStack.Screen name="ProviderApp" component={ProviderNavigator} />
      <RootStack.Screen name="AdminApp" component={AdminNavigator} />
      <RootStack.Screen name="Login" component={LoginScreen} />
      <RootStack.Screen name="Register" component={RegisterScreen} />
      <RootStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <RootStack.Screen name="Onboarding" component={OnboardingScreen} />
    </RootStack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
});
