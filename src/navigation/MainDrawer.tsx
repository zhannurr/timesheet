import React from 'react';
import { Text, View, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import ProjectScreen from '../screens/ProjectScreen';
import TimesheetScreen from '../screens/TimesheetScreen';
import ProfileScreen from '../screens/ProfileScreen';
import UserManagementScreen from '../screens/UserManagementScreen';
import UserHourlyRatesScreen from '../screens/UserHourlyRatesScreen';
import NewEntryScreen from '../screens/NewEntryScreen';
import UserTimesheetScreen from '../screens/UserTimesheetScreen';

const Drawer = createDrawerNavigator<import('../types/navigation').MainDrawerParamList>();

// Custom drawer content component
function CustomDrawerContent(props: any) {
  const { logout, userData } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();

  // Filter drawer items based on user role
  const filteredDrawerItems = props.items ? props.items.filter((item: any) => {
    // Handle edge cases where userData or role might be undefined
    if (!userData || !userData.role) {
      return !['UserHourlyRates'].includes(item.key);
    }
    
    // Show all items for admin users
    if (userData.role === 'admin') {
      return true;
    }
    
    // Hide admin-only items for regular users
    const isAdminOnlyItem = ['UserHourlyRates'].includes(item.key);
    if (isAdminOnlyItem) {
      return false;
    }
    
    return true;
  }) : [];

  return (
    <DrawerContentScrollView {...props} style={[styles.drawerContent, { backgroundColor: theme.surface }]}>
      {/* User info header */}
      <View style={[styles.userInfoContainer, { borderBottomColor: theme.divider }]}>
        <View style={[styles.avatarContainer, { backgroundColor: theme.primary }]}>
          <Text style={styles.avatarText}>
            {userData?.email?.charAt(0).toUpperCase() || 'U'}
          </Text>
        </View>
        <Text style={[styles.userEmail, { color: theme.text }]} numberOfLines={1}>
          {userData?.email || 'User'}
        </Text>
        <Text style={[styles.userRole, { color: theme.textSecondary }]}>
          {userData?.role ? userData.role.charAt(0).toUpperCase() + userData.role.slice(1) : 'User'}
        </Text>
      </View>

      {/* Navigation items */}
      <DrawerItemList {...props} items={filteredDrawerItems} />

      {/* Theme Toggle Section */}
      <View style={[styles.themeContainer, { borderTopColor: theme.divider }]}>
        <View style={styles.themeHeader}>
          <Text style={[styles.themeTitle, { color: theme.text }]}>Appearance</Text>
        </View>
        <View style={styles.themeToggleRow}>
          <View style={styles.themeToggleContent}>
            <Text style={[styles.themeToggleIcon, { color: theme.textSecondary }]}>
              {isDark ? '🌙' : '☀️'}
            </Text>
            <Text style={[styles.themeToggleLabel, { color: theme.text }]}>
              Dark Mode
            </Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: theme.surfaceVariant, true: theme.primary + '40' }}
            thumbColor={isDark ? theme.primary : theme.textSecondary}
            ios_backgroundColor={theme.surfaceVariant}
          />
        </View>
      </View>

      {/* Logout button */}
      <View style={[styles.logoutContainer, { borderTopColor: theme.divider }]}>
        <TouchableOpacity 
          style={[styles.logoutButton, { backgroundColor: theme.error + '10', borderColor: theme.error + '30' }]} 
          onPress={logout}
        >
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={[styles.logoutText, { color: theme.error }]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </DrawerContentScrollView>
  );
}

export default function MainDrawer() {
  const { userData } = useAuth();
  const { theme } = useTheme();
  
  // Check if user is admin
  const isAdmin = userData?.role === 'admin';
  
  return (
    <Drawer.Navigator
      initialRouteName="Projects"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerActiveTintColor: theme.primary,
        drawerInactiveTintColor: theme.textSecondary,
        drawerActiveBackgroundColor: theme.primary + '10',
        drawerInactiveBackgroundColor: 'transparent',
        drawerStyle: {
          backgroundColor: theme.surface,
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
        options={{
          drawerLabel: 'Timesheet',
          drawerIcon: ({ color, size }) => (
            <Text style={[styles.drawerIcon, { color, fontSize: size }]}>📊</Text>
          ),
          drawerItemStyle: { display: 'none' },

        }}
      />
      <Drawer.Screen 
        name="NewEntry" 
        component={NewEntryScreen}
        options={{
          drawerLabel: 'New Entry',
          drawerIcon: ({ color, size }) => (
            <Text style={[styles.drawerIcon, { color, fontSize: size }]}>➕</Text>
          ),
          drawerItemStyle: { display: 'none' },

        }}
      />
      <Drawer.Screen 
        name="UserManagement" 
        component={UserManagementScreen}
        options={{
          drawerLabel: 'User Management',
          drawerIcon: ({ color, size }) => (
            <Text style={[styles.drawerIcon, { color, fontSize: size }]}>👥</Text>
          ),
          drawerItemStyle: { display: 'none' },

        }}
      />
      <Drawer.Screen 
        name="UserHourlyRates" 
        component={UserHourlyRatesScreen}
        options={{
          drawerLabel: 'Users',
          drawerIcon: ({ color, size }) => (
            <Text style={[styles.drawerIcon, { color, fontSize: size }]}>💰</Text>
          ),
          // Hide from drawer if not admin
          drawerItemStyle: isAdmin ? {} : { display: 'none' },
        }}
      />
      <Drawer.Screen 
        name="UserTimesheet" 
        component={UserTimesheetScreen}
        options={{
          drawerLabel: 'User Timesheet',
          drawerIcon: ({ color, size }) => (
            <Text style={[styles.drawerIcon, { color, fontSize: size }]}>📊</Text>
          ),
          drawerItemStyle: { display: 'none' },
        }}
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
  },
  userInfoContainer: {
    padding: 20,
    borderBottomWidth: 1,
    marginBottom: 10,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
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
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    textTransform: 'capitalize',
  },
  drawerIcon: {
    marginRight: 8,
  },
  themeContainer: {
    padding: 16,
    borderTopWidth: 1,
    marginTop: 10,
  },
  themeHeader: {
    marginBottom: 12,
  },
  themeTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  themeToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  themeToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  themeToggleIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  themeToggleLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  logoutContainer: {
    padding: 16,
    borderTopWidth: 1,
    marginTop: 'auto',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  logoutIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
  },
  userInfoTouchable: {
    flex: 1,
  },
});
