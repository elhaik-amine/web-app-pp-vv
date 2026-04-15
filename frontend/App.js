import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Auth
import SplashScreen from './src/pages/auth/SplashScreen';
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

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Auth */}
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />

        {/* Client */}
        <Stack.Screen name="HomeClient" component={HomeClientScreen} />
        <Stack.Screen name="ProviderList" component={ProviderListScreen} />
        <Stack.Screen name="ProviderProfile" component={ProviderProfileScreen} />
        <Stack.Screen name="MesReservations" component={MesReservationsScreen} />
        <Stack.Screen name="BookingDetail" component={BookingDetailScreen} />
        <Stack.Screen name="Step1" component={Step1Screen} />
        <Stack.Screen name="Step2" component={Step2Screen} />
        <Stack.Screen name="Step3" component={Step3Screen} />
        <Stack.Screen name="Step4" component={Step4Screen} />
        <Stack.Screen name="Negociation" component={NegociationScreen} />
        <Stack.Screen name="QRCodeDisplay" component={QRCodeDisplayScreen} />
        <Stack.Screen name="Avis" component={AvisScreen} />
        <Stack.Screen name="Profil" component={ProfilScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />

        {/* Provider */}
        <Stack.Screen name="ProviderDashboard" component={ProviderDashboardScreen} />
        <Stack.Screen name="QRScanner" component={QRScannerScreen} />
        <Stack.Screen name="UploadPhotos" component={UploadPhotosScreen} />
        <Stack.Screen name="WalletTokens" component={WalletTokensScreen} />

        {/* Admin */}
        <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
        <Stack.Screen name="AdminReports" component={AdminReportsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}