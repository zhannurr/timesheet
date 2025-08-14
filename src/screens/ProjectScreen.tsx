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
import { collection, addDoc, deleteDoc, doc, getDocs, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../contexts/AuthContext';

interface Project {
  id: string;
  name: string;
  userId: string;
  totalHours: number;
}

export default function ProjectScreen({ navigation }: { navigation: any }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProject, setNewProject] = useState({
    name: ''
  });
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const projectsRef = collection(db, 'projects');
      const q = query(projectsRef, where('userId', '==', user.uid));
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const projectsData: Project[] = [];
        querySnapshot.forEach((doc) => {
          projectsData.push({ id: doc.id, ...doc.data() } as Project);
        });
        setProjects(projectsData);
      });

      return () => unsubscribe();
    }
  }, [user]);

  const addProject = async () => {
    if (!newProject.name) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      const projectData = {
        ...newProject,
        userId: user?.uid,
        totalHours: 0,
        createdAt: new Date()
      };

      await addDoc(collection(db, 'projects'), projectData);
      setNewProject({ name: '' });
      setShowAddForm(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to create project');
    }
  };

  const deleteProject = async (id: string) => {
    Alert.alert(
      'Delete Project',
      'Are you sure you want to delete this project?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await deleteDoc(doc(db, 'projects', id));
          } catch (error) {
            Alert.alert('Error', 'Failed to delete project');
          }
        }}
      ]
    );
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
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Hours</Text>
          <Text style={styles.summaryValue}>{totalHours}</Text>
        </View>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowAddForm(!showAddForm)}
        >
          <Text style={styles.addButtonText}>
            {showAddForm ? 'Cancel' : '+ New Project'}
          </Text>
        </TouchableOpacity>
      </View>

      {showAddForm && (
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
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => deleteProject(project.id)}
              >
                <Text style={styles.deleteButtonText}>🗑️</Text>
              </TouchableOpacity>
            </View>
        
            <View style={styles.projectFooter}>
              <Text style={styles.hoursText}>{project.totalHours} hours</Text>
              <Text style={styles.tapText}>Tap to view timesheet →</Text>
            </View>
          </TouchableOpacity>
        ))}
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
  deleteButton: {
    padding: 5,
  },
  deleteButtonText: {
    fontSize: 16,
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
});
