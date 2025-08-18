import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function ProfileScreen({ navigation }: { navigation: any }) {
  const { userData, logout, promoteToAdmin } = useAuth();



  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={() => navigation.openDrawer()}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.profileInfo}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {userData?.email?.charAt(0).toUpperCase() || 'U'}
          </Text>
        </View>
        
        <Text style={styles.email}>{userData?.email || 'No email'}</Text>
        
        <View style={styles.userDetails}>
          <Text style={styles.role}>
            Role: {userData?.role ? userData.role.charAt(0).toUpperCase() + userData.role.slice(1) : 'User'}
          </Text>
          {userData?.hourlyRate ? (
            <Text style={styles.hourlyRate}>
              Hourly Rate: ₸{userData.hourlyRate.toFixed(2)}/hr
            </Text>
          ) : (
            <Text style={styles.noRate}>No hourly rate set</Text>
          )}
        </View>
        
        {userData?.role !== 'admin' && (
          <TouchableOpacity 
            style={styles.promoteButton}
            onPress={async () => {
              try {
                await promoteToAdmin(userData?.uid || '');
                Alert.alert('Success', 'You have been promoted to admin!');
              } catch (error) {
                Alert.alert('Error', 'Failed to promote to admin. Please try again.');
              }
            }}
          >
            <Text style={styles.promoteButtonText}>🚀 Promote to Admin (Test)</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity style={styles.signOutButton} onPress={logout}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  menuButton: {
    padding: 10,
    marginRight: 10,
  },
  menuIcon: {
    fontSize: 24,
    color: '#333',
  },
  headerSpacer: {
    width: 44, // Same width as menuButton for balance
  },
  profileInfo: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 40,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
  },
  email: {
    fontSize: 18,
    color: '#666',
    marginBottom: 40,
  },
  signOutButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
  },
  signOutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  userDetails: {
    marginBottom: 20,
  },
  role: {
    fontSize: 16,
    color: '#555',
    marginBottom: 5,
  },
  hourlyRate: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  noRate: {
    fontSize: 16,
    color: '#999',
  },
  promoteButton: {
    backgroundColor: '#4CAF50', // A green color for promotion
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  promoteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
