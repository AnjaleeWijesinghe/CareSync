import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { navTheme, palette, radii, spacing, typography } from '../theme';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import AdminOverviewScreen from '../screens/admin/AdminOverviewScreen';
import AuditLogScreen from '../screens/admin/AuditLogScreen';
import AppointmentBookScreen from '../screens/appointment/AppointmentBookScreen';
import AppointmentListScreen from '../screens/appointment/AppointmentListScreen';
import DoctorEditScreen from '../screens/doctor/DoctorEditScreen';
import DoctorListScreen from '../screens/doctor/DoctorListScreen';
import DoctorProfileScreen from '../screens/doctor/DoctorProfileScreen';
import PatientListScreen from '../screens/patient/PatientListScreen';
import PatientProfileScreen from '../screens/patient/PatientProfileScreen';
import PatientEditScreen from '../screens/patient/PatientEditScreen';
import MedicalRecordListScreen from '../screens/medicalRecord/MedicalRecordListScreen';
import MedicalRecordDetailScreen from '../screens/medicalRecord/MedicalRecordDetailScreen';
import CreateRecordScreen from '../screens/medicalRecord/CreateRecordScreen';
import PrescriptionListScreen from '../screens/prescription/PrescriptionListScreen';
import PrescriptionDetailScreen from '../screens/prescription/PrescriptionDetailScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const isWeb = Platform.OS === 'web';

function SignOutButton() {
  const { logout } = useAuth();

  const handlePress = () => {
    if (isWeb) {
      const confirmed = typeof globalThis.confirm === 'function'
        ? globalThis.confirm('End your current session on this device?')
        : true;

      if (confirmed) {
        logout();
      }
      return;
    }

    Alert.alert('Sign out', 'End your current session on this device?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <TouchableOpacity onPress={handlePress} style={styles.signOutButton}>
      <MaterialCommunityIcons name="logout-variant" size={16} color={palette.primaryStrong} />
      <Text style={styles.signOutText}>Sign Out</Text>
    </TouchableOpacity>
  );
}

function TabIcon({ name, color, focused }) {
  return (
    <View style={[styles.tabIcon, focused && styles.tabIconFocused]}>
      <MaterialCommunityIcons name={name} size={20} color={color} />
    </View>
  );
}

const baseTabOptions = {
  headerTitleAlign: 'left',
  headerShadowVisible: false,
  headerStyle: { backgroundColor: palette.canvasBottom },
  headerTitleStyle: {
    fontFamily: typography.displayMedium,
    fontSize: 19,
    color: palette.ink,
  },
  headerRight: () => <SignOutButton />,
  tabBarShowLabel: true,
  tabBarActiveTintColor: palette.primary,
  tabBarInactiveTintColor: palette.inkMuted,
  tabBarLabelStyle: {
    fontFamily: typography.bodySemiBold,
    fontSize: 11,
    marginTop: 2,
    marginBottom: 5,
  },
  tabBarStyle: isWeb ? {
    height: 78,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(255,253,248,0.94)',
    borderTopWidth: 0,
    borderWidth: 1,
    borderColor: 'rgba(228,217,200,0.92)',
    paddingTop: 8,
    paddingBottom: 10,
    elevation: 0,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 980,
  } : {
    position: 'absolute',
    height: 78,
    left: 16,
    right: 16,
    bottom: 16,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(255,253,248,0.94)',
    borderTopWidth: 0,
    borderWidth: 1,
    borderColor: 'rgba(228,217,200,0.92)',
    paddingTop: 8,
    paddingBottom: 10,
    elevation: 0,
  },
  sceneStyle: { backgroundColor: palette.canvasBottom },
};

function PatientTabs() {
  return (
    <Tab.Navigator screenOptions={baseTabOptions}>
      <Tab.Screen
        name="Doctors"
        component={DoctorListScreen}
        options={{
          title: 'Find Doctors',
          tabBarLabel: 'Doctors',
          tabBarIcon: ({ color, focused }) => <TabIcon name="stethoscope" color={color} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Appointments"
        component={AppointmentListScreen}
        options={{
          title: 'My Appointments',
          tabBarLabel: 'Schedule',
          tabBarIcon: ({ color, focused }) => <TabIcon name="calendar-heart" color={color} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Records"
        component={MedicalRecordListScreen}
        options={{
          title: 'Medical Records',
          tabBarLabel: 'Records',
          tabBarIcon: ({ color, focused }) => <TabIcon name="file-document-outline" color={color} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Prescriptions"
        component={PrescriptionListScreen}
        options={{
          title: 'My Prescriptions',
          tabBarLabel: 'Rx',
          tabBarIcon: ({ color, focused }) => <TabIcon name="pill" color={color} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="MyProfile"
        component={PatientProfileScreen}
        options={{
          title: 'My Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, focused }) => <TabIcon name="account-circle-outline" color={color} focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

function AdminTabs() {
  return (
    <Tab.Navigator screenOptions={baseTabOptions}>
      <Tab.Screen
        name="Overview"
        component={AdminOverviewScreen}
        options={{
          title: 'Admin Overview',
          tabBarLabel: 'Overview',
          tabBarIcon: ({ color, focused }) => <TabIcon name="view-dashboard-outline" color={color} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Doctors"
        component={DoctorListScreen}
        options={{
          title: 'Doctor Management',
          tabBarLabel: 'Doctors',
          tabBarIcon: ({ color, focused }) => <TabIcon name="stethoscope" color={color} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Appointments"
        component={AppointmentListScreen}
        options={{
          title: 'All Appointments',
          tabBarLabel: 'Schedule',
          tabBarIcon: ({ color, focused }) => <TabIcon name="calendar-clock-outline" color={color} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Patients"
        component={PatientListScreen}
        options={{
          title: 'Patient Management',
          tabBarLabel: 'Patients',
          tabBarIcon: ({ color, focused }) => <TabIcon name="account-group-outline" color={color} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Records"
        component={MedicalRecordListScreen}
        options={{
          title: 'Medical Records',
          tabBarLabel: 'Records',
          tabBarIcon: ({ color, focused }) => <TabIcon name="file-document-outline" color={color} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="AuditLogs"
        component={AuditLogScreen}
        options={{
          title: 'Audit Log',
          tabBarLabel: 'Audit',
          tabBarIcon: ({ color, focused }) => <TabIcon name="shield-check-outline" color={color} focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

function DoctorTabs() {
  return (
    <Tab.Navigator screenOptions={baseTabOptions}>
      <Tab.Screen
        name="MyDoctorProfile"
        component={DoctorProfileScreen}
        options={{
          title: 'My Doctor Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, focused }) => <TabIcon name="card-account-details-outline" color={color} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Appointments"
        component={AppointmentListScreen}
        options={{
          title: 'Assigned Appointments',
          tabBarLabel: 'Appointments',
          tabBarIcon: ({ color, focused }) => <TabIcon name="stethoscope" color={color} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Records"
        component={MedicalRecordListScreen}
        options={{
          title: 'Patient Records',
          tabBarLabel: 'Records',
          tabBarIcon: ({ color, focused }) => <TabIcon name="file-document-outline" color={color} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Prescriptions"
        component={PrescriptionListScreen}
        options={{
          title: 'Prescriptions',
          tabBarLabel: 'Rx',
          tabBarIcon: ({ color, focused }) => <TabIcon name="pill" color={color} focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { token, user, loading } = useAuth();
  const navigationKey = token ? `app-${user?.role || 'user'}` : 'auth';

  if (loading) return null;

  return (
    <NavigationContainer key={navigationKey} theme={navTheme}>
      <Stack.Navigator
        key={navigationKey}
        screenOptions={{
          headerTitleAlign: 'left',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: palette.canvasBottom },
          headerTitleStyle: {
            fontFamily: typography.displayMedium,
            fontSize: 20,
            color: palette.ink,
          },
          contentStyle: { backgroundColor: palette.canvasBottom },
        }}
      >
        {!token ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
          </>
        ) : (
          <>
            {user?.role === 'patient' && (
              <Stack.Screen name="Home" component={PatientTabs} options={{ headerShown: false }} />
            )}
            {user?.role === 'admin' && (
              <Stack.Screen name="Home" component={AdminTabs} options={{ headerShown: false }} />
            )}
            {user?.role === 'doctor' && (
              <Stack.Screen name="Home" component={DoctorTabs} options={{ headerShown: false }} />
            )}
            <Stack.Screen name="PatientProfile" component={PatientProfileScreen} options={{ title: 'Patient Profile' }} />
            <Stack.Screen name="DoctorProfile" component={DoctorProfileScreen} options={{ title: 'Doctor Profile' }} />
            <Stack.Screen
              name="PatientEdit"
              component={PatientEditScreen}
              options={({ route }) => ({
                title: route.params?.mode === 'adminCreate' ? 'Create Patient Account' : 'Edit Patient Profile',
              })}
            />
            <Stack.Screen
              name="DoctorEdit"
              component={DoctorEditScreen}
              options={({ route }) => ({
                title: route.params?.mode === 'adminCreate' ? 'Create Doctor Account' : 'Edit Doctor Profile',
              })}
            />
            <Stack.Screen name="RecordDetail" component={MedicalRecordDetailScreen} options={{ title: 'Record Details' }} />
            <Stack.Screen name="CreateRecord" component={CreateRecordScreen} options={{ title: 'Create Medical Record' }} />
            <Stack.Screen name="PrescriptionDetail" component={PrescriptionDetailScreen} options={{ title: 'Prescription Details' }} />
            <Stack.Screen name="BookAppointment" component={AppointmentBookScreen} options={{ title: 'Book Appointment' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(11,107,99,0.08)',
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  signOutText: {
    color: palette.primaryStrong,
    fontFamily: typography.bodySemiBold,
    fontSize: 12,
  },
  tabIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconFocused: {
    backgroundColor: 'rgba(11,107,99,0.10)',
  },
});
