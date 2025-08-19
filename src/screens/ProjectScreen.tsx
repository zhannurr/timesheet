import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  RefreshControl,
} from 'react-native';
import { collection, addDoc, deleteDoc, doc, getDocs, query, where, onSnapshot, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import DeleteConfirmation from '../components/DeleteConfirmation';
import LoadingSpinner from '../components/LoadingSpinner';
import SkeletonLoader from '../components/SkeletonLoader';

interface Project {
  id: string;
  name: string;
  userId: string;
  totalHours: number;
  assignedUsers: string[];
}

interface User {
  uid: string;
  email: string;
  role: string;
}

export default function ProjectScreen({ navigation }: { navigation: any }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProject, setNewProject] = useState({
    name: ''
  });
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    visible: boolean;
    projectId: string | null;
  }>({
    visible: false,
    projectId: null,
  });
  
  const { user, userData } = useAuth();
  const { theme } = useTheme();
  const isAdmin = userData?.role === 'admin';

  // Memoize queries to prevent unnecessary re-renders
  const projectsQuery = useMemo(() => {
    if (!user) return null;
    
    const projectsRef = collection(db, 'projects');
    if (isAdmin) {
      return projectsRef;
    } else {
      return query(projectsRef, where('assignedUsers', 'array-contains', user.uid));
    }
  }, [user, isAdmin]);

  // Optimized data fetching with error handling
  const fetchProjects = useCallback(async () => {
    if (!projectsQuery) return;
    
    try {
      setLoading(true);
      const querySnapshot = await getDocs(projectsQuery);
      const projectsData: Project[] = [];
      querySnapshot.forEach((doc) => {
        projectsData.push({ id: doc.id, ...doc.data() } as Project);
      });
      setProjects(projectsData);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  }, [projectsQuery]);

  // Set up real-time listeners with optimization
  useEffect(() => {
    if (!projectsQuery) return;

    const unsubscribe = onSnapshot(
      projectsQuery,
      (querySnapshot) => {
        const projectsData: Project[] = [];
        querySnapshot.forEach((doc) => {
          projectsData.push({ id: doc.id, ...doc.data() } as Project);
        });
        setProjects(projectsData);
        setLoading(false);
      },
      (error) => {
        console.error('Error in projects listener:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [projectsQuery]);

  // Pull-to-refresh functionality
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProjects();
    setRefreshing(false);
  }, [fetchProjects]);

  const addProject = async () => {
    if (!newProject.name) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const projectData = {
        ...newProject,
        createdBy: user?.uid,
        createdAt: new Date(),
        assignedUsers: [user?.uid] // Creator is automatically assigned
      };

      await addDoc(collection(db, 'projects'), projectData);
      setNewProject({ name: '' });
      setShowAddForm(false);
    } catch (error) {
      alert('Failed to create project');
    }
  };

  const addUserToProject = async (projectId: string, userId: string) => {
    try {
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        assignedUsers: arrayUnion(userId)
      });
    } catch (error) {
      alert('Failed to add user to project');
    }
  };

  const removeUserFromProject = async (projectId: string, userId: string) => {
    try {
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        assignedUsers: arrayRemove(userId)
      });
    } catch (error) {
      alert('Failed to remove user from project');
    }
  };

  const openUserManagement = (project: Project) => {
    navigation.navigate('UserManagement', { 
      projectId: project.id, 
      projectName: project.name 
    });
  };

  const showDeleteConfirmation = (projectId: string) => {
    setDeleteConfirmation({
      visible: true,
      projectId,
    });
  };

  const hideDeleteConfirmation = () => {
    setDeleteConfirmation({
      visible: false,
      projectId: null,
    });
  };

  const confirmDeleteProject = async () => {
    if (deleteConfirmation.projectId) {
      try {
        await deleteDoc(doc(db, 'projects', deleteConfirmation.projectId));
        hideDeleteConfirmation();
      } catch (error) {
        console.error('Failed to delete project:', error);
      }
    }
  };

  const openProjectTimesheet = (project: Project) => {
    navigation.navigate('Timesheet', { projectId: project.id, projectName: project.name });
  };

  // Memoize calculations
  const totalProjects = useMemo(() => projects.length, [projects]);
  const totalHours = useMemo(() => 
    projects.reduce((sum, project) => sum + project.totalHours, 0), 
    [projects]
  );

  // Show loading spinner while initial data loads
  if (loading && projects.length === 0) {
    return <LoadingSpinner text="Loading projects..." />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.divider }]}>
        <TouchableOpacity style={styles.menuButton} onPress={() => navigation.openDrawer()}>
          <Text style={[styles.menuIcon, { color: theme.text }]}>☰</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Projects</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={[styles.summary, { backgroundColor: theme.surface, borderBottomColor: theme.divider }]}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Projects</Text>
          <Text style={[styles.summaryValue, { color: theme.text }]}>{totalProjects}</Text>
        </View>
        {isAdmin && (
          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: theme.success }]}
            onPress={() => setShowAddForm(!showAddForm)}
          >
            <Text style={styles.addButtonText}>
              {showAddForm ? 'Cancel' : '+ New Project'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {showAddForm && isAdmin && (
        <View style={[styles.addForm, { backgroundColor: theme.surface, borderBottomColor: theme.divider }]}>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.inputBackground,
                borderColor: theme.inputBorder,
                color: theme.text,
              },
            ]}
            placeholder="Project Name"
            placeholderTextColor={theme.inputPlaceholder}
            value={newProject.name}
            onChangeText={(text) => setNewProject({...newProject, name: text})}
          />
          
          <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.primary }]} onPress={addProject}>
            <Text style={styles.saveButtonText}>Create Project</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView 
        style={styles.projectList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading && projects.length === 0 ? (
          // Show skeleton loaders while loading
          Array.from({ length: 3 }).map((_, index) => (
            <View key={index} style={[styles.projectCard, { backgroundColor: theme.surface, shadowColor: theme.shadow }]}>
              <SkeletonLoader width="70%" height={20} style={{ marginBottom: 10 }} />
              <SkeletonLoader width="40%" height={16} />
            </View>
          ))
        ) : (
          projects.map((project) => (
            <TouchableOpacity
              key={project.id}
              style={[styles.projectCard, { backgroundColor: theme.surface, shadowColor: theme.shadow }]}
              onPress={() => openProjectTimesheet(project)}
            >
              <View style={styles.projectHeader}>
                <Text style={[styles.projectName, { color: theme.text }]}>{project.name}</Text>
                <View style={styles.projectActions}>
                  {isAdmin && (
                    <TouchableOpacity 
                      style={[styles.manageUsersButton, { backgroundColor: theme.primary }]}
                      onPress={() => openUserManagement(project)}
                    >
                      <Text style={styles.manageUsersButtonText}>Users Manage</Text>
                    </TouchableOpacity>
                  )}
                  {isAdmin && (
                    <TouchableOpacity 
                      style={styles.deleteButton}
                      onPress={() => showDeleteConfirmation(project.id)}
                    >
                      <Text style={[styles.deleteButtonText, { backgroundColor: theme.error }]}>Delete</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}

        {!loading && projects.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>No projects yet</Text>
            <Text style={[styles.emptyStateSubtext, { color: theme.textTertiary }]}>
              {isAdmin ? 'Create your first project to get started' : 'You will see projects here once assigned'}
            </Text>
          </View>
        )}
      </ScrollView>

      <DeleteConfirmation
        visible={deleteConfirmation.visible}
        title="Delete Project"
        message="Are you sure you want to delete this project? This action cannot be undone."
        onConfirm={confirmDeleteProject}
        onCancel={hideDeleteConfirmation}
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  menuButton: {
    padding: 10,
    marginRight: 10,
  },
  menuIcon: {
    fontSize: 24,
  },
  headerSpacer: {
    width: 44, // Same width as menuButton for balance
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  addButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  addForm: {
    padding: 20,
    borderBottomWidth: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    fontSize: 16,
  },
  saveButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  projectList: {
    flex: 1,
    padding: 20,
  },
  projectCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  projectName: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  projectActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  manageUsersButton: {
    padding: 8,
    borderRadius: 6,
  },
  manageUsersButtonText: {
    borderRadius: 10,
    color: '#fff',
    fontSize: 16,
  },
  deleteButton: {
    padding: 5,
  },
  deleteButtonText: {
    borderRadius: 10,
    fontSize: 16,
    color: "white",
    padding: 8,
  },
 
  projectFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hoursText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tapText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 20,
  },
  usersList: {
    padding: 20,
  },
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  userInfo: {
    flex: 1,
  },
  userEmail: {
    fontSize: 16,
    fontWeight: '500',
  },
  userRole: {
    fontSize: 14,
    marginTop: 2,
  },
  userActionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  addUserButton: {
    backgroundColor: '#34C759',
  },
  removeUserButton: {
    backgroundColor: '#FF3B30',
  },
  userActionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  emptyStateSubtext: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
