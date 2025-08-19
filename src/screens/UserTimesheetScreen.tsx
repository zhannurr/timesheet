import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { collection, query, where, onSnapshot, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../contexts/AuthContext';
import DeleteConfirmation from '../components/DeleteConfirmation';
import LoadingSpinner from '../components/LoadingSpinner';
import SkeletonLoader from '../components/SkeletonLoader';

interface TimeEntry {
  id: string;
  date: string;
  projectId: string;
  projectName: string;
  task: string;
  hours: string;
  userId: string;
}

interface UserTimesheetScreenProps {
  navigation: any;
  route: {
    params: {
      userId: string;
      userEmail: string;
    };
  };
}

export default function UserTimesheetScreen({ navigation, route }: UserTimesheetScreenProps) {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [projects, setProjects] = useState<{[key: string]: string}>({});
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    visible: boolean;
    entryId: string | null;
    hours: string;
  }>({
    visible: false,
    entryId: null,
    hours: '',
  });
  const { userData } = useAuth();
  const { userId, userEmail } = route.params;

  // Memoize the query to prevent unnecessary re-renders
  const tasksQuery = useMemo(() => {
    if (!userId) return null;
    
    const tasksRef = collection(db, 'tasks');
    return query(tasksRef, where('userId', '==', userId));
  }, [userId]);

  // Optimized data fetching with error handling
  const fetchTimeEntries = useCallback(async () => {
    if (!tasksQuery) return;
    
    try {
      setLoading(true);
      const querySnapshot = await getDocs(tasksQuery);
      const tasksData: TimeEntry[] = [];
      querySnapshot.forEach((doc) => {
        tasksData.push({ id: doc.id, ...doc.data() } as TimeEntry);
      });
      setTimeEntries(tasksData);
    } catch (error) {
      console.error('Error fetching time entries:', error);
    } finally {
      setLoading(false);
    }
  }, [tasksQuery]);

  // Set up real-time listener with optimization
  useEffect(() => {
    if (!tasksQuery) return;

    const unsubscribe = onSnapshot(
      tasksQuery,
      (querySnapshot) => {
        const tasksData: TimeEntry[] = [];
        querySnapshot.forEach((doc) => {
          tasksData.push({ id: doc.id, ...doc.data() } as TimeEntry);
        });
        setTimeEntries(tasksData);
        setLoading(false);
      },
      (error) => {
        console.error('Error in real-time listener:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [tasksQuery]);

  // Fetch project names
  const fetchProjects = useCallback(async () => {
    try {
      const projectsRef = collection(db, 'projects');
      const projectsSnapshot = await getDocs(projectsRef);
      const projectsMap: {[key: string]: string} = {};
      projectsSnapshot.forEach((doc) => {
        projectsMap[doc.id] = doc.data().name || 'Unknown Project';
      });
      setProjects(projectsMap);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Pull-to-refresh functionality
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTimeEntries();
    setRefreshing(false);
  }, [fetchTimeEntries]);

  // Memoize total hours calculation
  const totalHours = useMemo(() => 
    timeEntries.reduce((sum, entry) => sum + parseFloat(entry.hours || '0'), 0), 
    [timeEntries]
  );

  const showDeleteConfirmation = (entryId: string, hours: string) => {
    setDeleteConfirmation({
      visible: true,
      entryId,
      hours,
    });
  };

  const hideDeleteConfirmation = () => {
    setDeleteConfirmation({
      visible: false,
      entryId: null,
      hours: '',
    });
  };

  const confirmDeleteTimeEntry = async () => {
    if (deleteConfirmation.entryId) {
      try {
        await deleteDoc(doc(db, 'tasks', deleteConfirmation.entryId));
        
        // Update project total hours
        const entryToDelete = timeEntries.find(entry => entry.id === deleteConfirmation.entryId);
        if (entryToDelete?.projectId) {
          const projectRef = doc(db, 'projects', entryToDelete.projectId);
          const currentProject = await getDocs(query(collection(db, 'projects'), where('__name__', '==', entryToDelete.projectId)));
          if (!currentProject.empty) {
            const projectData = currentProject.docs[0].data();
            const newTotalHours = Math.max(0, (projectData.totalHours || 0) - parseFloat(deleteConfirmation.hours));
            await updateDoc(projectRef, { totalHours: newTotalHours });
          }
        }
        
        hideDeleteConfirmation();
      } catch (error) {
        console.error('Failed to delete time entry:', error);
      }
    }
  };

  // Show loading spinner while initial data loads
  if (loading && timeEntries.length === 0) {
    return <LoadingSpinner text="Loading timesheet..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('UserHourlyRates')}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{userEmail} Timesheet</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.summary}>
        <Text style={styles.summaryText}>Total Hours: {totalHours.toFixed(2)}</Text>
      </View>

      <ScrollView 
        style={styles.tableContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.tableHeader}>
          <Text style={[styles.headerCell, styles.dateCell]}>Date</Text>
          <Text style={[styles.headerCell, styles.taskCell]}>Task</Text>
          <Text style={[styles.headerCell, styles.hoursCell]}>Hours</Text>
          <Text style={[styles.headerCell, styles.projectCell]}>Project</Text>
          <Text style={[styles.headerCell, styles.actionCell]}>Actions</Text>
        </View>

        {loading && timeEntries.length === 0 ? (
          // Show skeleton loaders while loading
          Array.from({ length: 5 }).map((_, index) => (
            <View key={index} style={styles.tableRow}>
              <SkeletonLoader width="80%" height={16} />
              <SkeletonLoader width="90%" height={16} />
              <SkeletonLoader width="60%" height={16} />
              <SkeletonLoader width="70%" height={16} />
              <SkeletonLoader width="70%" height={16} />
            </View>
          ))
        ) : (
          timeEntries.map((entry) => (
            <View key={entry.id} style={styles.tableRow}>
              <Text style={[styles.cell, styles.dateCell]}>{entry.date}</Text>
              <Text style={[styles.cell, styles.taskCell]}>{entry.task}</Text>
              <Text style={[styles.cell, styles.hoursCell]}>{entry.hours}</Text>
              <Text style={[styles.cell, styles.projectCell]}>
                {projects[entry.projectId] || 'Unknown Project'}
              </Text>
              <View style={styles.actionCell}>
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={() => showDeleteConfirmation(entry.id, entry.hours)}
                >
                  <Text style={styles.deleteButtonText}>Delete🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {!loading && timeEntries.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No time entries yet</Text>
            <Text style={styles.emptyStateSubtext}>This user hasn't logged any time entries</Text>
          </View>
        )}
      </ScrollView>
      <DeleteConfirmation
        visible={deleteConfirmation.visible}
        title="Delete Time Entry"
        message="Are you sure you want to delete this time entry? This action cannot be undone."
        onConfirm={confirmDeleteTimeEntry}
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
  summaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  tableContainer: {
    flex: 1,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerCell: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333',
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  cell: {   
    fontSize: 14,   
    color: '#333',
  },
  dateCell: {
    flex: 1,
  },
  taskCell: {
    flex: 1.5,
  },
  hoursCell: {
    flex: 0.5,
    textAlign: 'center',
  },
  projectCell: {
    flex: 1,
  },
  actionCell: {
    flex: 0.5,
    alignItems: 'flex-start',
  },
  deleteButton: {
    padding: 5,
  },
  deleteButtonText: {
    fontSize: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 50,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginHorizontal: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 10,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#888',
  },
});
