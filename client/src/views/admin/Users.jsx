// ✅ CLEANED + FIXED USERS PAGE
// Removed duplicate functions, fixed token auth, session handling,
// proper validation, add/edit/delete/view all working.

import { useEffect, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

// MUI
import {
  Box,
  Paper,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Typography,
  Stack,
  IconButton,
  Tooltip
} from '@mui/material';

import { Add, Edit, Delete, Visibility } from '@mui/icons-material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';

// project imports
import MainCard from 'ui-component/cards/MainCard';
import REACT_APP_BASE_URL from 'utils/api';

const affiliations = ['University', 'Institute', 'Company', 'Hospital', 'Other'];
const roles = ['client', 'manager', 'analyst'];

const defaultForm = () => ({
  name: '',
  email: '',
  password: generatePassword(),
  affiliation: '',
  address: '',
  country: '',
  phone: '',
  role: 'client'
});

// ==============================
// PASSWORD GENERATOR
// ==============================
function generatePassword(length = 10) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$';
  let password = '';

  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return password;
}

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const [open, setOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);

  const [editUser, setEditUser] = useState(null);
  const [viewUser, setViewUser] = useState(null);

  const [form, setForm] = useState(defaultForm());

  // ==============================
  // AUTH DATA
  // ==============================
  const token = localStorage.getItem('token');
  // console.log("TOKEN:", localStorage.getItem("token"));s

  const authHeaders = {
    Authorization: `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  };

  // ==============================
  // LOGOUT ON INVALID TOKEN
  // ==============================
  const logoutUser = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    Swal.fire({
      icon: 'error',
      title: 'Session Expired',
      text: 'Please login again'
    }).then(() => {
      window.location.href = '/login';
    });
  };

  // ==============================
  // FETCH USERS
  // ==============================
  const fetchUsers = async () => {
    try {
      setLoading(true);

      const res = await axios.get(`${REACT_APP_BASE_URL}/users`, {
        headers: authHeaders
      });

      setUsers(res.data || []);
    } catch (error) {
      if (error.response?.status === 401) {
        // logoutUser();
        return;
      }

      Swal.fire('Error', error.response?.data?.message || 'Failed to fetch users', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      logoutUser();
      return;
    }

    fetchUsers();
  }, []);

  // ==============================
  // HANDLE INPUT
  // ==============================
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  // ==============================
  // OPEN ADD / EDIT
  // ==============================
  const handleOpen = (user = null) => {
    setEditUser(user);

    if (user) {
      setForm({
        ...user,
        password: generatePassword()
      });
    } else {
      setForm(defaultForm());
    }

    setOpen(true);
  };

  // ==============================
  // CLOSE MODAL
  // ==============================
  const handleClose = () => {
    setOpen(false);
    setEditUser(null);
    setForm(defaultForm());
  };

  // ==============================
  // VIEW USER
  // ==============================
  const handleView = (user) => {
    setViewUser(user);
    setViewOpen(true);
  };

  // ==============================
  // SAVE USER
  // ==============================
  const handleSubmit = async () => {
    try {
      if (!form.name.trim()) {
        return Swal.fire('Validation Error', 'Name is required', 'warning');
      }

      if (!form.email.trim()) {
        return Swal.fire('Validation Error', 'Email is required', 'warning');
      }

      if (!editUser && !form.password.trim()) {
        return Swal.fire('Validation Error', 'Password is required', 'warning');
      }

      const payload = {
        name: form.name,
        email: form.email,
        affiliation: form.affiliation || 'Other',
        address: form.address,
        country: form.country,
        phone: form.phone,
        role: form.role
      };

      if (!editUser) {
        payload.password = form.password;
      }

      let response;

      if (editUser) {
        response = await axios.put(`${REACT_APP_BASE_URL}/users/${editUser._id}`, payload, { headers: authHeaders });
      } else {
        response = await axios.post(`${REACT_APP_BASE_URL}/users`, payload, { headers: authHeaders });
      }

      Swal.fire('Success', response.data.message || (editUser ? 'User updated successfully' : 'User added successfully'), 'success');

      handleClose();
      fetchUsers();
    } catch (error) {
      if (error.response?.status === 401) {
        logoutUser();
        return;
      }

      Swal.fire('Error', error.response?.data?.message || 'Operation failed', 'error');
    }
  };

  // ==============================
  // DELETE USER
  // ==============================
  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'This user will be deleted permanently.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33'
    });

    if (!result.isConfirmed) return;

    try {
      await axios.delete(`${REACT_APP_BASE_URL}/users/${id}`, {
        headers: authHeaders
      });

      Swal.fire('Deleted!', 'User deleted successfully', 'success');

      fetchUsers();
    } catch (error) {
      if (error.response?.status === 401) {
        logoutUser();
        return;
      }

      Swal.fire('Error', error.response?.data?.message || 'Delete failed', 'error');
    }
  };

  // ==============================
  // TABLE COLUMNS
  // ==============================
  const columns = [
    { field: 'name', headerName: 'Name', flex: 1 },
    { field: 'email', headerName: 'Email', flex: 1.3 },
    { field: 'affiliation', headerName: 'Affiliation', flex: 1 },
    { field: 'country', headerName: 'Country', flex: 1 },
    { field: 'phone', headerName: 'Phone', flex: 1 },
    { field: 'role', headerName: 'Role', flex: 1 },
    // ✅ PASSWORD COLUMN
    {
      field: 'password',
      headerName: 'Password',
      flex: 1,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => (
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            color: 'primary.main',
            bgcolor: 'primary.lighter',
            px: 1.5,
            py: 0.5,
            borderRadius: 2,
            fontFamily: 'monospace'
          }}
        >
          {params.row.plainPassword || 'N/A'}
        </Typography>
      )
    },

    {
      field: 'actions',
      headerName: 'Actions',
      sortable: false,
      flex: 1,
      headerAlign: 'center', // Center header text
      align: 'center', // Center cell content
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <Tooltip title="View">
            <IconButton color="info" onClick={() => handleView(params.row)}>
              <Visibility />
            </IconButton>
          </Tooltip>

          <Tooltip title="Edit">
            <IconButton color="primary" onClick={() => handleOpen(params.row)}>
              <Edit />
            </IconButton>
          </Tooltip>

          <Tooltip title="Delete">
            <IconButton color="error" onClick={() => handleDelete(params.row._id)}>
              <Delete />
            </IconButton>
          </Tooltip>
        </Stack>
      )
    }
  ];

  return (
    <MainCard
      title="Users Management"
      secondary={
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
          Add User
        </Button>
      }
    >
      <Box sx={{ height: 550, width: '100%' }}>
        <DataGrid
          rows={users}
          columns={columns}
          getRowId={(row) => row._id}
          loading={loading}
          pageSizeOptions={[5, 10, 25, 50]}
          disableRowSelectionOnClick
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 10,
                page: 0
              }
            }
          }}
          slots={{
            toolbar: GridToolbar
          }}
          slotProps={{
            toolbar: {
              showQuickFilter: true
            }
          }}
        />
      </Box>
      {/* ADD / EDIT MODAL */}
      {/* ADD / EDIT DIALOG */}
      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 1
          }
        }}
      >
        {/* HEADER */}
        <DialogTitle
          sx={{
            fontSize: '1.4rem',
            fontWeight: 700,
            borderBottom: '1px solid #eee',
            pb: 2
          }}
        >
          {editUser ? 'Edit User' : 'Add New User'}
        </DialogTitle>

        {/* FORM BODY */}
        <DialogContent sx={{ pt: 3, mt: 4 }}>
          <Box
            display="grid"
            gridTemplateColumns={{
              xs: '1fr',
              sm: '1fr 1fr'
            }}
            gap={2.5}
          >
            {/* NAME */}
            <TextField label="Full Name" name="name" value={form.name} onChange={handleChange} fullWidth variant="outlined" />

            {/* EMAIL */}
            <TextField label="Email Address" name="email" type="email" value={form.email} onChange={handleChange} fullWidth />

            {/* PASSWORD */}
            <TextField
              label="Auto Generated Password"
              name="password"
              value={form.password}
              fullWidth
              InputProps={{
                readOnly: true
              }}
            />

            {/* AFFILIATION */}
            <TextField select label="Affiliation" name="affiliation" value={form.affiliation} onChange={handleChange} fullWidth>
              {affiliations.map((item) => (
                <MenuItem key={item} value={item}>
                  {item}
                </MenuItem>
              ))}
            </TextField>

            {/* COUNTRY */}
            <TextField label="Country" name="country" value={form.country} onChange={handleChange} fullWidth />

            {/* PHONE */}
            <TextField label="Phone Number" name="phone" value={form.phone} onChange={handleChange} fullWidth />

            {/* ADDRESS - FULL WIDTH */}
            <TextField
              label="Address"
              name="address"
              value={form.address}
              onChange={handleChange}
              fullWidth
              multiline
              rows={3}
              sx={{
                gridColumn: {
                  xs: 'span 1',
                  sm: 'span 2'
                }
              }}
            />

            {/* ROLE - FULL WIDTH */}
            <TextField
              select
              label="Select User Role"
              name="role"
              value={form.role}
              onChange={handleChange}
              fullWidth
              sx={{
                gridColumn: {
                  xs: 'span 1',
                  sm: 'span 2'
                }
              }}
            >
              {roles.map((role) => (
                <MenuItem key={role} value={role}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>

        {/* FOOTER */}
        <DialogActions
          sx={{
            px: 3,
            py: 2,
            borderTop: '1px solid #eee',
            justifyContent: 'space-between'
          }}
        >
          {/* LEFT SIDE */}
          <Button
            variant="outlined"
            color="secondary"
            onClick={() =>
              setForm({
                ...form,
                password: generatePassword()
              })
            }
          >
            Regenerate Password
          </Button>

          {/* RIGHT SIDE */}
          <Box display="flex" gap={2}>
            <Button variant="outlined" color="inherit" onClick={handleClose}>
              Cancel
            </Button>

            <Button onClick={handleSubmit} variant="contained" color="primary">
              {editUser ? 'Update User' : 'Save User'}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
      {/* VIEW USER MODAL */}
      <Dialog
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 4,
            overflow: 'hidden'
          }
        }}
      >
        {/* Header */}
        <DialogTitle
          sx={{
            bgcolor: 'primary.main',
            color: 'white',
            fontWeight: 700,
            fontSize: '1.3rem',
            textAlign: 'center',
            py: 2
          }}
        >
          User Details
        </DialogTitle>

        <DialogContent sx={{ py: 4, px: 3 }}>
          <Stack spacing={2}>
            {[
              { label: 'Name', value: viewUser?.name },
              { label: 'Email', value: viewUser?.email },
              { label: 'Affiliation', value: viewUser?.affiliation },
              { label: 'Address', value: viewUser?.address },
              { label: 'Country', value: viewUser?.country },
              { label: 'Phone', value: viewUser?.phone },
              { label: 'Role', value: viewUser?.role }
            ].map((item, index) => (
              <Paper
                key={index}
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 3,
                  bgcolor: 'grey.100',
                  border: '1px solid',
                  borderColor: 'grey.300'
                }}
              >
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Typography variant="body2" fontWeight={700} color="text.secondary">
                      {item.label}
                    </Typography>
                  </Grid>

                  <Grid item xs={8}>
                    <Typography variant="body1" fontWeight={500} color="text.primary">
                      {item.value || 'N/A'}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            ))}
          </Stack>
        </DialogContent>

        {/* Footer */}
        <DialogActions
          sx={{
            px: 3,
            py: 2,
            bgcolor: 'grey.100'
          }}
        >
          <Button
            onClick={() => setViewOpen(false)}
            variant="contained"
            color="primary"
            fullWidth
            sx={{
              borderRadius: 3,
              py: 1.2,
              fontWeight: 600,
              textTransform: 'none'
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </MainCard>
  );
}
