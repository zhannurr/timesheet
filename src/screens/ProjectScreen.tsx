import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { collection, addDoc, deleteDoc, doc, getDocs, query, where, onSnapshot, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../contexts/AuthContext';
import DeleteConfirmation from '../components/DeleteConfirmation';

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
  const [users, setUsers] = useState<User[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
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
  const isAdmin = userData?.role === 'admin';

  useEffect(() => {
    if (user) {
      const projectsRef = collection(db, 'projects');
      let q;
      
      if (isAdmin) {
        // Admin can see all projects
        q = projectsRef;
      } else {
        // Regular users only see projects they're assigned to
        q = query(projectsRef, where('assignedUsers', 'array-contains', user.uid));
      }
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const projectsData: Project[] = [];
        querySnapshot.forEach((doc) => {
          projectsData.push({ id: doc.id, ...doc.data() } as Project);
        });
        setProjects(projectsData);
      });

      return () => unsubscribe();
    }
  }, [user, isAdmin]);

  useEffect(() => {
    // Fetch all users for admin management
    if (isAdmin) {
      const usersRef = collection(db, 'users');
      
      const unsubscribe = onSnapshot(usersRef, (querySnapshot) => {
        const usersData: User[] = [];
        querySnapshot.forEach((doc) => {
          usersData.push({ uid: doc.id, ...doc.data() } as User);
        });
        setUsers(usersData);
      });

      return () => unsubscribe();
    }
  }, [isAdmin]);

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

  const totalProjects = projects.length;
  const totalHours = projects.reduce((sum, project) => sum + project.totalHours, 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={() => navigation.openDrawer()}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Projects</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Projects</Text>
          <Text style={styles.summaryValue}>{totalProjects}</Text>
        </View>
        {/* <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Hours</Text>
          <Text style={styles.summaryValue}>{totalHours}</Text>
        </View> */}
        {isAdmin && (
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowAddForm(!showAddForm)}
          >
            <Text style={styles.addButtonText}>
              {showAddForm ? 'Cancel' : '+ New Project'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {showAddForm && isAdmin && (
        <View style={styles.addForm}>
          <TextInput
            style={styles.input}
            placeholder="Project Name"
            value={newProject.name}
            onChangeText={(text) => setNewProject({...newProject, name: text})}
          />
          
          <TouchableOpacity style={styles.saveButton} onPress={addProject}>
            <Text style={styles.saveButtonText}>Create Project</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={styles.projectList}>
        {projects.map((project) => (
          <TouchableOpacity
            key={project.id}
            style={styles.projectCard}
            onPress={() => openProjectTimesheet(project)}
          >
            <View style={styles.projectHeader}>
              <Text style={styles.projectName}>{project.name}</Text>
              <View style={styles.projectActions}>
                {isAdmin && (
                  <TouchableOpacity 
                    style={styles.manageUsersButton}
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
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
        
            {/* <View style={styles.projectFooter}>
              <Text style={styles.hoursText}>{project.totalHours} hours</Text>

            </View> */}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* User Management Modal */}
      <Modal
        visible={showUserManagement}
        transparent
        animationType="slide"
        onRequestClose={() => setShowUserManagement(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Manage Users - {selectedProject?.name}
              </Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowUserManagement(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.usersList}>
              {users.map((userItem) => {
                const isAssigned = selectedProject?.assignedUsers?.includes(userItem.uid);
                return (
                  <View key={userItem.uid} style={styles.userItem}>
                    <View style={styles.userInfo}>
                      <Text style={styles.userEmail}>{userItem.email}</Text>
                      <Text style={styles.userRole}>{userItem.role}</Text>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.userActionButton,
                        isAssigned ? styles.removeUserButton : styles.addUserButton
                      ]}
                      onPress={() => {
                        if (isAssigned) {
                          removeUserFromProject(selectedProject!.id, userItem.uid);
                        } else {
                          addUserToProject(selectedProject!.id, userItem.uid);
                        }
                      }}
                    >
                      <Text style={styles.userActionButtonText}>
                        {isAssigned ? 'Remove' : 'Add'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

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
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#34C759',
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
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#007AFF',
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
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
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
    color: '#333',
    flex: 1,
  },
  projectActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  manageUsersButton: {
    padding: 8,
    backgroundColor: '#007AFF',
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
    backgroundColor: '#FF3B30',
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
    color: '#007AFF',
  },
  tapText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
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
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#666',
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
    borderBottomColor: '#f0f0f0',
  },
  userInfo: {
    flex: 1,
  },
  userEmail: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  userRole: {
    fontSize: 14,
    color: '#666',
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
});
