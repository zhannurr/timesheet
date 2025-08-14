import React from 'react';
import { Text, View, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { useAuth } from '../contexts/AuthContext';
import ProjectScreen from '../screens/ProjectScreen';
import TimesheetScreen from '../screens/TimesheetScreen';
import ProfileScreen from '../screens/ProfileScreen';
import UserManagementScreen from '../screens/UserManagementScreen';

const Drawer = createDrawerNavigator<import('../types/navigation').MainDrawerParamList>();

// Custom drawer content component
function CustomDrawerContent(props: any) {
  const { logout, userData } = useAuth();


  return (
    <DrawerContentScrollView {...props} style={styles.drawerContent}>
      {/* User info header */}
      <View style={styles.userInfoContainer}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {userData?.email?.charAt(0).toUpperCase() || 'U'}
          </Text>
        </View>
        <Text style={styles.userEmail} numberOfLines={1}>
          {userData?.email || 'User'}
        </Text>
        <Text style={styles.userRole}>
          {userData?.role ? userData.role.charAt(0).toUpperCase() + userData.role.slice(1) : 'User'}
        </Text>
      </View>

      {/* Navigation items */}
      <DrawerItemList {...props} />

      {/* Logout button */}
      <View style={styles.logoutContainer}>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </DrawerContentScrollView>
  );
}

export default function MainDrawer() {
  return (
    <Drawer.Navigator
      initialRouteName="Projects"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerActiveTintColor: '#2563eb',
        drawerInactiveTintColor: '#64748b',
        drawerActiveBackgroundColor: '#eff6ff',
        drawerInactiveBackgroundColor: 'transparent',
        drawerStyle: {
          backgroundColor: '#ffffff',
          width: 300,
        },
        drawerLabelStyle: {
          fontSize: 16,
          fontWeight: '500',
          marginLeft: -10,
        },
        drawerItemStyle: {
          borderRadius: 8,
          marginHorizontal: 8,
          marginVertical: 2,
        },
      }}
    >
      <Drawer.Screen 
        name="Projects" 
        component={ProjectScreen}
        options={{
          drawerLabel: 'Projects',
          drawerIcon: ({ color, size }) => (
            <Text style={[styles.drawerIcon, { color, fontSize: size }]}>📁</Text>
          ),
        }}
      />
      <Drawer.Screen 
        name="Timesheet" 
        component={TimesheetScreen}
        // options={{
        //   drawerLabel: 'Timesheet',
        //   drawerIcon: ({ color, size }) => (
        //     <Text style={[styles.drawerIcon, { color, fontSize: size }]}>📊</Text>
        //   ),
        // }}
      />
      <Drawer.Screen 
        name="UserManagement" 
        component={UserManagementScreen}
        // options={{
        //   drawerLabel: 'User Management',
        //   drawerIcon: ({ color, size }) => (
        //     <Text style={[styles.drawerIcon, { color, fontSize: size }]}>👥</Text>
        //   ),
        // }}
      />
      <Drawer.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          drawerLabel: 'Profile',
          drawerIcon: ({ color, size }) => (
            <Text style={[styles.drawerIcon, { color, fontSize: size }]}>👤</Text>
          ),
        }}
      />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  drawerContent: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  userInfoContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    marginBottom: 10,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  userEmail: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: '#64748b',
    textTransform: 'capitalize',
  },
  drawerIcon: {
    marginRight: 8,
  },
  logoutContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    marginTop: 'auto',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  logoutIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626',
  },
});
