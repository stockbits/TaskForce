# Input Field System Usage Examples

## Basic Form Implementation

```tsx
import React, { useState } from 'react'
import { Box, Button, Typography } from '@mui/material'
import {
  TextInputField,
  SelectField,
  MultiSelectField,
  GlobalSearchField
} from '@/shared-ui'

export const TaskForm: React.FC = () => {
  const [formData, setFormData] = useState({
    title: '',
    priority: '',
    tags: [] as string[],
    assignee: '',
    searchQuery: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Basic validation
    const newErrors: Record<string, string> = {}
    if (!formData.title.trim()) newErrors.title = 'Title is required'
    if (!formData.priority) newErrors.priority = 'Priority is required'

    setErrors(newErrors)

    if (Object.keys(newErrors).length === 0) {
      console.log('Form submitted:', formData)
      // Handle form submission
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Create New Task
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <TextInputField
          label="Task Title"
          value={formData.title}
          onChange={(value) => setFormData(prev => ({ ...prev, title: value }))}
          error={!!errors.title}
          helperText={errors.title}
          required
          placeholder="Enter a descriptive task title"
        />

        <SelectField
          label="Priority Level"
          options={['Low', 'Medium', 'High', 'Critical']}
          value={formData.priority}
          onChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
          error={!!errors.priority}
          helperText={errors.priority || 'Select the task priority'}
          required
        />

        <MultiSelectField
          label="Tags"
          options={['Bug', 'Feature', 'Documentation', 'Testing', 'Performance', 'Security']}
          value={formData.tags}
          onChange={(value) => setFormData(prev => ({ ...prev, tags: value }))}
          placeholder="Select relevant tags"
          helperText="Select multiple tags that apply to this task"
          maxSelections={3}
        />

        <TextInputField
          label="Assignee"
          value={formData.assignee}
          onChange={(value) => setFormData(prev => ({ ...prev, assignee: value }))}
          placeholder="Enter assignee name or email"
          helperText="Leave empty to assign later"
        />

        <GlobalSearchField
          value={formData.searchQuery}
          onChange={(e) => setFormData(prev => ({ ...prev, searchQuery: e.target.value }))}
          onSearch={() => console.log('Searching for:', formData.searchQuery)}
          placeholder="Search for related tasks or resources"
          showSearchButton={true}
          searchTooltip="Search across all tasks and resources"
        />

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
          <Button type="button" variant="outlined">
            Cancel
          </Button>
          <Button type="submit" variant="contained">
            Create Task
          </Button>
        </Box>
      </Box>
    </Box>
  )
}
```

## Advanced Search Interface

```tsx
import React, { useState, useMemo } from 'react'
import { Box, Paper, Divider, Chip } from '@mui/material'
import {
  GlobalSearchField,
  SelectField,
  MultiSelectField,
  ImpScoreField,
  FreeTypeSelectField
} from '@/shared-ui'

interface SearchFilters {
  query: string
  status: string[]
  priority: string
  assignee: string
  importanceCondition: 'greater' | 'less' | 'equal'
  importanceValue: string
  tags: string[]
}

export const AdvancedSearchPanel: React.FC = () => {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    status: [],
    priority: '',
    assignee: '',
    importanceCondition: 'greater',
    importanceValue: '',
    tags: []
  })

  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (filters.query) count++
    if (filters.status.length > 0) count++
    if (filters.priority) count++
    if (filters.assignee) count++
    if (filters.importanceValue) count++
    if (filters.tags.length > 0) count++
    return count
  }, [filters])

  const handleSearch = () => {
    console.log('Searching with filters:', filters)
    // Implement search logic
  }

  const clearFilters = () => {
    setFilters({
      query: '',
      status: [],
      priority: '',
      assignee: '',
      importanceCondition: 'greater',
      importanceValue: '',
      tags: []
    })
  }

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h6">
          Advanced Search
          {activeFiltersCount > 0 && (
            <Chip
              label={`${activeFiltersCount} active`}
              size="small"
              color="primary"
              sx={{ ml: 2 }}
            />
          )}
        </Typography>
        {activeFiltersCount > 0 && (
          <Button onClick={clearFilters} size="small">
            Clear All
          </Button>
        )}
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Main search */}
        <GlobalSearchField
          value={filters.query}
          onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
          onSearch={handleSearch}
          placeholder="Search tasks, resources, or IDs"
          showSearchButton={true}
          searchTooltip="Press Enter or click search to find matches"
        />

        <Divider />

        {/* Filters row 1 */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
          <SelectField
            label="Priority"
            options={['', 'Low', 'Medium', 'High', 'Critical']}
            value={filters.priority}
            onChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}
            placeholder="Any priority"
          />

          <FreeTypeSelectField
            label="Assignee"
            options={['John Doe', 'Jane Smith', 'Bob Johnson', 'Alice Brown']}
            value={filters.assignee}
            onChange={(value) => setFilters(prev => ({ ...prev, assignee: value }))}
            placeholder="Type or select assignee"
          />

          <ImpScoreField
            label="Importance"
            condition={filters.importanceCondition}
            value={filters.importanceValue}
            onConditionChange={(condition) =>
              setFilters(prev => ({ ...prev, importanceCondition: condition as any }))
            }
            onValueChange={(value) =>
              setFilters(prev => ({ ...prev, importanceValue: value }))
            }
          />
        </Box>

        {/* Filters row 2 */}
        <MultiSelectField
          label="Status"
          options={['Open', 'In Progress', 'Review', 'Testing', 'Closed']}
          value={filters.status}
          onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
          placeholder="Select statuses"
          helperText="Filter by task status"
        />

        <MultiSelectField
          label="Tags"
          options={[
            'Frontend', 'Backend', 'Database', 'API', 'UI/UX', 'Testing',
            'Documentation', 'Performance', 'Security', 'Mobile', 'Web'
          ]}
          value={filters.tags}
          onChange={(value) => setFilters(prev => ({ ...prev, tags: value }))}
          placeholder="Select tags"
          helperText="Filter by tags"
          maxSelections={5}
        />
      </Box>
    </Paper>
  )
}
```

## Data Table with Inline Editing

```tsx
import React, { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableRow, IconButton } from '@mui/material'
import { Edit, Check, Close } from '@mui/icons-material'
import { TextInputField, SelectField } from '@/shared-ui'

interface Task {
  id: string
  title: string
  status: string
  priority: string
  assignee: string
}

export const EditableTaskTable: React.FC<{ tasks: Task[] }> = ({ tasks }) => {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<Task>>({})

  const startEditing = (task: Task) => {
    setEditingId(task.id)
    setEditData({ ...task })
  }

  const saveChanges = () => {
    console.log('Saving changes:', editData)
    // Implement save logic
    setEditingId(null)
    setEditData({})
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditData({})
  }

  const updateField = (field: keyof Task, value: string) => {
    setEditData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Title</TableCell>
          <TableCell>Status</TableCell>
          <TableCell>Priority</TableCell>
          <TableCell>Assignee</TableCell>
          <TableCell>Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {tasks.map((task) => (
          <TableRow key={task.id}>
            <TableCell>
              {editingId === task.id ? (
                <TextInputField
                  value={editData.title || ''}
                  onChange={(value) => updateField('title', value)}
                  size="small"
                  sx={{ minWidth: 200 }}
                />
              ) : (
                task.title
              )}
            </TableCell>
            <TableCell>
              {editingId === task.id ? (
                <SelectField
                  options={['Open', 'In Progress', 'Review', 'Testing', 'Closed']}
                  value={editData.status || ''}
                  onChange={(value) => updateField('status', value)}
                  size="small"
                  sx={{ minWidth: 120 }}
                />
              ) : (
                <Chip
                  label={task.status}
                  color={getStatusColor(task.status)}
                  size="small"
                />
              )}
            </TableCell>
            <TableCell>
              {editingId === task.id ? (
                <SelectField
                  options={['Low', 'Medium', 'High', 'Critical']}
                  value={editData.priority || ''}
                  onChange={(value) => updateField('priority', value)}
                  size="small"
                  sx={{ minWidth: 100 }}
                />
              ) : (
                task.priority
              )}
            </TableCell>
            <TableCell>
              {editingId === task.id ? (
                <TextInputField
                  value={editData.assignee || ''}
                  onChange={(value) => updateField('assignee', value)}
                  size="small"
                  sx={{ minWidth: 150 }}
                />
              ) : (
                task.assignee
              )}
            </TableCell>
            <TableCell>
              {editingId === task.id ? (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton size="small" onClick={saveChanges} color="primary">
                    <Check fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={cancelEditing} color="error">
                    <Close fontSize="small" />
                  </IconButton>
                </Box>
              ) : (
                <IconButton size="small" onClick={() => startEditing(task)}>
                  <Edit fontSize="small" />
                </IconButton>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Open': return 'default'
    case 'In Progress': return 'primary'
    case 'Review': return 'warning'
    case 'Testing': return 'info'
    case 'Closed': return 'success'
    default: return 'default'
  }
}
```

## Settings Panel with Validation

```tsx
import React, { useState } from 'react'
import { Box, Card, CardContent, Typography, Alert } from '@mui/material'
import {
  TextInputField,
  SelectField,
  MultiSelectField
} from '@/shared-ui'

interface UserSettings {
  name: string
  email: string
  role: string
  notifications: string[]
  theme: string
  language: string
}

export const UserSettingsPanel: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings>({
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'Developer',
    notifications: ['email', 'push'],
    theme: 'light',
    language: 'en'
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSave = async () => {
    setSaveStatus('saving')

    // Validation
    const newErrors: Record<string, string> = {}

    if (!settings.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!settings.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!validateEmail(settings.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!settings.role) {
      newErrors.role = 'Role is required'
    }

    setErrors(newErrors)

    if (Object.keys(newErrors).length > 0) {
      setSaveStatus('error')
      return
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (error) {
      setSaveStatus('error')
    }
  }

  const updateSetting = (field: keyof UserSettings, value: string | string[]) => {
    setSettings(prev => ({ ...prev, [field]: value }))

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        User Settings
      </Typography>

      {saveStatus === 'saved' && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Settings saved successfully!
        </Alert>
      )}

      {saveStatus === 'error' && Object.keys(errors).length > 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Please fix the errors below and try again.
        </Alert>
      )}

      <Card>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Typography variant="h6" color="primary">
            Profile Information
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
            <TextInputField
              label="Full Name"
              value={settings.name}
              onChange={(value) => updateSetting('name', value)}
              error={!!errors.name}
              helperText={errors.name}
              required
            />

            <TextInputField
              label="Email Address"
              value={settings.email}
              onChange={(value) => updateSetting('email', value)}
              error={!!errors.email}
              helperText={errors.email}
              type="email"
              required
            />
          </Box>

          <SelectField
            label="Role"
            options={['Developer', 'Designer', 'Manager', 'Admin']}
            value={settings.role}
            onChange={(value) => updateSetting('role', value)}
            error={!!errors.role}
            helperText={errors.role}
            required
          />

          <Typography variant="h6" color="primary" sx={{ mt: 2 }}>
            Preferences
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
            <SelectField
              label="Theme"
              options={['Light', 'Dark', 'Auto']}
              value={settings.theme}
              onChange={(value) => updateSetting('theme', value)}
              helperText="Choose your preferred theme"
            />

            <SelectField
              label="Language"
              options={['English', 'Spanish', 'French', 'German']}
              value={settings.language}
              onChange={(value) => updateSetting('language', value)}
              helperText="Select your language"
            />
          </Box>

          <MultiSelectField
            label="Notifications"
            options={['Email', 'Push', 'SMS', 'In-app']}
            value={settings.notifications}
            onChange={(value) => updateSetting('notifications', value)}
            helperText="Choose how you want to be notified"
          />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saveStatus === 'saving'}
            >
              {saveStatus === 'saving' ? 'Saving...' : 'Save Settings'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
```

## Responsive Form Layout

```tsx
import React, { useState } from 'react'
import { Box, useTheme, useMediaQuery } from '@mui/material'
import {
  TextInputField,
  SelectField,
  MultiSelectField,
  CombinedLocationField
} from '@/shared-ui'

export const ResponsiveContactForm: React.FC = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'))

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    jobTitle: '',
    industry: '',
    interests: [] as string[],
    locationValue: '',
    locationType: 'address' as 'address' | 'coordinates' | 'landmark'
  })

  const updateField = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: isMobile ? 2 : 4 }}>
      <Typography variant={isMobile ? 'h5' : 'h4'} gutterBottom align="center">
        Contact Us
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr 1fr' : '1fr 1fr 1fr',
          gap: 3
        }}
      >
        {/* Personal Information */}
        <Box sx={{ gridColumn: isMobile ? '1' : '1 / -1' }}>
          <Typography variant="h6" color="primary" gutterBottom>
            Personal Information
          </Typography>
        </Box>

        <TextInputField
          label="First Name"
          value={formData.firstName}
          onChange={(value) => updateField('firstName', value)}
          required
        />

        <TextInputField
          label="Last Name"
          value={formData.lastName}
          onChange={(value) => updateField('lastName', value)}
          required
        />

        <TextInputField
          label="Email"
          value={formData.email}
          onChange={(value) => updateField('email', value)}
          type="email"
          required
        />

        <TextInputField
          label="Phone"
          value={formData.phone}
          onChange={(value) => updateField('phone', value)}
          type="tel"
        />

        {/* Professional Information */}
        <Box sx={{
          gridColumn: isMobile ? '1' : '1 / -1',
          mt: isMobile ? 2 : 4
        }}>
          <Typography variant="h6" color="primary" gutterBottom>
            Professional Information
          </Typography>
        </Box>

        <TextInputField
          label="Company"
          value={formData.company}
          onChange={(value) => updateField('company', value)}
        />

        <TextInputField
          label="Job Title"
          value={formData.jobTitle}
          onChange={(value) => updateField('jobTitle', value)}
        />

        <SelectField
          label="Industry"
          options={[
            'Technology', 'Healthcare', 'Finance', 'Education',
            'Manufacturing', 'Retail', 'Consulting', 'Other'
          ]}
          value={formData.industry}
          onChange={(value) => updateField('industry', value)}
        />

        <MultiSelectField
          label="Areas of Interest"
          options={[
            'Product Development', 'Consulting', 'Partnerships',
            'Investments', 'Careers', 'Media', 'Events'
          ]}
          value={formData.interests}
          onChange={(value) => updateField('interests', value)}
          placeholder="Select areas of interest"
        />

        {/* Location */}
        <Box sx={{
          gridColumn: isMobile ? '1' : '1 / -1',
          mt: isMobile ? 2 : 4
        }}>
          <Typography variant="h6" color="primary" gutterBottom>
            Location
          </Typography>
        </Box>

        <Box sx={{ gridColumn: isMobile ? '1' : '1 / -1' }}>
          <CombinedLocationField
            label="Business Location"
            locationValue={formData.locationValue}
            locationType={formData.locationType}
            onLocationValueChange={(value) => updateField('locationValue', value)}
            onLocationTypeChange={(value) => updateField('locationType', value)}
          />
        </Box>

        {/* Submit Button */}
        <Box sx={{
          gridColumn: isMobile ? '1' : '1 / -1',
          display: 'flex',
          justifyContent: 'center',
          mt: 4
        }}>
          <Button variant="contained" size="large" sx={{ minWidth: 200 }}>
            Submit Inquiry
          </Button>
        </Box>
      </Box>
    </Box>
  )
}
```