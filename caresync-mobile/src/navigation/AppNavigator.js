import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { useAuth } from '../context/AuthContext';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Patient Screens
import PatientListScreen from '../screens/patient/PatientListScreen';
import PatientProfileScreen from '../screens/patient/PatientProfileScreen';
import PatientEditScreen from '../screens/patient/PatientEditScreen';

// Doctor Screens
import DoctorListScreen from '../screens/doctor/DoctorListScreen';
import DoctorDetailScreen from '../screens/doctor/DoctorDetailScreen';

// Appointment Screens
import AppointmentBookScreen from '../screens/appointment/AppointmentBookScreen';
import AppointmentListScreen from '../screens/appointment/AppointmentListScreen';

// Medical Record Screens
import MedicalRecordListScreen from '../screens/medicalRecord/MedicalRecordListScreen';
import MedicalRecordDetailScreen from '../screens/medicalRecord/MedicalRecordDetailScreen';

// Prescription Screens
import PrescriptionListScreen from '../screens/prescription/PrescriptionListScreen';
import PrescriptionDetailScreen from '../screens/prescription/PrescriptionDetailScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TabIcon = ({ name }) => <Text>{name}</Text>;

function PatientTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen
        name="Doctors"
        component={DoctorListScreen}
        options={{ tabBarLabel: 'Doctors', tabBarIcon: () => <TabIcon name="👨‍⚕️" /> }}
      />
      <Tab.Screen
        name="Appointments"
        component={AppointmentListScreen}
        options={{ tabBarLabel: 'Appointments', tabBarIcon: () => <TabIcon name="📅" /> }}
      />
      <Tab.Screen
        name="Records"
        component={MedicalRecordListScreen}
        options={{ tabBarLabel: 'Records', tabBarIcon: () => <TabIcon name="📋" /> }}
      />
      <Tab.Screen
        name="Prescriptions"
        component={PrescriptionListScreen}
        options={{ tabBarLabel: 'Rx', tabBarIcon: () => <TabIcon name="💊" /> }}
      />
      <Tab.Screen
        name="Profile"
        component={PatientProfileScreen}
        options={{ tabBarLabel: 'Profile', tabBarIcon: () => <TabIcon name="👤" /> }}
      />
    </Tab.Navigator>
  );
}

function AdminTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen
        name="Patients"
        component={PatientListScreen}
        options={{ tabBarLabel: 'Patients', tabBarIcon: () => <TabIcon name="👥" /> }}
      />
      <Tab.Screen
        name="Doctors"
        component={DoctorListScreen}
        options={{ tabBarLabel: 'Doctors', tabBarIcon: () => <TabIcon name="👨‍⚕️" /> }}
      />
      <Tab.Screen
        name="Appointments"
        component={AppointmentListScreen}
        options={{ tabBarLabel: 'Appointments', tabBarIcon: () => <TabIcon name="📅" /> }}
      />
      <Tab.Screen
        name="Records"
        component={MedicalRecordListScreen}
        options={{ tabBarLabel: 'Records', tabBarIcon: () => <TabIcon name="📋" /> }}
      />
      <Tab.Screen
        name="Prescriptions"
        component={PrescriptionListScreen}
        options={{ tabBarLabel: 'Rx', tabBarIcon: () => <TabIcon name="💊" /> }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { token, user, loading } = useAuth();

  if (loading) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: true }}>
        {!token ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Create Account' }} />
          </>
        ) : (
          <>
            {user?.role === 'patient' && (
              <Stack.Screen name="Home" component={PatientTabs} options={{ headerShown: false }} />
            )}
            {(user?.role === 'admin' || user?.role === 'doctor') && (
              <Stack.Screen name="Home" component={AdminTabs} options={{ headerShown: false }} />
            )}
            <Stack.Screen name="DoctorDetail" component={DoctorDetailScreen} options={{ title: 'Doctor Details' }} />
            <Stack.Screen name="BookAppointment" component={AppointmentBookScreen} options={{ title: 'Book Appointment' }} />
            <Stack.Screen name="RecordDetail" component={MedicalRecordDetailScreen} options={{ title: 'Medical Record' }} />
            <Stack.Screen name="PrescriptionDetail" component={PrescriptionDetailScreen} options={{ title: 'Prescription' }} />
            <Stack.Screen name="PatientProfile" component={PatientProfileScreen} options={{ title: 'My Profile' }} />
            <Stack.Screen name="PatientEdit" component={PatientEditScreen} options={{ title: 'Edit Profile' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
