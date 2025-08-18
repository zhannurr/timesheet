import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { collection, onSnapshot, updateDoc, doc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../contexts/AuthContext';

interface User {
  uid: string;
  email: string;
  role: string;
  hourlyRate?: number;
}

interface Project {
  id: string;
  name: string;
  assignedUsers: string[];
}

export default function UserManagementScreen({ navigation, route }: { navigation: any; route: any }) {
  const [users, setUsers] = useState<User[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const { userData } = useAuth();
  const { projectId, projectName } = route.params || {};

  useEffect(() => {
    if (projectId) {
      // Fetch project data
      const projectRef = doc(db, 'projects', projectId);
      const unsubscribeProject = onSnapshot(projectRef, (doc) => {
        if (doc.exists()) {
          setProject(doc.data() as Project);
        }
      });

      // Fetch all users
      const usersRef = collection(db, 'users');
      const unsubscribeUsers = onSnapshot(usersRef, (querySnapshot) => {
        const usersData: User[] = [];
        querySnapshot.forEach((doc) => {
          usersData.push({ uid: doc.id, ...doc.data() } as User);
        });
        setUsers(usersData);
      });

      return () => {
        unsubscribeProject();
        unsubscribeUsers();
      };
    }
  }, [projectId]);

  const toggleUserAssignment = async (userId: string) => {
    if (!project) return;

    const isAssigned = project.assignedUsers?.includes(userId);
    
    try {
      const projectRef = doc(db, 'projects', projectId);
      if (isAssigned) {
        await updateDoc(projectRef, {
          assignedUsers: arrayRemove(userId)
        });
      } else {
        await updateDoc(projectRef, {
          assignedUsers: arrayUnion(userId)
        });
      }
    } catch (error) {
      console.error('Failed to update user assignment:', error);
    }
  };

  const isUserAssigned = (userId: string) => {
    return project?.assignedUsers?.includes(userId) || false;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Manage Users</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.projectInfo}>
        <Text style={styles.projectName}>{projectName}</Text>
        <Text style={styles.projectSubtitle}>Add or remove users from this project</Text>
        {userData?.role === 'admin' && (
          <TouchableOpacity 
            style={styles.hourlyRatesButton}
            onPress={() => navigation.navigate('UserHourlyRates')}
          >
            <Text style={styles.hourlyRatesButtonText}>💰 Manage Hourly Rates</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.usersList}>
        {users.map((userItem) => {
          const assigned = isUserAssigned(userItem.uid);
          return (
            <View key={userItem.uid} style={styles.userItem}>
              <View style={styles.userInfo}>
                <Text style={styles.userEmail}>{userItem.email}</Text>
                <View style={styles.userMeta}>
                  <Text style={styles.userRole}>{userItem.role}</Text>
                  {userItem.hourlyRate !== undefined && (
                    <View style={styles.hourlyRateBadge}>
                                             <Text style={styles.hourlyRateBadgeText}>₸{userItem.hourlyRate.toFixed(2)}/hr</Text>
                    </View>
                  )}
                  {assigned && (
                    <View style={styles.assignedBadge}>
                      <Text style={styles.assignedBadgeText}>Assigned</Text>
                    </View>
                  )}
                </View>
              </View>
              
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  assigned ? styles.removeButton : styles.addButton
                ]}
                onPress={() => toggleUserAssignment(userItem.uid)}
              >
                <Text style={styles.toggleButtonText}>
                  {assigned ? '−' : '+'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 10,
    marginRight: 10,
  },
  backButtonText: {
    fontSize: 24,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  headerSpacer: {
    width: 44,
  },
  projectInfo: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  projectName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  projectSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  usersList: {
    flex: 1,
    padding: 20,
  },
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 15,
    borderRadius: 12,
    shadowColor: '#000',
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
    color: '#333',
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
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  hourlyRateBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  hourlyRateBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  assignedBadge: {
    backgroundColor: '#34C759',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  assignedBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  toggleButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addButton: {
    backgroundColor: '#34C759',
  },
  removeButton: {
    backgroundColor: '#FF3B30',
  },
  toggleButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  hourlyRatesButton: {
    marginTop: 15,
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hourlyRatesButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
