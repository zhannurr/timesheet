import React from 'react';
import { Text } from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import ProjectScreen from '../screens/ProjectScreen';
import TimesheetScreen from '../screens/TimesheetScreen';
import ProfileScreen from '../screens/ProfileScreen';
import UserManagementScreen from '../screens/UserManagementScreen';

const Drawer = createDrawerNavigator<import('../types/navigation').MainDrawerParamList>();

export default function MainDrawer() {
  return (
    <Drawer.Navigator
      initialRouteName="Projects"
      screenOptions={{
        headerShown: false,
        drawerActiveTintColor: '#007AFF',
        drawerInactiveTintColor: '#666',
        drawerStyle: {
          backgroundColor: '#fff',
          width: 280,
        },
      }}
    >
      <Drawer.Screen 
        name="Projects" 
        component={ProjectScreen}
        options={{
          drawerLabel: 'Projects',
          drawerIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>📁</Text>
          ),
        }}
      />
      <Drawer.Screen 
        name="Timesheet" 
        component={TimesheetScreen}
        options={{
          drawerLabel: 'Timesheet',
          drawerIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>📊</Text>
          ),
        }}
      />
      <Drawer.Screen 
        name="UserManagement" 
        component={UserManagementScreen}
        options={{
          drawerLabel: 'User Management',
          drawerIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>👥</Text>
          ),
        }}
      />
      <Drawer.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          drawerLabel: 'Profile',
          drawerIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>👤</Text>
          ),
        }}
      />
    </Drawer.Navigator>
  );
}
