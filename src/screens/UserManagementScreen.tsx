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
import { useTheme } from '../contexts/ThemeContext';

interface User {
  uid: string;
  email: string;
  role: string;
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
  const { theme } = useTheme();
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
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.divider }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={[styles.backButtonText, { color: theme.primary }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Manage Users</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={[styles.projectInfo, { backgroundColor: theme.surface, borderBottomColor: theme.divider }]}>
        <Text style={[styles.projectName, { color: theme.text }]}>{projectName}</Text>
        <Text style={[styles.projectSubtitle, { color: theme.textSecondary }]}>Add or remove users from this project</Text>
      </View>

      <ScrollView style={styles.usersList}>
        {users.map((userItem) => {
          const assigned = isUserAssigned(userItem.uid);
          return (
            <View key={userItem.uid} style={[styles.userItem, { backgroundColor: theme.surface, shadowColor: theme.shadow }]}>
              <View style={styles.userInfo}>
                <Text style={[styles.userEmail, { color: theme.text }]}>{userItem.email}</Text>
                <View style={styles.userMeta}>
                  <Text style={[styles.userRole, { backgroundColor: theme.surfaceVariant, color: theme.textSecondary }]}>{userItem.role}</Text>
                  {assigned && (
                    <View style={[styles.assignedBadge, { backgroundColor: theme.success }]}>
                      <Text style={styles.assignedBadgeText}>Assigned</Text>
                    </View>
                  )}
                </View>
              </View>
              
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  { shadowColor: theme.shadow },
                  assigned ? [styles.removeButton, { backgroundColor: theme.error }] : [styles.addButton, { backgroundColor: theme.success }]
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 10,
    marginRight: 10,
  },
  backButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  headerSpacer: {
    width: 44,
  },
  projectInfo: {
    padding: 20,
    borderBottomWidth: 1,
  },
  projectName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  projectSubtitle: {
    fontSize: 14,
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
  assignedBadge: {
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addButton: {
    // backgroundColor will be set dynamically
  },
  removeButton: {
    // backgroundColor will be set dynamically
  },
  toggleButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
});