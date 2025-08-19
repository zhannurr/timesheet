import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { collection, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

interface User {
  uid: string;
  email: string;
  role: string;
  hourlyRate?: number;
}

export default function UserHourlyRatesScreen({ navigation }: { navigation: any }) {
  const [users, setUsers] = useState<User[]>([]);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editingRate, setEditingRate] = useState<string>('');
  const { userData } = useAuth();
  const { theme } = useTheme();

  // Check if current user is admin
  if (userData?.role !== 'admin') {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.errorText, { color: theme.error }]}>Access denied. Admin privileges required.</Text>
      </View>
    );
  }

  useEffect(() => {
    // Fetch all users
    const usersRef = collection(db, 'users');
    const unsubscribe = onSnapshot(usersRef, (querySnapshot) => {
      const usersData: User[] = [];
      querySnapshot.forEach((doc) => {
        usersData.push({ uid: doc.id, ...doc.data() } as User);
      });
      setUsers(usersData);
    });

    return () => unsubscribe();
  }, []);

  const startEditing = (user: User) => {
    setEditingUser(user.uid);
    setEditingRate(user.hourlyRate?.toString() || '0');
  };

  const saveHourlyRate = async (userId: string) => {
    const rate = parseFloat(editingRate);
    
    if (isNaN(rate) || rate < 0) {
      alert('Please enter a valid positive number for hourly rate.');
      return;
    }

    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        hourlyRate: rate
      });
      
      setEditingUser(null);
      setEditingRate('');
      alert('Hourly rate updated successfully.');
    } catch (error) {
      console.error('Failed to update hourly rate:', error);
      alert('Failed to update hourly rate. Please try again.');
    }
  };

  const cancelEditing = () => {
    setEditingUser(null);
    setEditingRate('');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.divider }]}>
        <TouchableOpacity style={styles.menuButton} onPress={() => navigation.openDrawer()}>
          <Text style={[styles.menuIcon, { color: theme.text }]}>☰</Text>
        </TouchableOpacity>
        
        <Text style={[styles.title, { color: theme.text }]}>Users</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={[styles.infoSection, { backgroundColor: theme.surface, borderBottomColor: theme.divider }]}>
        <Text style={[styles.infoText, { color: theme.textSecondary }]}>Set hourly rates for each user in tenge (₸)</Text>
      </View>

      <ScrollView style={styles.usersList}>
        {users.map((user) => (
          <View key={user.uid} style={[styles.userItem, { backgroundColor: theme.surface, shadowColor: theme.shadow }]}>
            <View style={styles.userInfo}>
              <TouchableOpacity 
                style={styles.userInfoTouchable}
                onPress={() => navigation.navigate('UserTimesheet', { 
                  userId: user.uid, 
                  userEmail: user.email 
                })}
              >
                <Text style={[styles.userEmail, { color: theme.text }]}>{user.email}</Text>
                <View style={styles.userMeta}>
                  <Text style={[styles.userRole, { backgroundColor: theme.surfaceVariant, color: theme.textSecondary }]}>{user.role}</Text>
                  <Text style={[styles.currentRate, { color: theme.primary }]}>
                    Current: ₸{user.hourlyRate || 0}/hr
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
            
            {editingUser === user.uid ? (
              <View style={styles.editSection}>
                <TextInput
                  style={[
                    styles.rateInput,
                    {
                      backgroundColor: theme.inputBackground,
                      borderColor: theme.inputBorder,
                      color: theme.text,
                    },
                  ]}
                  value={editingRate}
                  onChangeText={setEditingRate}
                  placeholder="0"
                  placeholderTextColor={theme.inputPlaceholder}
                  keyboardType="numeric"
                  autoFocus
                />
                <View style={styles.editButtons}>
                  <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: theme.success }]}
                    onPress={() => saveHourlyRate(user.uid)}
                  >
                    <Text style={styles.saveButtonText}>✓</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.cancelButton, { backgroundColor: theme.error }]}
                    onPress={cancelEditing}
                  >
                    <Text style={styles.cancelButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.editButton, { backgroundColor: theme.primary }]}
                onPress={() => startEditing(user)}
              >
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  menuButton: {
    padding: 10,
    marginRight: 10,
  },
  menuIcon: {
    fontSize: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  headerSpacer: {
    width: 44,
  },
  infoSection: {
    padding: 20,
    borderBottomWidth: 1,
  },
  infoText: {
    fontSize: 14,
    textAlign: 'center',
  },
  usersList: {
    flex: 1,
    padding: 20,
  },
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    marginBottom: 15,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userInfo: {
    flex: 1,
  },
  userEmail: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  userRole: {
    fontSize: 14,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentRate: {
    fontSize: 14,
    fontWeight: '600',
  },
  editButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  editSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rateInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: 80,
    textAlign: 'center',
    fontSize: 16,
  },
  editButtons: {
    flexDirection: 'row',
    gap: 5,
  },
  saveButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
    paddingHorizontal: 20,
  },
  userInfoTouchable: {
    flex: 1,
  },
});
