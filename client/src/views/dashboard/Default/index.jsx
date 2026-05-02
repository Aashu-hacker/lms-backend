import { useEffect, useState } from 'react';

// material-ui
import Grid from '@mui/material/Grid';

// project imports
import EarningCard from './EarningCard';
import PopularCard from './PopularCard';
import TotalOrderLineChartCard from './TotalOrderLineChartCard';
import TotalIncomeDarkCard from '../../../ui-component/cards/TotalIncomeDarkCard';
import TotalIncomeLightCard from '../../../ui-component/cards/TotalIncomeLightCard';
import TotalGrowthBarChart from './TotalGrowthBarChart';

import { gridSpacing } from 'store/constant';

// assets
import StorefrontTwoToneIcon from '@mui/icons-material/StorefrontTwoTone';

import React from 'react';
import { Typography, Box, Paper, Avatar, Stack } from '@mui/material';
import { AdminPanelSettings } from '@mui/icons-material';

// ==============================|| DEFAULT DASHBOARD ||============================== //


// ✅ DASHBOARD WELCOME USING AUTH USER DATA
// Assumes logged-in user data is stored in localStorage after login:
// localStorage.setItem("user", JSON.stringify(response.data.user));

export default function Dashboard() {
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  const user = JSON.parse(localStorage.getItem('user'));

  return (
     <Paper
      elevation={3}
      sx={{
        p: 4,
        borderRadius: 4,
        background: 'linear-gradient(135deg, #1976d2, #42a5f5)',
        color: 'white',
        mb: 4
      }}
    >
      <Stack direction="row" spacing={3} alignItems="center">
        {/* Avatar */}
        <Avatar
          sx={{
            width: 70,
            height: 70,
            bgcolor: 'white',
            color: 'primary.main'
          }}
        >
          <AdminPanelSettings fontSize="large" />
        </Avatar>

        {/* Welcome Text */}
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Welcome, {user?.name || 'User'} 👋
          </Typography>

          <Typography variant="h6" sx={{ opacity: 0.9, mt: 1 }}>
            Role: {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) || 'N/A'}
          </Typography>

          <Typography variant="body1" sx={{ opacity: 0.8, mt: 1 }}>
            Glad to see you back on your dashboard.
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}
