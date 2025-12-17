import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Alert
} from '@mui/material';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import resourceTaskMappingData from '../data/resourceTaskMapping.json';

interface Task {
  taskId: string;
  taskType: string;
  taskStatus: string;
  expectedStartDate: string;
  expectedFinishDate: string;
  lat: number;
  lng: number;
  postCode: string;
  estimatedDuration: number;
  priority: string;
}

interface ResourceAssignment {
  resourceId: string;
  resourceName: string;
  homeLat: number;
  homeLng: number;
  assignedTasks: Task[];
}

export default function ResourceTaskSimulator() {
  const [assignments, setAssignments] = useState<ResourceAssignment[]>(resourceTaskMappingData);
  const [lastShuffleTime, setLastShuffleTime] = useState<Date | null>(null);
  const [travelStats, setTravelStats] = useState<{[key: string]: number}>({});

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Calculate travel statistics for each resource
  const calculateTravelStats = (assignments: ResourceAssignment[]) => {
    const stats: {[key: string]: number} = {};

    assignments.forEach(resource => {
      if (resource.assignedTasks.length === 0) {
        stats[resource.resourceId] = 0;
        return;
      }

      let totalDistance = 0;

      // Distance from home to first task
      const firstTask = resource.assignedTasks[0];
      totalDistance += calculateDistance(
        resource.homeLat, resource.homeLng,
        firstTask.lat, firstTask.lng
      );

      // Distance between consecutive tasks
      for (let i = 0; i < resource.assignedTasks.length - 1; i++) {
        const currentTask = resource.assignedTasks[i];
        const nextTask = resource.assignedTasks[i + 1];
        totalDistance += calculateDistance(
          currentTask.lat, currentTask.lng,
          nextTask.lat, nextTask.lng
        );
      }

      stats[resource.resourceId] = Math.round(totalDistance * 100) / 100; // Round to 2 decimal places
    });

    return stats;
  };

  useEffect(() => {
    setTravelStats(calculateTravelStats(assignments));
  }, [assignments]);

  // Shuffle tasks between resources
  const shuffleAssignments = () => {
    const allTasks = assignments.flatMap(resource =>
      resource.assignedTasks.map(task => ({ ...task, originalResource: resource.resourceId }))
    );

    // Shuffle the tasks array
    const shuffledTasks = [...allTasks].sort(() => Math.random() - 0.5);

    // Distribute tasks to resources (some resources might get multiple, some none)
    const newAssignments = assignments.map(resource => ({
      ...resource,
      assignedTasks: [] as Task[]
    }));

    shuffledTasks.forEach((task, index) => {
      const resourceIndex = index % newAssignments.length;
      newAssignments[resourceIndex].assignedTasks.push(task);
    });

    setAssignments(newAssignments);
    setLastShuffleTime(new Date());
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Resource Task Assignment Simulator
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        This simulator demonstrates dynamic task reassignment between resources.
        Use the shuffle button to randomly redistribute tasks and see how travel distances change.
      </Alert>

      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<ShuffleIcon />}
          onClick={shuffleAssignments}
          size="large"
          sx={{ mr: 2 }}
        >
          Shuffle Task Assignments
        </Button>

        {lastShuffleTime && (
          <Typography variant="body2" color="text.secondary">
            Last shuffled: {lastShuffleTime.toLocaleTimeString()}
          </Typography>
        )}
      </Box>

      <Grid container spacing={3}>
        {assignments.map((resource) => (
          <Grid item xs={12} md={6} lg={4} key={resource.resourceId}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                    {getInitials(resource.resourceName)}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">
                      {resource.resourceName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ID: {resource.resourceId}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <LocationOnIcon sx={{ mr: 1, color: 'action.active' }} />
                  <Typography variant="body2">
                    Travel Distance: {travelStats[resource.resourceId] || 0} km
                  </Typography>
                </Box>

                <Typography variant="subtitle2" gutterBottom>
                  Assigned Tasks ({resource.assignedTasks.length}):
                </Typography>

                {resource.assignedTasks.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    No tasks assigned
                  </Typography>
                ) : (
                  <List dense>
                    {resource.assignedTasks.map((task, index) => (
                      <React.Fragment key={task.taskId}>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemAvatar>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                              {index + 1}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                  {task.taskType}
                                </Typography>
                                <Chip
                                  label={task.priority}
                                  size="small"
                                  color={getPriorityColor(task.priority)}
                                  variant="outlined"
                                />
                              </Box>
                            }
                            secondary={
                              <Box>
                                <Typography variant="caption" display="block">
                                  {task.taskId} • {task.postCode}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                  <AccessTimeIcon sx={{ fontSize: 14, mr: 0.5, color: 'action.active' }} />
                                  <Typography variant="caption">
                                    {task.expectedStartDate} - {task.expectedFinishDate}
                                  </Typography>
                                </Box>
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < resource.assignedTasks.length - 1 && <Divider component="li" />}
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}