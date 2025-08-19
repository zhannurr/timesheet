import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';

const { width } = Dimensions.get('window');

export default function ProfileScreen({ navigation }: { navigation: any }) {
  const { userData, logout } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showThemeToggle, setShowThemeToggle] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getRoleDisplayName = (role: string) => {
    const roleMap: { [key: string]: string } = {
      'admin': 'Administrator',
      'manager': 'Manager',
      'user': 'User',
      'employee': 'Employee',
    };
    return roleMap[role.toLowerCase()] || role.charAt(0).toUpperCase() + role.slice(1);
  };

  const getStatusColor = (role: string) => {
    const colorMap: { [key: string]: string } = {
      'admin': '#FF6B6B',
      'manager': '#4ECDC4',
      'user': '#45B7D1',
      'employee': '#96CEB4',
    };
    return colorMap[role.toLowerCase()] || '#007AFF';
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar 
        barStyle={isDark ? "light-content" : "dark-content"} 
        backgroundColor={theme.surface} 
      />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.divider }]}>
        <TouchableOpacity 
          style={[styles.menuButton, { backgroundColor: theme.surfaceVariant }]} 
          onPress={() => navigation.openDrawer()}
          activeOpacity={0.7}
        >
          <Text style={[styles.menuIcon, { color: theme.textSecondary }]}>☰</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: theme.surface, shadowColor: theme.shadow }]}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: getStatusColor(userData?.role || 'user') }]}>
              <Text style={styles.avatarText}>
                {userData?.email?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(userData?.role || 'user') }]}>
              <Text style={styles.statusText}>●</Text>
            </View>
          </View>
          
          <Text style={[styles.email, { color: theme.textSecondary }]}>{userData?.email || 'No email'}</Text>
          
          {/* Role Badge */}
          <View style={[styles.roleBadge, { backgroundColor: getStatusColor(userData?.role || 'user') }]}>
            <Text style={styles.roleText}>
              {getRoleDisplayName(userData?.role || 'user')}
            </Text>
          </View>
        </View>

        {/* Stats Section */}
        <View style={[styles.statsSection, { backgroundColor: theme.surface, shadowColor: theme.shadow }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Account Information</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Hourly Rate</Text>
              <Text style={[styles.statValue, { color: theme.text }]}>
                {userData?.hourlyRate ? `₸${userData.hourlyRate.toFixed(2)}/hr` : 'Not set'}
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Account Status</Text>
              <Text style={[styles.statValue, { color: theme.text }]}>Active</Text>
            </View>
          </View>
        </View>

        {/* Actions Section */}
        <View style={[styles.actionsSection, { backgroundColor: theme.surface, shadowColor: theme.shadow }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Settings</Text>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.surfaceVariant }]}
            onPress={() => setShowThemeToggle(true)}
            activeOpacity={0.7}
          >
            <Text style={[styles.actionIcon, { color: theme.primary }]}>
              {isDark ? '🌙' : '☀️'}
            </Text>
            <Text style={[styles.actionText, { color: theme.text }]}>
              {isDark ? 'Dark Mode' : 'Light Mode'}
            </Text>
            <Text style={[styles.actionArrow, { color: theme.textSecondary }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity 
          style={[
            styles.signOutButton, 
            { backgroundColor: theme.error },
            isLoggingOut && { backgroundColor: theme.textTertiary }
          ]} 
          onPress={handleLogout}
          disabled={isLoggingOut}
          activeOpacity={0.7}
        >
          <Text style={styles.signOutIcon}></Text>
          <Text style={styles.signOutText}>
            {isLoggingOut ? 'Signing Out...' : 'Sign Out'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <ThemeToggle 
        visible={showThemeToggle} 
        onClose={() => setShowThemeToggle(false)} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  menuButton: {
    padding: 12,
    borderRadius: 8,
  },
  menuIcon: {
    fontSize: 20,
  },
  headerSpacer: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profileCard: {
    margin: 20,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
  },
  statusBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
  },
  email: {
    fontSize: 18,
    marginBottom: 16,
    fontWeight: '500',
  },
  roleBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  roleText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  statsSection: {
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  statLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  actionsSection: {
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  actionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  actionArrow: {
    fontSize: 18,
    fontWeight: '300',
  },
  signOutButton: {
    margin: 20,
    marginTop: 0,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  signOutButtonDisabled: {
    opacity: 0.7,
  },
  signOutIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  signOutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
