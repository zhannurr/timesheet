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

const { width } = Dimensions.get('window');

export default function ProfileScreen({ navigation }: { navigation: any }) {
  const { userData, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.menuButton} 
          onPress={() => navigation.openDrawer()}
          activeOpacity={0.7}
        >
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
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
          
          <Text style={styles.email}>{userData?.email || 'No email'}</Text>
          
          {/* Role Badge */}
          <View style={[styles.roleBadge, { backgroundColor: getStatusColor(userData?.role || 'user') }]}>
            <Text style={styles.roleText}>
              {getRoleDisplayName(userData?.role || 'user')}
            </Text>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Hourly Rate</Text>
              <Text style={styles.statValue}>
                {userData?.hourlyRate ? `₸${userData.hourlyRate.toFixed(2)}/hr` : 'Not set'}
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Account Status</Text>
              <Text style={styles.statValue}>Active</Text>
            </View>
          </View>
        </View>


        {/* Sign Out Button */}
        <TouchableOpacity 
          style={[styles.signOutButton, isLoggingOut && styles.signOutButtonDisabled]} 
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212529',
    flex: 1,
    textAlign: 'center',
  },
  menuButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  menuIcon: {
    fontSize: 20,
    color: '#495057',
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
    backgroundColor: '#fff',
    margin: 20,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
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
    color: '#6c757d',
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
    backgroundColor: '#fff',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
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
    color: '#6c757d',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
  },
  actionsSection: {
    backgroundColor: '#fff',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
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
    backgroundColor: '#f8f9fa',
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
    color: '#212529',
  },
  actionArrow: {
    fontSize: 18,
    color: '#6c757d',
    fontWeight: '300',
  },
  signOutButton: {
    backgroundColor: '#dc3545',
    margin: 20,
    marginTop: 0,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#dc3545',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  signOutButtonDisabled: {
    backgroundColor: '#6c757d',
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
